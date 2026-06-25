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
const [messageItems, setMessageItems] = useState([])

const [openConversation, setOpenConversation] = useState(null)
const [conversationMessages, setConversationMessages] = useState([])
const [loadingConversation, setLoadingConversation] = useState(false)

const [filter, setFilter] = useState("games")

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg
const [replyUserId, setReplyUserId] = useState(null)
const { user } = useAuth()

const lastIdsRef = useRef("")

const loadingRef = useRef(false)

async function load(silent = false){

  if (loadingRef.current) return
  loadingRef.current = true

  try{
    const [res, msgRes] = await Promise.all([

  api.get("/me/notifications", {
    silent
  }),

  api.get("/messages/inbox", {
    silent
  })

])

const newData = res.data?.data || []
const inbox = msgRes.data?.data || []

setMessageItems(inbox)

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
}, [])

async function toggleConversation(userId){

  // close
  if (openConversation === userId) {

    setOpenConversation(null)
    setConversationMessages([])

    return
  }

  try {

    setLoadingConversation(true)

    const res = await api.get(
      `/messages/${userId}`
    )

    setConversationMessages(
      res.data?.data || []
    )

    setOpenConversation(userId)

  } catch(e) {

    console.error(e)

  } finally {

    setLoadingConversation(false)

  }
}


useEffect(() => {

  const refresh = () => {
  load(true)
}

  // 🔥 refresh когато app-ът прати event
  window.addEventListener("notificationsUpdated", refresh)

  // 🔥 refresh при връщане в app-а
const onFocus = () => {
  load(true)
}

  window.addEventListener("focus", onFocus)

  // 🔥 iOS / Android WebView resume
  const onVisibility = () => {
    if (!document.hidden) {
  load(true)
}
  }

  document.addEventListener("visibilitychange", onVisibility)

  return () => {

    window.removeEventListener(
      "notificationsUpdated",
      refresh
    )

    window.removeEventListener(
      "focus",
      onFocus
    )

    document.removeEventListener(
      "visibilitychange",
      onVisibility
    )

  }

}, [])



  

  async function markAllRead(){
    try{
      // 🔥 optimistic update
setItems(prev =>
  prev.map(item => ({ ...item, is_read: 1 }))
)

try {

  await Promise.all([
    api.post("/me/notifications/read-all"),
    api.post("/messages/read-all")
  ])

  window.dispatchEvent(
    new Event("notificationsUpdated")
  )

  load(true)

} catch (e) {

  console.error(e)

  load()

}

    }catch(e){
      console.error(e)
    }
  }

