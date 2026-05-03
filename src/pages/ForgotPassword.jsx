import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { texts } from "../i18n/texts";
import AppShell from "../components/AppShell";
import "../styles/login.css";

export default function ForgotPassword(){

const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
const t = texts[lang] || texts.bg;

const [email,setEmail] = useState("");
const [message,setMessage] = useState(null);
const [error,setError] = useState(null);
const [loading,setLoading] = useState(false);

const navigate = useNavigate();


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


function changeLang(l){
setLang(l);
localStorage.setItem("lang",l);
}
function translateError(msg){

if(msg === "Invalid email"){
return t.validation_email;
}

return msg || t.genericError;

}


async function handleSubmit(){

setError(null);
setMessage(null);
setLoading(true);

try{

const res = await api.post("/forgot-password",{
email: email.trim()
});

setMessage(t.reset_sent);
setEmail("");

}catch(err){

if(!err.response){
setError(t.network_error || "Network error");
}else{

const data = err.response.data;

if(data?.error?.details){

const field = Object.keys(data.error.details)[0];
const rawMsg = String(data.error.details[field]?.[0] || "").toLowerCase();

let translated = t.validation_generic;

if(rawMsg.includes("required")) translated = t.validation_required;
if(rawMsg.includes("email")) translated = t.validation_email;

const fieldLabel =
field === "email" ? t.email : field;

setError(`${fieldLabel}: ${translated}`);

}else{

setError(translateError(data.error));

}

}
}finally{

setLoading(false);

}

}


return(

<AppShell pageClass="login-page">

<div className="login-screen">

<div className="login-lang">

<button
type="button"
className={lang === "bg" ? "active" : ""}
onClick={()=>changeLang("bg")}
>
BG
</button>

<span>|</span>

<button
type="button"
className={lang === "en" ? "active" : ""}
onClick={()=>changeLang("en")}
>
EN
</button>

</div>


<div className="login-logo-wrap">
<img src="/images/logo.png" alt="Sportner" className="login-logo"/>
</div>


<div className="login-form">

{message && <div className="login-alert success">✔ {message}</div>}
{error && <div className="login-alert error">{error}</div>}

<input
type="email"
placeholder={t.email}
value={email}
onChange={(e)=>setEmail(e.target.value)}
disabled={loading}
className="login-input"
/>


<button
type="button"
onClick={handleSubmit}
disabled={loading}
className="login-btn login-btn-primary"
>
{loading ? "..." : t.send_reset}
</button>


<button
type="button"
onClick={()=>navigate("/login")}
className="login-btn login-btn-secondary"
>
{t.back_to_login}
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

</div>

</div>

</AppShell>

);

}