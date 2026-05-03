import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import "../styles/header.css"
import { useNavigate } from "react-router-dom"

export default function Header({ onMenuToggle }){


const [unread, setUnread] = useState(0)
const navigate = useNavigate()
const loadingRef = useRef(false)


useEffect(() => {
  loadUnread()

  // 🔥 слушаме за промени
  function handleUpdate(){
    loadUnread()
  }

  window.addEventListener("notificationsUpdated", handleUpdate)

  // optional polling
  const interval = setInterval(loadUnread, 15000)

  return () => {
    clearInterval(interval)
    window.removeEventListener("notificationsUpdated", handleUpdate)
  }
}, [])

async function loadUnread(){

  if (loadingRef.current) return

  loadingRef.current = true

  try{
    const res = await api.get("/me/notifications/unread-count")
    setUnread(res.data?.unread ?? res.data?.count ?? 0)
  }catch(e){
    console.error("notif error", e)
  } finally {
    loadingRef.current = false
  }
}

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

{unread > 0 && (
  <span className="notification-badge">
    {unread}
  </span>
)}

</div>

</div>

</header>

)

}