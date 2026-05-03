import { texts } from "../i18n/texts";
import "../styles/push-prompt.css";

export default function PushPrompt({ onAccept, onDecline, loading, permission }) {

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase();
  const t = texts[lang] ?? texts.bg;

  return (
    <div className="push-page">
      <div className="push-container">

        <div className="push-card">

          <div className="push-title">
            {t.push_enable_title}
          </div>

          <div className="push-sub">
  {permission === "denied"
    ? (t.push_enable_settings_desc || "Enable notifications from settings")
    : t.push_enable_desc}
</div>

          <div className="push-actions">

            <button
              className="push-btn-primary"
              disabled={loading}
              onClick={onAccept}
            >
              {loading
  ? (t.loading || "Loading...")
  : permission === "denied"
    ? (t.push_open_settings || "Open settings")
    : t.push_enable_btn}
            </button>

            <button
              className="push-btn-secondary"
              disabled={loading}
              onClick={onDecline}
            >
              {t.push_not_now}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}