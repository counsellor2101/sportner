import api from "../api/api";
import {
  getBackendPlatform,
  getPushEnvironment,
} from "./pushEnvironment";
import { Capacitor } from "@capacitor/core";

const WEB_VAPID_KEY =
  "BLWboZV6VqGmbkM2Lc1lDcq371-E1f93M0dsNZW0l7fHSE5Tm-iKhP64RTss7K075sabozPQwCskmA0ztH0hz6A";

export async function requestPushPermissionAndRegister() {
  const env = getPushEnvironment();

  if (env === "native") {
    return registerNativePush();
  }

  return registerWebPush();
}

async function registerWebPush() {
  if (typeof Notification === "undefined") {
    return false;
  }

  let permission;

try {
  permission = await Notification.requestPermission();
} catch (e) {

  return false;
}

if (permission !== "granted") {
  return false;
}

  const { getToken } = await import("firebase/messaging");
  const { messaging } = await import("../firebase");

let token = null;

try {
  token = await getToken(messaging, {
    vapidKey: WEB_VAPID_KEY,
  });
} catch (e) {

  return false;
}



  if (!token) {
    return false;
  }

  await api.post("/me/push-token", {
    token,
    platform: getBackendPlatform(), // web
  });

  return true;
}

async function registerNativePush() {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permission = await PushNotifications.requestPermissions();

  if (permission?.receive !== "granted") {
    return false;
  }

  return new Promise(async (resolve) => {
    let finished = false;
    let registrationListener = null;
    let errorListener = null;

    function finish(result) {
      if (finished) return;

      finished = true;

      try {
        registrationListener?.remove();
        errorListener?.remove();
      } catch {}

      resolve(result);
    }

    const timeoutId = window.setTimeout(() => {
      finish(false);
    }, 15000);

    try {
      registrationListener = await PushNotifications.addListener(
        "registration",
        async (token) => {
          try {
            if (!token?.value) {
              clearTimeout(timeoutId);
              finish(false);
              return;
            }
              
              

              let finalToken = token.value;

              if (Capacitor.getPlatform() === "ios") {

                finalToken = null;
              }

              if (Capacitor.getPlatform() === "ios") {

                  let nativeFCMToken = null;

                  // 🔥 FIRST wait for fresh token
                  nativeFCMToken = await new Promise((resolve) => {

                    const timeout = setTimeout(() => {

                      resolve(
                        window.nativeFCMToken ||
                        localStorage.getItem("native_fcm_token")
                      );

                    }, 5000);

                    function handler(event) {

                      clearTimeout(timeout);

                      window.removeEventListener(
                        "nativeFCMToken",
                        handler
                      );

                      resolve(event.detail?.token || null);
                    }

                    window.addEventListener(
                      "nativeFCMToken",
                      handler
                    );
                  });

                  if (
                    nativeFCMToken &&
                    nativeFCMToken.includes(":APA91")
                  ) {

                  console.log(
                    "🔥 USING NATIVE FCM TOKEN",
                    nativeFCMToken
                  );

                  finalToken = nativeFCMToken;
                }
              }
              
              if (!finalToken) {

                console.log("🔥 NO VALID FCM TOKEN");

                clearTimeout(timeoutId);
                finish(false);
                return;
              }

              await api.post("/me/push-token", {
                token: finalToken,
                platform: getBackendPlatform(), // android / ios
              });

            clearTimeout(timeoutId);
            finish(true);
          } catch {
            clearTimeout(timeoutId);
            finish(false);
          }
        }
      );

      errorListener = await PushNotifications.addListener(
        "registrationError",
        () => {
          clearTimeout(timeoutId);
          finish(false);
        }
      );

      await PushNotifications.register();
// 🔔 when push is received (app open)

    } catch {
      clearTimeout(timeoutId);
      finish(false);
    }
  });
}

export async function registerPushIfAlreadyGranted() {





  const env = getPushEnvironment();

    if (env === "native") {

      const { PushNotifications } =
        await import("@capacitor/push-notifications");

      const perm = await PushNotifications.checkPermissions();

      if (perm?.receive !== "granted") {
        return false;
      }

      return registerNativePush();
    }

  if (typeof Notification === "undefined") {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  return registerWebPush();
}


let listenersInitialized = false;

export async function initNativePushListeners() {
  if (listenersInitialized) return;
  listenersInitialized = true;

  const { PushNotifications } = await import("@capacitor/push-notifications");

  await PushNotifications.addListener(
    "pushNotificationReceived",
    () => {}
  );

  await PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const data =
        action.notification?.data ||
        action.notification;

      const link = data?.link;

      if (!link) return;

      window.dispatchEvent(
        new CustomEvent("pushNavigate", {
          detail: { path: link },
        })
      );
    }
  );
}
