import { useEffect, useRef, useState } from "react"
import api from "../api/api"
import "../styles/profile.css"
import ReportModal from "./ReportModal"
import { useAuth } from "../context/authcontext"
import { texts } from "../i18n/texts"

export default function UserProfileModal({ userId, onClose }) {

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
const { user } = useAuth()
const [contactOpen, setContactOpen] = useState(false)

const sheetRef = useRef(null)
const startY = useRef(0)
const currentY = useRef(0)
const dragging = useRef(false)

  useEffect(() => {
    if (!userId) return

    setLoading(true)

    api.get(`/users/${userId}`)
      .then(res => {
        setData(res.data)
      })
      .catch(e => {
        console.log("load user error", e)
      })
      .finally(() => {
        setLoading(false)
      })

  }, [userId])

  const u = data?.user || {}
  const sports = data?.sports || []

function startDrag(e) {
  dragging.current = true
  startY.current = e.touches ? e.touches[0].clientY : e.clientY
}

function onDrag(e) {
  if (!dragging.current) return
  if (!sheetRef.current) return

  if (e.cancelable && dragging.current) {
    e.preventDefault()
  }

  currentY.current = e.touches
    ? e.touches[0].clientY
    : e.clientY

  const diff = currentY.current - startY.current

  if (diff > 0) {
    sheetRef.current.style.transition = "none"
    sheetRef.current.style.transform = `translateY(${diff}px)`
  }
}

function endDrag() {
  if (!dragging.current) return

  dragging.current = false

  const diff = currentY.current - startY.current

  if (diff > 120) {
    onClose() // 🔥 затваря
  } else {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(0)`
    }
  }
}

useEffect(() => {
  window.addEventListener("mousemove", onDrag)
  window.addEventListener("mouseup", endDrag)
  window.addEventListener("touchmove", onDrag)
  window.addEventListener("touchend", endDrag)

  return () => {
    window.removeEventListener("mousemove", onDrag)
    window.removeEventListener("mouseup", endDrag)
    window.removeEventListener("touchmove", onDrag)
    window.removeEventListener("touchend", endDrag)
  }
}, [])

  return (
    <div className="gdm-backdrop" onClick={onClose}>

<div
  className="gdm-sheet"
  ref={sheetRef}
  onClick={(e) => e.stopPropagation()}
>

        {/* HEADER */}
        <div className="gdm-top-gradient userprofile"
  onMouseDown={startDrag}
  onTouchStart={startDrag}>
          <div className="gdm-handle" />
        </div>

        {loading ? null : (

  <div className="screen">

            {/* AVATAR + NAME */}
            <div
  className="profile-discover-panel userprofile"
  onMouseDown={startDrag}
  onTouchStart={startDrag}
>

              <div className="profile-discover-title">

                <div className="profile-avatar">

                  {u.avatar ? (
                    <img src={u.avatar} alt="avatar" />
                  ) : (
                    <span>
                      {u.nickname?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}

                </div>

                <div className="profile-name">
                  {u.nickname || t.nickname}
                </div>

              </div>
            </div>

            <div className="profile-page">

              {/* INFO */}
              <div className="profile-card">

                <div className="profile-row">
                  <span>{t.nickname}</span>
                  <span>{u.nickname || "-"}</span>
                </div>



                <div className="profile-row">
                  <span>{t.city}</span>
                  <span>{u.city || "-"}</span>
                </div>

              </div>

<button
  type="button"
  className="notif-clear-btn"
  onClick={() => setContactOpen(true)}
>
  {t.contact_player}
</button>

              {/* SPORTS */}
              <div className="profile-section">

                <div className="profile-section-header">
                  <div className="profile-section-title">
                    {t.my_sports}
                  </div>
                </div>

                <div className="profile-sports">

                  {sports.length ? (
                    sports.map(s => (

                      <div
                        key={s.sport_id}
                        className="profile-sport-row"
                        style={{ borderLeft: `6px solid ${s.color}` }}
                      >

                        <div className="ps-left">

                          <div className="ps-icon">
                            <img src={`/images/${s.icon}`} alt={s.name_en} />
                          </div>

                          <div className="ps-info">

                            <div className="ps-row1">
                              <span className="ps-name">{s.name_en}</span>

                              <span className={`player-level level-${s.level || "beginner"}`}>
                                {s.level || "beginner"}
                              </span>
                            </div>

                            <div className="ps-row2">
  {t.player_side}{" "}
  <span className={`player-side ${s.preferred_side || "both"}`}>
    {t[`side_${s.preferred_side}`] || s.preferred_side}
  </span>
</div>

                          </div>

                        </div>

                      </div>

                    ))
                  ) : (
                    <div className="empty-state">
                      {t.user_no_sports}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>
<ReportModal
  open={contactOpen}
  onClose={() => setContactOpen(false)}
  user={user?.user}
  type="contact_player"
  targetUserId={userId}
/>

    </div>
  )
}