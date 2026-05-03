import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import AppShell from "../components/AppShell"
import "../styles/screen.css"
import "../styles/notification.css"
import "../styles/innapp_notification.css"
import { texts } from "../i18n/texts"
import { mapNotification } from "../utils/notificationMapper"
import ReportModal from "../components/ReportModal"
import { useAuth } from "../context/authcontext"

export default function Notifications(){

  const [items, setItems] = useState([])

const [filter, setFilter] = useState("all")

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg
const [replyUserId, setReplyUserId] = useState(null)
const { user } = useAuth()

const lastIdsRef = useRef("")

const loadingRef = useRef(false)

async function load(){

  if (loadingRef.current) return
  loadingRef.current = true

  try{
    const res = await api.get("/me/notifications")
    const newData = res.data?.data || []

    const ids = newData.map(i => `${i.id}-${i.is_read}`).join(",")

    if (ids !== lastIdsRef.current) {
      setItems(newData)
      lastIdsRef.current = ids
    }

  }catch(e){
    console.error(e)
  } finally {
    loadingRef.current = false
  }
}

useEffect(() => {
  load()

  const interval = setInterval(load, 15000)
  return () => clearInterval(interval)
}, [])



  

  async function markAllRead(){
    try{
      // 🔥 optimistic update
setItems(prev =>
  prev.map(item => ({ ...item, is_read: 1 }))
)

window.dispatchEvent(new Event("notificationsUpdated"))

try {
  await api.post("/me/notifications/read-all")
} catch (e) {
  console.error(e)
  load() // fallback
}

    }catch(e){
      console.error(e)
    }
  }







  return(
    <AppShell pageClass="app-layout">

      <div className="screen">

        {/* HEADER */}
        <div className="discover-panel">
          <div className="discover-title">
            {t.in_app_notifications || "Notifications"}
          </div>
        </div>


<div className="timeline">
        <div>
          <button
  type="button"
  className="notif-clear-btn"
  onClick={markAllRead}
>
  {t.mark_all_read || "Mark all read"}
</button>
        </div>

        <div className="filters-selected">

  <div
    className={`filter-chip ${filter === "all" ? "" : "active"}`}
    onClick={() => setFilter("all")}
  >
    {t.all || "All"}
  </div>

  <div
    className={`filter-chip ${filter === "games" ? "" : "active"}`}
    onClick={() => setFilter("games")}
  >
    {t.games || "Games"}
  </div>

  <div
    className={`filter-chip ${filter === "messages" ? "" : "active"}`}
    onClick={() => setFilter("messages")}
  >
    {t.messages || "Messages"}
  </div>

</div>

        {items.length === 0 && (
          <p>{t.no_notifications || "You do not have any notifications yet"}</p>
        )}

        {items.length > 0 && (

          <div className="inappnotifications notif-compact">
{items
  .filter(n => {

    if (filter === "all") return true

    if (filter === "games") {
      return n.type !== "player_contact"
    }

    if (filter === "messages") {
      return n.type === "player_contact"
    }

    return true
  })
  .map(n => {

const mapped = mapNotification(n, t)

              // 🔥 normalize (ако backend връща "0"/"1")
              const isUnread = !Number(n.is_read)

let payload = {}

try {
  payload = n.data ? JSON.parse(n.data) : {}
} catch(e) {
  console.log("payload parse error", e)
}

const formattedDate = payload.date
  ? new Date(payload.date).toLocaleDateString(lang === "bg" ? "bg-BG" : "en-US", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  : null



              return (

                <div
                  key={n.id}
                  className={`inappnotifications-item ${isUnread ? "unread" : ""}`}
                 onClick={async () => {

  if (isUnread) {

  // 🔥 optimistic update (instant UX)
  setItems(prev =>
    prev.map(item =>
      item.id === n.id ? { ...item, is_read: 1 } : item
    )
  )

  window.dispatchEvent(new Event("notificationsUpdated"))

  try {
    await api.post(`/me/notifications/${n.id}/read`)
  } catch (e) {
    console.error(e)
    load() // fallback ако fail-не
  }
}

}}
                >

                  <div className="inappnotifications-content">

  {isUnread && <div className="inappnotifications-dot" />}

  <div className="inappnotifications-texts">

    <div className={`inappnotifications-title ${isUnread ? "unread" : ""}`}>
{mapped.title}
    </div>

    <div className={`inappnotifications-body ${isUnread ? "unread" : ""}`}>
      {mapped.body}
    </div>

    <div className={`inappnotifications-meta ${isUnread ? "unread" : ""}`}>

  {/* SPORT + VENUE */}
  {/* 🔥 SPORT HEADER */}
<div className="gdm-content-compact">

  <div className="gdm-sport-header-compact">

    {/* ICON */}
    {payload.sport_icon && (
      <img
        src={`/images/${payload.sport_icon}`}
        className="gdm-sport-icon"
        alt={payload.sport}
      />
    )}

    {/* SPORT NAME */}
    {payload.sport && (
      <div className="gdm-sport-title">
        {payload.sport}
      </div>
    )}

    {/* LEVEL */}
    {payload.level && (
      <div className={`level-badge level-${payload.level}`}>
        <span className="level-dot"></span>
        <span className="level-text">
          {payload.level}
        </span>
      </div>
    )}

    {/* COURT */}
    {typeof payload.court_reserved !== "undefined" && (
      <div
        className={`level-badge court-badge ${
          payload.court_reserved ? "reserved" : "not-reserved"
        }`}
      >
        <span className="level-text">
          {payload.court_reserved
            ? (t.court_reserved || "Reserved")
            : (t.court_not_reserved || "Not reserved")}
        </span>
      </div>
    )}

  </div>
{/* GROUP NAME */}
{payload.group_name && (
  <div className="gdm-group-name">
    {payload.group_name}
  </div>
)}
  <div className="game-divider"></div>

</div>

  {/* DATE */}
<div className="gdm-info">

  {/* DATE */}
  {formattedDate && (
    <div className="gdm-info-row-compact">
      <img src="/images/calendar_icon.png" className="row-icon" />
      {formattedDate}
    </div>
  )}

  {/* TIME */}
  {payload.time && (
    <div className="gdm-info-row-compact">
      <img src="/images/clock_icon.png" className="row-icon" />
      {payload.time}
    </div>
  )}

  {/* VENUE */}
  {payload.venue && (
    <div className="gdm-info-row-compact">
      <img src="/images/location_icon.png" className="row-icon" />
      {payload.venue}
    </div>
  )}

</div>

</div>

    {payload.game_id && (
      <button
  className="inappnotifications-btn"
  onClick={(e) => {
    e.stopPropagation()  // 🔥 МНОГО ВАЖНО
    window.location.href = payload.link || `/game/${payload.game_id}`
  }}
>
  {t.view_game || "View Game"}
</button>
    )}

{mapped.type === "player_contact" && (
  <button
    className="inappnotifications-btn"
    onClick={(e) => {
      e.stopPropagation()
      setReplyUserId(payload.from_user_id)
    }}
  >
    {t.reply || "Reply"}
  </button>
)}

  </div>

</div>

                </div>

              )
            })}

          </div>

        )}

      </div>
    </div>

<ReportModal
  open={!!replyUserId}
  onClose={() => setReplyUserId(null)}
  user={user?.user} // 🔥 не ни трябва тук
  type="contact_player"
  targetUserId={replyUserId}
/>
    </AppShell>
  )
}