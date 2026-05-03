import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom"
import { CreateGameProvider } from "./context/CreateGameContext"
import './index.css'
import App from './App.jsx'
import { AuthProvider } from "./context/AuthContext"
import { MetaProvider } from "./context/meta-context"
import { setInstallPrompt } from "./install";




createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
<MetaProvider>
<CreateGameProvider>
        <App />
</CreateGameProvider>
</MetaProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("SW registered"))
      .catch((err) => console.log("SW error", err));
  });
}



