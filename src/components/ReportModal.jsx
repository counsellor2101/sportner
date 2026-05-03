import { useState } from "react"
import api from "../api/api"
import { texts } from "../i18n/texts"
import "../styles/pwa-install.css"

export default function ReportModal({
  open,
  onClose,
  user,
  type = "report",
  targetUserId = null
}) {

  const [text, setText] = useState("")
  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

  if (!open) return null

  return (
    <div className="pwa-overlay" onClick={onClose}>
      <div
        className="pwa-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pwa-card">

          <div className="pwa-title">
  {type === "suggestion"
    ? (t.suggest_title || "Suggest venue / sport")
    : type === "contact_player"
    ? (t.contact_player || "Contact player")
    : (t.report_problem || "Report a problem")}
</div>

          <div className="pwa-sub">
  {type === "suggestion"
    ? (t.suggest_sub || "Tell us what to add")
    : type === "contact_player"
    ? (t.contact_player_desc || "Send a message to this player")
    : t.report_subtitle}
</div>

          <textarea
            className="report-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
  type === "suggestion"
    ? (t.suggest_placeholder || "Venue name, city, sport...")
    : type === "contact_player"
    ? (t.contact_player_placeholder || "Write your message...")
    : t.report_placeholder
}
          />

          <button
            className="pwa-btn pwa-btn-primary"
            disabled={!text.trim()}
            onClick={async () => {
              if (!text.trim()) return

              const payload = {
  message: text,
  type,

  target_user_id: targetUserId, // 🔥

  user: {
    id: user?.id,
    email: user?.email,
    nickname: user?.nickname
  },

  context: {
    page: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  }
}

              try{
                await api.post("/me/report", payload)

                alert(
  type === "suggestion"
    ? (t.suggest_sent || "Suggestion sent")
    : type === "contact_player"
    ? (t.message_sent || "Message sent")
    : (t.report_sent || "Report sent")
)
              }catch(e){
                alert(t.report_error || "Failed to send")
              }

              setText("")
              onClose()
            }}
          >
            {t.send || "Send"}
          </button>

          <button
            className="pwa-btn pwa-btn-secondary"
            onClick={onClose}
          >
            {t.cancel || "Cancel"}
          </button>

        </div>
      </div>
    </div>
  )
}