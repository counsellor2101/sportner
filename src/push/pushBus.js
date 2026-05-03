export const PUSH_PROMPT_EVENT = "sportner:push-prompt";

export function triggerPushPrompt(source) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(PUSH_PROMPT_EVENT, {
      detail: {
        source,
        triggeredAt: Date.now(),
      },
    })
  );
}

export function subscribePushPrompt(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  function handler(event) {
    callback(event.detail || {});
  }

  window.addEventListener(PUSH_PROMPT_EVENT, handler);

  return () => {
    window.removeEventListener(PUSH_PROMPT_EVENT, handler);
  };
}