import { Capacitor } from "@capacitor/core";

export async function openPushSettings() {
    // Native iOS bridge
    if (
      window.webkit?.messageHandlers?.openAppSettings
    ) {

      window.webkit.messageHandlers.openAppSettings.postMessage(null);

      return true;
    }

    // Native Android
    if (
      Capacitor.isNativePlatform() &&
      Capacitor.getPlatform() === "android" &&
      window.Android &&
      typeof window.Android.openAppSettings === "function"
    ) {
      window.Android.openAppSettings();
      return true;
    }

  // Web fallback
  alert("Enable notifications from browser settings");
  return false;
}
