import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { texts } from "../i18n/texts";
import AppShell from "../components/AppShell";
import "../styles/login.css";
import { registerPushIfAlreadyGranted } from "../push/pushService";
import { Capacitor } from "@capacitor/core";

export default function Login(){



const location = useLocation();

  const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
  const t = texts[lang] || texts.bg;

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState(null);
  const [message,setMessage] = useState(null);
  const [loading,setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

const isNative = Capacitor.isNativePlatform();
const isIOS = Capacitor.getPlatform() === "ios";


function getSafeRedirect(raw) {
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(raw);

    // allow ONLY internal paths
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {}

  return null;
}

useEffect(() => {

  if (screen.orientation?.lock) {
    screen.orientation.lock("portrait").catch(()=>{});
  }

  return () => {
    if (screen.orientation?.unlock) {
      screen.orientation.unlock();
    }
  };

}, []);

  useEffect(() => {

  const params = new URLSearchParams(window.location.search);

  const redirect = params.get("redirect");

  // 🔥 пазим redirect
  if (redirect) {
    sessionStorage.setItem("pending_redirect", redirect);
  }

  // 🔥 правилни messages (без override)
  if (params.get("reset")) {
    setMessage(t.password_reset_success || "Password updated successfully");
  } 
  else if (params.get("verified")) {
    setMessage(t.email_verified_success || "Email verified successfully");
  } 
  else if (params.get("registered")) {
    setMessage(t.register_success || "Registration successful.");
  }

  // 🔥 чистим URL
  if (
  params.get("reset") ||
  params.get("verified") ||
  params.get("registered")
) {
  const redirect = params.get("redirect");

  if (redirect) {
    window.history.replaceState(
      {},
      document.title,
      `/login?redirect=${encodeURIComponent(redirect)}`
    );
  } else {
    window.history.replaceState({}, document.title, "/login");
  }
}

}, [t]);

  function changeLang(l){
    setLang(l);
    localStorage.setItem("lang",l);
  }

  function translateError(msg){
    if(msg === "Invalid credentials") return t.invalid_credentials;
    if(msg === "Email not verified") return t.email_not_verified;
    return msg || t.login_failed;
  }

  function translateValidation(details){
    const field = Object.keys(details)[0];
    const rawMsg = String(details[field]?.[0] || "");
    const msg = rawMsg.toLowerCase();

    let translated = t.validation_generic || "Invalid input";
    if (msg === "required") translated = t.validation_required || "Required";
    if (msg === "email") translated = t.validation_email || "Invalid email";
    if (msg.startsWith("min")) translated = t.validation_min || "Too short";

    const fieldLabel =
      field === "email" ? t.email :
      field === "password" ? t.password :
      field;

    return `${fieldLabel}: ${translated}`;
  }

  async function handleLogin(){



setError(null);
setMessage(null);
setLoading(true);

try{



const res = await api.post("/login",{
email: email.trim(),
password
});





login(res.data.access_token, res.data.refresh_token);



await registerPushIfAlreadyGranted();





const params = new URLSearchParams(location.search);

const redirectFromQuery = getSafeRedirect(params.get("redirect"));
const redirectFromStorage = getSafeRedirect(
  sessionStorage.getItem("pending_redirect")
);

const redirect = redirectFromQuery || redirectFromStorage;

// cleanup
sessionStorage.removeItem("pending_redirect");

navigate(redirect || "/");

}catch(err){

console.error("🔥 HANDLE LOGIN ERROR", {

  message: err.message,

  code: err.code,

  response: err.response?.status,

  url: err.config?.url

});

let finalError = t.login_failed;

if(!err.response){
finalError = t.network_error || "Network error";
}else{

const data = err.response.data;

if(data?.error?.details){

const field = Object.keys(data.error.details)[0];
const rawMsg = String(data.error.details[field]?.[0] || "").toLowerCase();

let translated = t.validation_generic || "Invalid input";

if(rawMsg === "required") translated = t.validation_required;
if(rawMsg === "email") translated = t.validation_email;
if(rawMsg.startsWith("min")) translated = t.validation_min;

const fieldLabel =
field === "email" ? t.email :
field === "password" ? t.password :
field;

finalError = `${fieldLabel}: ${translated}`;

}
else if(typeof data.error === "string"){

if(data.error === "Invalid credentials"){
finalError = t.invalid_credentials;
}
else if(data.error === "Email not verified"){
finalError = t.email_not_verified;
}
else{
finalError = data.error;
}

}

}

setError(finalError);

}finally{

setLoading(false);

}

}

  return (
  <AppShell pageClass="login-page">

  <div className="login-screen">
    <div className="login-lang">
      <button
        type="button"
        className={lang === "bg" ? "active" : ""}
        onClick={() => changeLang("bg")}
      >
        BG
      </button>
      <span>|</span>
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => changeLang("en")}
      >
        EN
      </button>
    </div>

    <div className="login-logo-wrap">
      <img src="/images/logo.png" alt="Sportner" className="login-logo" />
    </div>

    <div className="login-form">
      {message && <div className="login-alert success">✔ {message}</div>}
      {error && <div className="login-alert error">{error}</div>}

      <input
        type="email"
        placeholder={t.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="login-input"
      />

      <input
        type="password"
        placeholder={t.password}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        className="login-input"
      />

      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="login-btn login-btn-primary"
      >
        {loading ? "..." : t.login}
      </button>

      <button
        type="button"
        onClick={() => {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");

  console.log("LOGIN1 → REGISTER redirect:", redirect); // debug

  if (redirect) {
    navigate(`/register?redirect=${encodeURIComponent(redirect)}`);
  } else {
    navigate("/register");
  }
}}
        disabled={loading}
        className="login-btn login-btn-secondary"
      >
        {t.create_account}
      </button>

      <button
        type="button"
        onClick={() => navigate("/forgot-password")}
        disabled={loading}
        className="login-link login-link-forgot"
      >
        {t.forgot_password}
      </button>

<div className="login-link-report">
  <button
    type="button"
    className="login-link"
    onClick={() => {
      window.location.href = "mailto:support@sportner.online?subject=Sportner Support&body=Describe your issue here..."
    }}
  >
    {t.contact_us || "Contact us"}
  </button>
</div>

<div className="login-store-buttons">

  {(!isNative || isIOS) && (
    <a
      href="https://apps.apple.com/app/id6768100727"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="/images/app_store.png"
        alt="App Store"
        className="login-store-badge"
      />
    </a>
  )}

  {(!isNative || !isIOS) && (
    <a
      href="https://play.google.com/store/apps/details?id=com.sportner.app"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src="/images/GetItOnGooglePlay_Badge.png"
        alt="Google Play"
        className="login-store-badge"
      />
    </a>
  )}

</div>
    </div>

    </div>
  </AppShell>
);
}