import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import "../styles/header.css"
import { useNavigate } from "react-router-dom"
import { Capacitor } from "@capacitor/core"

export default function Header({ onMenuToggle }){


const [unread, setUnread] = useState(0)
const [messagesUnread, setMessagesUnread] = useState(0)
const navigate = useNavigate()
const loadingRef = useRef(false)


useEffect(() => {

  loadUnread()

  function handleUpdate(){
    loadUnread()
  }

  window.addEventListener(
  "notificationsUpdated",
  handleUpdate
)

let interval = null

if (!Capacitor.isNativePlatform()) {

  interval = setInterval(
    loadUnread,
    15000
  )

}

return () => {

  if (interval) {
    clearInterval(interval)
  }

  window.removeEventListener(
    "notificationsUpdated",
    handleUpdate
  )

}

}, [])

async function loadUnread(){

  if (loadingRef.current) return

  loadingRef.current = true

  try{

    const [
  notifRes,
  msgRes
] = await Promise.all([

  api.get(
    "/me/notifications/unread-count",
    { silent: true }
  ),

  api.get(
    "/messages/unread-count",
    { silent: true }
  )

])

    const notifUnread =
      notifRes.data?.unread ??
      notifRes.data?.count ??
      0

    const msgUnread =
      msgRes.data?.unread ??
      msgRes.data?.count ??
      0

    setUnread(notifUnread)
    setMessagesUnread(msgUnread)

  }catch(e){

    console.error("notif error", e)

  } finally {

    loadingRef.current = false

  }
}

const totalUnread = unread + messagesUnread

return(

<header className="app-header">

<div className="header-left">

<button className="menu-btn" onClick={onMenuToggle}>
☰
</button>

</div>

<div className="header-center">

  <img src="/images/logo_app.png" className="app-logo" />


</div>

<div className="header-right">

<div 
  className="header-icon notification-icon"
  onClick={() => navigate("/notifications-list")}
>

<img src="/images/bell.png" alt="Notifications" />

{totalUnread > 0 && (
  <span className="notification-badge">
    {totalUnread}
  </span>
)}

</div>

</div>

</header>

)

}