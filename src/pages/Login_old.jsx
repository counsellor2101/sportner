import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { texts } from "../i18n/texts";
import "../styles/login.css";

export default function Login(){

  const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
  const t = texts[lang] || texts.bg;

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [error,setError] = useState(null);
  const [message,setMessage] = useState(null);
  const [loading,setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {

  const params = new URLSearchParams(window.location.search);

  if(params.get("reset")){
    setMessage(t.password_reset_success || "Password updated successfully");
  }

  if(params.get("verified")){
    setMessage(t.email_verified_success || "Email verified successfully");
  }

  if(params.get("reset") || params.get("verified")){
    window.history.replaceState({}, document.title, "/login");
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

navigate("/");

}catch(err){

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

  return(

    <div style={{padding:40,fontFamily:"Arial",maxWidth:400}}>

      <div style={{marginBottom:20}}>
        <button onClick={()=>changeLang("bg")}>BG</button>
        <button onClick={()=>changeLang("en")} style={{marginLeft:10}}>EN</button>
      </div>

      <h1>{t.login_title}</h1>

      {message && (
        <div style={{
          background:"#e6ffed",
          color:"#006b21",
          padding:"10px",
          marginBottom:"15px",
          borderRadius:"6px"
        }}>
         ✔ {message}
        </div>
      )}

      {error && (
        <div style={{
          background:"#ffe3e3",
          color:"#a30000",
          padding:"10px",
          marginBottom:"15px",
          borderRadius:"6px"
        }}>
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder={t.email}
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        required
        disabled={loading}
      />

      <br/><br/>

      <input
        type="password"
        placeholder={t.password}
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        required
        disabled={loading}
      />

      <br/><br/>

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "..." : t.login}
      </button>

      <br/><br/>

      <button onClick={()=>navigate("/forgot-password")} disabled={loading}>
        {t.forgot_password}
      </button>

      <br/><br/>

      <button onClick={()=>navigate("/register")} disabled={loading}>
        {t.create_account}
      </button>

    </div>

  );

}