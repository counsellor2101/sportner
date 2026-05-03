const STORAGE_KEY = "sportner_push_prompt_state";

export const PUSH_COOLDOWNS = {
  normal: 1000 * 60 * 60 * 24,        // 24h
  denied: 1000 * 60 * 60 * 24 * 7,    // 7 days
};

export function getPushPromptState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setPushPromptState(nextState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {}
}

export function patchPushPromptState(patch) {
  const current = getPushPromptState();

  setPushPromptState({
    ...current,
    ...patch,
    updatedAt: Date.now(),
  });
}

export function markPushPromptShown(source) {
  patchPushPromptState({
    lastShownAt: Date.now(),
    lastSource: source || null,
  });
}

export function markPushPromptDismissed(source) {
  patchPushPromptState({
    dismissedAt: Date.now(),
    dismissedSource: source || null,
  });
}

export function markPushPromptDenied(source) {
  patchPushPromptState({
    deniedAt: Date.now(),
    deniedSource: source || null,
  });
}

export function markPushPromptGranted(source) {
  patchPushPromptState({
    grantedAt: Date.now(),
    grantedSource: source || null,
  });
}