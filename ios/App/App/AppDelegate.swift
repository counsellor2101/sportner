import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging
import WebKit

class SettingsHandler: NSObject, WKScriptMessageHandler {

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {

        guard message.name == "openAppSettings" else {
            return
        }

        guard let url = URL(string: UIApplication.openSettingsURLString) else {
            return
        }

        DispatchQueue.main.async {
            UIApplication.shared.open(url)
        }
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        FirebaseApp.configure()
        Messaging.messaging().delegate = self
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {

            if let bridgeVC =
                self.window?.rootViewController as? CAPBridgeViewController {

                bridgeVC.bridge?.webView?.configuration
                    .userContentController
                    .add(
                        SettingsHandler(),
                        name: "openAppSettings"
                    )
            }
        }

        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {}

    func applicationDidEnterBackground(_ application: UIApplication) {}

    func applicationWillEnterForeground(_ application: UIApplication) {}

    func applicationDidBecomeActive(_ application: UIApplication) {}

    func applicationWillTerminate(_ application: UIApplication) {}

    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {

        return ApplicationDelegateProxy.shared.application(
            app,
            open: url,
            options: options
        )
    }

    func application(
        _ application: UIApplication,
        continue userActivity: NSUserActivity,
        restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
    ) -> Bool {

        return ApplicationDelegateProxy.shared.application(
            application,
            continue: userActivity,
            restorationHandler: restorationHandler
        )
    }

    // 🔥 APNs SUCCESS
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {

        Messaging.messaging().apnsToken = deviceToken

        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )

        print("🍎 APNS REGISTERED")
    }

    // 🔥 APNs FAILED
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {

        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )

        print("🍎 APNS FAILED: \(error.localizedDescription)")
    }
    
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {

        guard let token = fcmToken else {
            return
        }

        print("🔥 FCM TOKEN: \(token)")

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {

            if let bridge = self.window?.rootViewController as? CAPBridgeViewController {

                let js = """
                window.nativeFCMToken = '\(token)';

                localStorage.setItem(
                  'native_fcm_token',
                  '\(token)'
                );

                window.dispatchEvent(
                  new CustomEvent('nativeFCMToken', {
                    detail: {
                      token: '\(token)'
                    }
                  })
                );
                """

                bridge.bridge?.webView?.evaluateJavaScript(js)
            }
        }
    }
}