function extractSportnerLink(text){
  return text?.match(/https?:\/\/sportner\.online\/\S+/)?.[0] || null
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
  className={`filter-chip ${filter === "games" ? "" : "active"}`}
  onClick={() => setFilter("games")}
>

  {(items || []).some(
  n =>
    n.type !== "player_contact"
    && !Number(n.is_read)
) && (
    <span className="tab-unread-dot" />
  )}

  {t.games || "Games"}

</div>

  <div
  className={`filter-chip ${filter === "messages" ? "" : "active"}`}
  onClick={() => setFilter("messages")}
>

  {(messageItems || []).some(
    m => Number(m.unread_count) > 0
  ) && (
    <span className="tab-unread-dot" />
  )}

  {t.messages || "Messages"}

</div>

</div>

        {filter !== "messages" && items.length === 0 && (
  <p>{t.no_notifications || "You do not have any notifications yet"}</p>
)}

{filter === "messages" && messageItems.length === 0 && (
  <p>{t.no_messages || "No messages yet"}</p>
)}

        {(items.length > 0 || messageItems.length > 0) && (

          <div className="inappnotifications notif-compact">

{filter === "messages" ? (

  messageItems.map(m => (

    <div
      key={m.id}
      className={`chat-thread-card ${
  Number(m.unread_count) ? "unread" : ""
}`}
    >

<div className={`conversation-user-header ${
  Number(m.unread_count) ? "unread" : ""
}`}>
{Number(m.unread_count) > 0 && (
  <div className="inappnotifications-dot" />
)}
            {m.other_user_name}
          </div>

      <div className="chat-thread-body">



        <div className="chat-thread-texts">

          


          <div className={`inappnotifications-body ${
  Number(m.unread_count) ? "unread" : ""
}`}>

  <strong>
  {Number(m.sender_id) === Number(user?.id)
    ? (t.me || "Me")
    : m.sender_name}
  :
</strong>{" "}

  {m.message}

</div>

          {!!Number(m.unread_count) && (
            <div className="inappnotifications-meta unread">
              {m.unread_count} {t.unread || "unread"}
            </div>
          )}

<button
  className="inappnotifications-btn"
  onClick={(e) => {

    e.stopPropagation()

setMessageItems(prev =>
  prev.map(item =>
    item.other_user_id === m.other_user_id
      ? {
          ...item,
          unread_count: 0
        }
      : item
  )
)

    toggleConversation(m.other_user_id)

  }}
>
  {openConversation === m.other_user_id
    ? (t.close || "Close")
    : (t.open || "Open")}
</button>

<button
  className="background-replybtn"
  onClick={(e) => {

    e.stopPropagation()

    setReplyUserId(m.other_user_id)

  }}
>
  {t.reply || "Reply"}
</button>

{openConversation === m.other_user_id && (

  <div className="conversation-expanded">

    {loadingConversation && (
      <div className="conversation-loading">
        Loading...
      </div>
    )}

    {!loadingConversation && conversationMessages.map(msg => {

      const mine =
        Number(msg.sender_id) === Number(user?.user?.id)

      return (

        <div
          key={msg.id}
          className={`conversation-msg ${
            mine ? "mine" : "theirs"
          }`}
        >
<strong>
  {Number(msg.sender_id) === Number(user?.user?.id)
    ? (t.me || "Me")
    : msg.sender_name}
:
</strong>{" "}

{(() => {

  const link = extractSportnerLink(msg.message)

  if (!link) {
    return msg.message
  }

  return (
    <>
      {msg.message.replace(link, "").trim()}

      <button
        className="gdm-invite-btn"
        onClick={(e) => {

          e.stopPropagation()

          window.location.href = link

        }}
      >
        🔗 {t.open || "Open"}
      </button>
    </>
  )

})()}
        </div>

      )

    })}

  </div>

)}



        </div>

      </div>

    </div>

  ))

) : (

(

items
  .filter(n => {

  if (filter === "games") {
    return n.type !== "player_contact"
  }

  if (filter === "messages") {
    return false
  }

    

    return true
  })
  .map(n => {
const mapped = mapNotification(n, t)
const actionLink = extractSportnerLink(mapped.body)


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

  setItems(prev =>
    prev.map(item =>
      item.id === n.id ? { ...item, is_read: 1 } : item
    )
  )

  try {

    await api.post(
      `/me/notifications/${n.id}/read`
    )

    window.dispatchEvent(
      new Event("notificationsUpdated")
    )

  } catch (e) {

    console.error(e)

    load()

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
  {actionLink
    ? mapped.body.replace(actionLink, "").trim()
    : mapped.body}
</div>

{actionLink && (
  <button
    className="gdm-invite-btn"
    onClick={(e) => {
      e.stopPropagation()
      window.location.href = actionLink
    }}
  >
    🔗 {t.open || "Open"}
  </button>
)}

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
  <div className="gdm-group-chip">
    {payload.group_name}
  </div>
)}
  <div className="game-divider"></div>

</div>

  {/* DATE */}
<div className="gdm-info">

  {/* DATE */}
  {formattedDate && (
    <div className="gdm-info-row">
      <img src="/images/calendar_icon.png" className="gdm-info-icon" />
      {formattedDate}
    </div>
  )}

  {/* TIME */}
  {payload.time && (
    <div className="gdm-info-row">
      <img src="/images/clock_icon.png" className="gdm-info-icon" />
      {payload.time}
    </div>
  )}

  {/* VENUE */}
  {payload.venue && (
    <div className="gdm-info-row">
      <img src="/images/location_icon.png" className="gdm-info-icon" />
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
            })
)
)}

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