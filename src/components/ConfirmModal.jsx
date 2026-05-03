import "../styles/confirm-modal.css"
import { createPortal } from "react-dom"
import { useEffect } from "react"

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "default" // "danger"
}) {

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="cm-overlay" onClick={onCancel}>

      <div
        className="cm-sheet"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="cm-handle"></div>

        <div className="cm-title">
          {title}
        </div>

        <div className="cm-message">
          {message}
        </div>

        <div className="cm-actions">

          <button
            className="cm-btn cm-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            className={`cm-btn cm-confirm ${type === "danger" ? "danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>

        </div>

      </div>

    </div>,
    document.body
  )
}