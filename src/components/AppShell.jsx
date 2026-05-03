import "../styles/app-shell.css";
import Header from "./Header"
import BottomNav from "./BottomNav"
import { useEffect, useState } from "react"
import ProfileSetupModal from "./ProfileSetupModal"
import SideMenu from "./SideMenu"

export default function AppShell({ children, pageClass = "" }) {

const isLogin = pageClass === "login-page"
const [showProfileSetup, setShowProfileSetup] = useState(false)
const [profileSport, setProfileSport] = useState(null)
const [menuOpen, setMenuOpen] = useState(false)





useEffect(() => {

  function openProfileSetup(e){
  console.log("EVENT DETAIL:", e.detail)
  setProfileSport(e.detail || null)
  setShowProfileSetup(true)
}

  window.addEventListener("openProfileSetup", openProfileSetup)

  return () => {
    window.removeEventListener("openProfileSetup", openProfileSetup)
  }

}, [])

  return (
    <div className={`page ${pageClass}`}>
      <div className={`app-shell ${menuOpen ? "menu-open" : ""}`}>

        {!isLogin && <Header onMenuToggle={() => setMenuOpen(prev => !prev)} />}

<SideMenu
  open={menuOpen}
  onClose={() => setMenuOpen(false)}
/>

        <main className="app-content">
          {children}
        </main>

        {!isLogin && <BottomNav/>}


{showProfileSetup && (
  <ProfileSetupModal
    onClose={() => setShowProfileSetup(false)}
    sport={profileSport}
  />
)}



      </div>
    </div>
  );
}