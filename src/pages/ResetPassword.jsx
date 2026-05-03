import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/api";
import { texts } from "../i18n/texts";
import AppShell from "../components/AppShell";
import "../styles/login.css";

export default function ResetPassword(){

const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
const t = texts[lang] || texts.bg;

const [searchParams] = useSearchParams();
const token = searchParams.get("token");

const [password,setPassword] = useState("");
const [confirmPassword,setConfirmPassword] = useState("");

const [error,setError] = useState(null);
const [message,setMessage] = useState(null);
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


async function handleReset(){

setError(null);
setMessage(null);

if(!token){
setError("Invalid reset link");
return;
}

if(password.length < 6){
setError(t.validation_min);
return;
}

if(password !== confirmPassword){
setError(t.passwords_not_match || "Passwords do not match");
return;
}

setLoading(true);

try{

await api.post("/reset-password",{
token: token,
new_password: password
});

navigate("/login?reset=1");

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
if(rawMsg.includes("min")) translated = t.validation_min;

const fieldLabel =
field === "password" ? t.password : field;

setError(`${fieldLabel}: ${translated}`);

}else{

setError(data.error || t.genericError);

}

}

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
type="password"
placeholder={t.password}
value={password}
onChange={(e)=>setPassword(e.target.value)}
disabled={loading}
className="login-input"
/>

<input
type="password"
placeholder={t.confirm_password || "Confirm password"}
value={confirmPassword}
onChange={(e)=>setConfirmPassword(e.target.value)}
disabled={loading}
className="login-input"
/>

<button
type="button"
onClick={handleReset}
disabled={loading}
className="login-btn login-btn-primary"
>
{loading ? "..." : (t.reset_password || "Reset password")}
</button>

<button
type="button"
onClick={()=>navigate("/login")}
className="login-link login-link-forgot"
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