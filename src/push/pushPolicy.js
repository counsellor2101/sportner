import { getPushEnvironment } from "./pushEnvironment";
import { getPushPromptState, PUSH_COOLDOWNS } from "./pushStorage";

const ALLOWED_SOURCES = new Set([
  "profile",
  "create_game",
  "join_game",
]);

function isAllowedSource(source) {
  return ALLOWED_SOURCES.has(source);
}

function isCooldownActive(timestamp, cooldownMs) {
  if (!timestamp) return false;
  return Date.now() - Number(timestamp) < cooldownMs;
}

async function getNativePermissionStatus() {
  try {

const { PushNotifications } = await import("@capacitor/push-notifications");

    const status = await PushNotifications.checkPermissions();
    return status?.receive || "prompt";
  } catch {
    return "unsupported";
  }
}

function getWebPermissionStatus() {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}

export async function canShowPushPrompt({ source } = {}) {
  if (!isAllowedSource(source)) {
    return false;
  }

  const env = getPushEnvironment();
  const state = getPushPromptState();

  if (isCooldownActive(state.lastShownAt, PUSH_COOLDOWNS.normal)) {
    return false;
  }

  if (env === "native") {
    const permission = await getNativePermissionStatus();

    if (permission === "granted") {
      return false;
    }

    if (permission === "denied") {
      return !isCooldownActive(state.deniedAt, PUSH_COOLDOWNS.denied);
    }

    return true;
  }

  const permission = getWebPermissionStatus();

  if (permission === "unsupported") {
    return false;
  }

  if (permission === "granted") {
    return false;
  }

  if (permission === "denied") {
    return !isCooldownActive(state.deniedAt, PUSH_COOLDOWNS.denied);
  }

  return true;
}

export async function getPushPermissionState() {
  const env = getPushEnvironment();

  if (env === "native") {
    try {

const { PushNotifications } = await import("@capacitor/push-notifications");
      const status = await PushNotifications.checkPermissions();
      return status?.receive || "prompt";
    } catch {
      return "unsupported";
    }
  }

  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}