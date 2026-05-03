import { useEffect, useRef, useState } from "react"
import intlTelInput from "intl-tel-input"
import "intl-tel-input/build/css/intlTelInput.css"



export default function ProfileRow({
  label,
  value,
  editable = false,
  onSave,
  type = "text",
  options = [],
  placeholder = ""
}) {
  const [editing, setEditing] = useState(false)
  const [tempValue, setTempValue] = useState(value ?? "")
  const inputRef = useRef(null)

useEffect(() => {
  if (!editing) {
    setTempValue(value ?? "")
  }
}, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

const itiRef = useRef(null)

useEffect(() => {

  if (!editing) return
  if (label !== "Phone") return
  if (!inputRef.current) return
  if (itiRef.current) return

  const iti = intlTelInput(inputRef.current, {
    initialCountry: "bg",
    separateDialCode: true,
    nationalMode: false,
    autoPlaceholder: "polite",
    loadUtils: () => import("intl-tel-input/build/js/utils.js")
  })

  itiRef.current = iti

  if (value) {
    iti.setNumber(value)
  }

  return () => {
    iti.destroy()
    itiRef.current = null
  }

}, [editing, label])

  async function handleSave() {
  if (!onSave) return

  let finalValue = tempValue

  if (label === "Phone" && itiRef.current) {

    const iti = itiRef.current

    if (!iti.isValidNumber()) {
      alert("Invalid phone")
      return
    }

    finalValue = iti.getNumber()

    // 🔥 destroy ВЪТРЕ
    iti.destroy()
    itiRef.current = null
  }

  await onSave(finalValue)
  setEditing(false)
}

  function handleCancel() {
    setTempValue(value ?? "")
    setEditing(false)
  }

  async function handleKeyDown(e) {
    if (e.key === "Enter") {
      await handleSave()
    }
    if (e.key === "Escape") {
      handleCancel()
    }
  }

  return (
    <div className="profile-row">
      <div className="pr-left">
        <div className="pr-label">{label}</div>

        {editing ? (
          type === "select" ? (
            <select
              ref={inputRef}
              className="pr-input"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            >
              <option value="">{placeholder || "Select"}</option>
              {options.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
  ref={inputRef}
  className="pr-input"
  value={tempValue}   // ✅ вместо defaultValue
  placeholder={placeholder}
  onChange={(e) => setTempValue(e.target.value)} // ✅ ЗАДЪЛЖИТЕЛНО
  onKeyDown={handleKeyDown}
/>
          )
        ) : (
          <div className="pr-value">{value || "—"}</div>
        )}
      </div>

      {editable && (
        <div className="pr-actions">
          {editing ? (
            <>
              <button className="pr-btn save" onClick={handleSave}>
                ✓
              </button>
              <button className="pr-btn cancel" onClick={handleCancel}>
                ✕
              </button>
            </>
          ) : (
            <button className="pr-btn edit" onClick={() => setEditing(true)}>
              ✏️
            </button>
          )}
        </div>
      )}
    </div>
  )
}