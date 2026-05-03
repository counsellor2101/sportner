import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../api/api";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { texts } from "../i18n/texts";
import AppShell from "../components/AppShell";
import "../styles/login.css";

export default function Register(){

const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
const t = texts[lang] || texts.bg;

const phoneRef = useRef(null);
const itiRef = useRef(null);

const [form,setForm] = useState({
email:"",
nickname:"",
name:"",
password:""
});

const [loading,setLoading] = useState(false);
const [message,setMessage] = useState(null);
const [error,setError] = useState(null);
const [registered, setRegistered] = useState(false);

const navigate = useNavigate();
const location = useLocation(); // 🔥 добави това

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

useEffect(()=>{

const iti = intlTelInput(phoneRef.current,{
initialCountry:"bg",
separateDialCode:true,
nationalMode:false,
autoPlaceholder:"polite",
loadUtils: () => import("intl-tel-input/build/js/utils.js")
});

itiRef.current = iti;

return () => {
iti.destroy();
};

},[]);

function changeLang(l){
setLang(l);
localStorage.setItem("lang",l);
}

function handleChange(e){
setForm({
...form,
[e.target.name]:e.target.value
});
}

function translateError(apiError){

if(apiError === "Email already used"){
return t.email_used;
}

if(apiError === "Phone already used"){
return t.phone_used;
}

if(apiError === "Nickname already used"){
return t.nickname_used;
}

return apiError || t.genericError;

}

async function handleSubmit(e){

e.preventDefault();

setError(null);
setMessage(null);

const iti = itiRef.current;

if(!iti.isValidNumber()){
setError(t.invalid_phone);
return;
}

const phone = iti.getNumber();

setLoading(true);

try{
const params = new URLSearchParams(location.search);
const redirect = params.get("redirect");

console.log("REGISTER redirect:", redirect); // debug
const res = await api.post("/register",{
email:form.email.trim(),
nickname:form.nickname.trim(),
name:form.name.trim(),
password:form.password,
phone:phone,
redirect // 🔥 ТОВА ЛИПСВАШЕ
});

setMessage(res.data.message || t.register_success);
setRegistered(true); // 🔥



}catch(err){

const apiError = err.response?.data?.error;

if(typeof apiError === "string"){
setError(translateError(apiError));
}else if(apiError?.details){

const field = Object.keys(apiError.details)[0];
const code = apiError.details[field][0];

let msg = code;

if(typeof code === "string" && code.startsWith("MIN_LENGTH")){
  msg = t.validation_min;
}

setError((t[field] || field) + ": " + msg);

}else{
setError(t.genericError);
}

}

setLoading(false);

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


{!registered && (
<form onSubmit={handleSubmit}>

<input
name="email"
type="email"
placeholder={t.email}
value={form.email}
onChange={handleChange}
className="login-input"
required
/>

<input
name="nickname"
placeholder={t.nickname}
value={form.nickname}
onChange={handleChange}
className="login-input"
required
/>

<input
name="name"
placeholder={t.name_optional}
value={form.name}
onChange={handleChange}
className="login-input"
/>

<input
ref={phoneRef}
type="tel"
placeholder={t.phone}
className="login-input"
required
/>

<input
name="password"
type="password"
placeholder={t.password}
value={form.password}
onChange={handleChange}
className="login-input"
required
/>

<button
type="submit"
disabled={loading}
className="login-btn login-btn-primary"
>
{loading ? "..." : t.register}
</button>

</form>
)}


{!registered && (
<button
type="button"
onClick={() => {
  const params = new URLSearchParams(location.search);
  const redirect = params.get("redirect");

  if (redirect) {
    navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
  } else {
    navigate("/login");
  }
}}
className="login-btn login-btn-secondary"
>
{t.back_to_login}
</button>
)}

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