import { useState, useEffect } from "react"
import "../styles/pwa-install.css"
import { texts } from "../i18n/texts"
import { getInstallPrompt, clearInstallPrompt } from "../install";

export default function PWAInstallPrompt(){

const [deferredPrompt, setDeferredPrompt] = useState(null);


  const [visible, setVisible] = useState(false)

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

useEffect(() => {
  const interval = setInterval(() => {
    const prompt = getInstallPrompt();

    if (prompt) {
      console.log("✅ prompt detected in component");

      setDeferredPrompt(prompt);
      clearInterval(interval);
    }
  }, 300);

  return () => clearInterval(interval);
}, []);

 useEffect(() => {
  if(!deferredPrompt) return

  if (window.location.pathname === "/login") return;

  const lastShown = localStorage.getItem("pwa_install_shown_at");

  const recentlyShown =
    lastShown && Date.now() - Number(lastShown) < 1000 * 60 * 60 * 24;

  if (recentlyShown) return;

  const timer = setTimeout(() => {
    localStorage.setItem("pwa_install_shown_at", Date.now());
    setVisible(true);
  }, 4000);

  return () => clearTimeout(timer);

}, [deferredPrompt]);

  async function handleInstall(){
    if(!deferredPrompt) return

    deferredPrompt.prompt()

    const { outcome } = await deferredPrompt.userChoice

    if(outcome === "accepted"){
clearInstallPrompt();
setDeferredPrompt(null);
      setVisible(false)
    }else{
      
      setVisible(false)
    }
  }

  function handleClose(){
    
    setVisible(false)
  }

  if(!visible) return null

  return(
    <div className="pwa-overlay">
      <div className="pwa-container">
        <div className="pwa-card">

          <div className="pwa-title">
            {t.pwa_install_title}
          </div>

          <div className="pwa-sub">
            {t.pwa_install_sub}
          </div>

          <button
            className="pwa-btn pwa-btn-primary"
            onClick={handleInstall}
          >
            {t.pwa_install_btn}
          </button>

          <button
            className="pwa-btn pwa-btn-secondary"
            onClick={handleClose}
          >
            {t.pwa_install_later}
          </button>

        </div>
      </div>
    </div>
  )
}