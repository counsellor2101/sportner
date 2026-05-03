import { useCallback, useEffect, useRef, useState } from "react";
import { subscribePushPrompt } from "./pushBus";
import { canShowPushPrompt } from "./pushPolicy";
import {
  markPushPromptDenied,
  markPushPromptDismissed,
  markPushPromptGranted,
  markPushPromptShown,
} from "./pushStorage";
import { requestPushPermissionAndRegister } from "./pushService";
import { getPushPermissionState } from "./pushPolicy";
import { openPushSettings } from "./openSettings";
import { getPushPromptState } from "./pushStorage";

export function usePushPrompt() {
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(false);
const [permission, setPermission] = useState(null);

  const visibleRef = useRef(false);
  const checkingRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    return subscribePushPrompt(async ({ source }) => {
      if (visibleRef.current || checkingRef.current) {
        return;
      }

      checkingRef.current = true;

      try {
        const allowed = await canShowPushPrompt({ source });

        if (!allowed) {
          return;
        }

        markPushPromptShown(source);
        setSource(source);

const p = await getPushPermissionState();
setPermission(p);

        setVisible(true);
      } finally {
        checkingRef.current = false;
      }
    });
  }, []);

  const accept = useCallback(async () => {
  if (loading) return;

  setLoading(true);

  try {
    const currentPermission = await getPushPermissionState();

console.log("🔥 accept clicked");
console.log("🔥 currentPermission:", currentPermission);

    const state = getPushPromptState();

console.log("🔥 deniedAt:", state.deniedAt);

if (state.deniedAt) {
  try {
    await openPushSettings();
  } catch (e) {
    console.log("open settings error", e);
  }

  const updated = await getPushPermissionState();
  setPermission(updated);

  setVisible(false);
  setSource(null);
  return false;
}

    const ok = await requestPushPermissionAndRegister();
const updated = await getPushPermissionState();
setPermission(updated);

    if (ok) {
      markPushPromptGranted(source);
    } else {
      markPushPromptDenied(source);
    }

    setVisible(false);
    setSource(null);

    return ok;

  } finally {
    setLoading(false);
  }
}, [loading, source]);

  const decline = useCallback(() => {
    markPushPromptDismissed(source);
    setVisible(false);
    setSource(null);
  }, [source]);

  return {
  visible,
  source,
  loading,
  permission,
  accept,
  decline,
};
}