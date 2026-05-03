import { Capacitor } from "@capacitor/core";

export async function openPushSettings() {
  // Native Android (нашият bridge)
  if (window.Android && typeof window.Android.openAppSettings === "function") {
    window.Android.openAppSettings();
    return true;
  }

  // Native iOS (официален API)
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    try {
      const { App } = await import("@capacitor/app");
      await App.openSettings();
      return true;
    } catch (e) {
      console.log("ios settings error", e);
    }
  }

  // Web fallback
  alert("Enable notifications from browser settings");
  return false;
}