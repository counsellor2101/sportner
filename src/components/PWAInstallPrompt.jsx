import "../styles/pwa-install.css";
import { texts } from "../i18n/texts";

export default function PWAInstallPrompt({ open, onInstall, onClose }) {
  const lang = (localStorage.getItem("lang") || "bg").toLowerCase();
  const t = texts[lang] ?? texts.bg;

  if (!open) return null;

  return (
    <div className="pwa-overlay">
      <div className="pwa-container">
        <div className="pwa-card">

          <div className="pwa-title">
            {t.pwa_install_title}
          </div>

          <div className="pwa-sub">
            {t.pwa_install_sub}
          </div>

          <button
            className="pwa-btn pwa-btn-primary"
            onClick={onInstall}
          >
            {t.pwa_install_btn}
          </button>

          <button
            className="pwa-btn pwa-btn-secondary"
            onClick={onClose}
          >
            {t.pwa_install_later}
          </button>

        </div>
      </div>
    </div>
  );
}