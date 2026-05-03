import { useEffect, useRef, useState } from "react"
import api from "../api/api"
import "../styles/profile-setup-modal.css"
import { texts } from "../i18n/texts"
import { useAuth } from "../context/authcontext"



export default function ProfileSetupModal({ onClose, sport }) {

  const { refreshUser } = useAuth()



  const sportId = sport?.sport_id
  const sportName = sport?.sport_name
  const sportIcon = sport?.sport_icon
  const sportColor = sport?.sport_color || "#b30a0a"

  const [selectedLevel, setSelectedLevel] = useState(null)
const [preferredSide, setPreferredSide] = useState(null)
  const [loading, setLoading] = useState(false)

  const sheetRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg

  const levels = ["beginner", "intermediate", "advanced", "pro"]

  /* DRAG */

  function startDrag(e) {
    dragging.current = true
    startY.current = e.touches ? e.touches[0].clientY : e.clientY
    currentY.current = startY.current
    document.body.style.userSelect = "none"
  }

  function moveDrag(e) {
    if (!dragging.current) return
    if (!sheetRef.current) return

    if (e.cancelable) e.preventDefault()

    currentY.current = e.touches ? e.touches[0].clientY : e.clientY
    const diff = currentY.current - startY.current

    if (diff > 0) {
      sheetRef.current.style.transition = "none"
      sheetRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  function endDrag() {
    if (!dragging.current) return
    if (!sheetRef.current) return

    dragging.current = false

    const diff = currentY.current - startY.current

    sheetRef.current.style.transition = "transform .25s ease"

    if (diff > 120) {
      sheetRef.current.style.transform = "translateY(100%)"
      setTimeout(() => {
        onClose()
      }, 200)
    } else {
      sheetRef.current.style.transform = "translateY(0)"
    }

    document.body.style.userSelect = "auto"
  }


function handleBackdrop(e){
  if(e.target.classList.contains("psm-backdrop")){
    onClose()
  }
}


  useEffect(() => {

    function handleMove(e) {
      moveDrag(e)
    }

    function handleEnd() {
      endDrag()
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleMove, { passive: false })
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", handleEnd)
    }

  }, [])

  /* SAVE */

  async function saveProfile() {
    if (!sportId || !selectedLevel) return

    try {
      setLoading(true)

      const token = localStorage.getItem("access_token")

      await api.put(`/me/sports/${sportId}`, {
  level: selectedLevel,
preferred_side: preferredSide
})

      await refreshUser()
setTimeout(() => refreshUser(), 0)
      

      onClose()

    } catch (e) {
      console.log("profile save error", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="psm-backdrop" onClick={handleBackdrop}>

  <div className="psm-sheet" ref={sheetRef}>

    {/* TOP GRADIENT */}

    <div
      className="psm-top-gradient"
      style={{ "--sport-color": sportColor }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className="psm-handle" />
    </div>

    {/* SPORT HEADER */}

    <div className="psm-sport-header">
      <img
        src={`/images/${sportIcon}`}
        className="psm-sport-icon"
      />
      <div className="psm-sport-title">
        {sportName}
      </div>
    </div>

    <div className="game-divider"></div>

    <div className="psm-title">
     {t.complete_profile || "Complete profile"}
    </div>

    {/* LEVEL */}

    <div className="psm-section">
      <div className="psm-section-title">
        {t.select_level || "Select level"}
      </div>

      <div className="psm-levels">
        {levels.map(l => (
  <div
    key={l}
    className={`psm-level level-${l} ${selectedLevel === l ? "active" : ""}`}
    onClick={() => setSelectedLevel(l)}
  >
    {t[`level_${l}`] || l}
  </div>
))}
      </div>
    </div>

    {/* PREFERRED SIDE */}

    <div className="psm-section">
      <div className="psm-section-title">
        {t.player_side || "Preferred side"}
      </div>

      <div className="psm-sides">
        {["left", "right", "both"].map(side => (
          <div
            key={side}
            className={`psm-side ${preferredSide === side ? "active" : ""}`}
            onClick={() => setPreferredSide(side)}
          >
            {t[`side_${side}`] || side}
          </div>
        ))}
      </div>
    </div>

    {/* ACTION */}

    <div className="psm-action">
      <button
        className="psm-save-btn"
        onClick={saveProfile}
        disabled={!selectedLevel || loading}
      >
        {loading ? "..." : (t.save || "Save")}
      </button>
    </div>

  </div>

</div>
  )
}