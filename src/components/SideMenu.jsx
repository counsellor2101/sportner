import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { texts } from "../i18n/texts"
import { useState, useEffect } from "react"
import "../styles/sidemenu.css"
import ReportModal from "../components/ReportModal"


export default function SideMenu({ open, onClose }) {


const navigate = useNavigate()
const { user, loading, refreshUser, logout } = useAuth()
const [reportOpen, setReportOpen] = useState(false)


const u = user?.user ?? {}
const [lang, setLang] = useState(localStorage.getItem("lang") || "bg")
const t = texts[lang] || texts.bg

const isNative =
  typeof window !== "undefined" && window.Capacitor?.isNativePlatform?.();








function changeLang(l){
  setLang(l)
  localStorage.setItem("lang", l)

  // 🔥 refresh app (както login page логиката)
  window.location.reload()
}

function handleLogout(){

  // 🔥 чистим ВСИЧКО
  localStorage.clear()
  sessionStorage.clear()

  logout?.()

  navigate("/login", { replace: true })
}

return (
<>
<div className={`side-menu ${open ? "open" : ""}`}>

  {/* 🔝 HEADER */}
  <div className="sm-header">

<button
    className="sm-close"
    onClick={onClose}
  >
    ✕
  </button>



    <div className="sm-user vertical">

  <div className="sm-avatar">
    {u.avatar ? (
      <img
        src={u.avatar}
        alt={u.nickname || "User"}
      />
    ) : (
      <span>
        {u.nickname?.charAt(0)?.toUpperCase() || "U"}
      </span>
    )}
  </div>

  <div className="sm-user-name">
    {u.nickname || "User"}
  </div>

</div>


</div>



  <div className="sm-bottomline">
  {/* 👤 PROFILE */}
  <div
    className="sm-item"
    onClick={() => {
      navigate("/profile")
      onClose?.()
    }}
  >
{t.profile || "Profile"}
  </div>

<div
    className="sm-item"
    onClick={() => {
      navigate("/notifications")
      onClose?.()
    }}
  >
{t.notification_menu || "Notification menu"}
  </div>

<div
    className="sm-item"
    onClick={() => {
      navigate("/venues")
      onClose?.()
    }}
  >
{t.venues || "Venues"}
  </div>



  {/* 🚪 LOGOUT */}
  <div
    className="sm-item logout"
    onClick={handleLogout}
  >
{t.logout || "Logout"}
  </div>
 </div>

  {/* 🌐 LANGUAGE */}


    <div className="sm-section">
    <div className="sm-lang">
      <button
        className={lang === "bg" ? "active" : "inactive"}
        onClick={() => changeLang("bg")}
      >
        BG
      </button>
<span>|</span>
      <button
        className={lang === "en" ? "active" : "inactive"}
        onClick={() => changeLang("en")}
      >
        EN
      </button>
    </div>
</div>

<div
  className="sm-item report"
  onClick={() => {
  setReportOpen(true)
  onClose?.() // ✅ затваря менюто
}}
>
  {t.report_problem || "Report problem"}
</div>

{!isNative && (
  <div
    className="sm-item report"
    onClick={async () => {
      const e = window.__installEvent;

      if (e) {
        e.prompt();
        const choice = await e.userChoice;
        console.log("PWA install:", choice.outcome);
      } else {
        alert("Use browser install button (top bar)");
      }
    }}
  >
    {t.install_PWA || "Install desktop"}
  </div>
)}



</div>
<ReportModal
  open={reportOpen}
  onClose={() => setReportOpen(false)}
  user={u}
  type="report"
/>
</>
)
}