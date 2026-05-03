import { Capacitor } from "@capacitor/core";

export function getPushEnvironment() {
  if (Capacitor.isNativePlatform()) {
    return "native";
  }

  const isStandalone =
    typeof window !== "undefined" &&
    (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true
    );

  if (isStandalone) {
    return "pwa";
  }

  return "web";
}

export function getBackendPlatform() {
  if (!Capacitor.isNativePlatform()) {
    return "web";
  }

  const platform = Capacitor.getPlatform();

  if (platform === "ios") return "ios";
  if (platform === "android") return "android";

  return "web";
}

export function isNativePushEnvironment() {
  return getPushEnvironment() === "native";
}

export function isWebPushEnvironment() {
  const env = getPushEnvironment();
  return env === "web" || env === "pwa";
}