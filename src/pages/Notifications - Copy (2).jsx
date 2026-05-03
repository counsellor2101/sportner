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
const [openGroup, setOpenGroup] = useState(null)
  const [items, setItems] = useState([])

const [filter, setFilter] = useState("all")

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg
const [replyUserId, setReplyUserId] = useState(null)
const { user } = useAuth()

const lastIdsRef = useRef("")





  

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







async function load(){
  try{
    if (filter === "messages") {
      const res = await api.get("/me/conversation")
      setItems(res.data?.data || [])
    } else {
      const res = await api.get("/me/notifications")
      setItems(res.data?.data || [])
    }
  }catch(e){
    console.error(e)
  }
}


useEffect(() => {
  load()

  const interval = setInterval(load, 10000)
  return () => clearInterval(interval)
}, [filter])














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

{filter === "messages" && items.map(group => {

  const last = (group.items || []).slice(-1)[0]

  return (
    <div
  key={group.user_id}
  className="inappnotifications-item"
  onClick={() =>
    setOpenGroup(prev => prev === group.user_id ? null : group.user_id)
  }
>

      <div className="inappnotifications-content">

        <div className="inappnotifications-texts">

          <div className="inappnotifications-title">
            {group.user_name}
          </div>

          <div className="inappnotifications-body">
            {last?.payload?.message || ""}
          </div>

          <div className="inappnotifications-meta">
            {(group.items || []).length} messages
          </div>

        </div>

        <button
          className="inappnotifications-btn"
          onClick={(e) => {
            e.stopPropagation()
            setReplyUserId(group.user_id)
          }}
        >
          {t.reply || "Reply"}
        </button>

      </div>
{openGroup === group.user_id && (

  <div className="notif-expanded">

    {(group.items || []).filter(Boolean).map(msg => (

      <div key={msg.id} className="notif-message-row">

        <div className="notif-message-text">
          <strong>
            {msg?.payload?.from_user_id === user?.user?.id ? "You" : group.user_name}:
          </strong>{" "}
          {msg?.payload?.message || ""}
        </div>

      </div>

    ))}

  </div>

)}
    </div>
  )
})}

{filter !== "messages" && items
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