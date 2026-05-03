let deferredPrompt = null;

export function setInstallPrompt(e) {
  deferredPrompt = e;
}

export function getInstallPrompt() {
  return deferredPrompt;
}

export function clearInstallPrompt() {
  deferredPrompt = null;
}