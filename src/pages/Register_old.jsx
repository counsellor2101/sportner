import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import intlTelInput from "intl-tel-input";
import "intl-tel-input/build/css/intlTelInput.css";
import { texts } from "../i18n/texts";

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

const navigate = useNavigate();

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

const res = await api.post("/register",{
email:form.email.trim(),
nickname:form.nickname.trim(),
name:form.name.trim(),
password:form.password,
phone:phone
});

setMessage(res.data.message || t.register_success);

setForm({
email:"",
nickname:"",
name:"",
password:""
});

iti.setCountry("bg");

}catch(err){

console.log("REGISTER ERROR:",err.response?.data);

const apiError = err.response?.data?.error;

if(typeof apiError === "string"){

setError(translateError(apiError));

}
else if(apiError?.details){

const field = Object.keys(apiError.details)[0];
const message = apiError.details[field][0];

setError(field + ": " + message);

}else{

setError(t.genericError);

}

}

setLoading(false);

}

return(

<div style={{padding:40,fontFamily:"Arial",maxWidth:420}}>

<div style={{marginBottom:20}}>

<button onClick={()=>changeLang("bg")}>BG</button>

<button onClick={()=>changeLang("en")} style={{marginLeft:10}}>
EN
</button>

</div>

<h1>{t.register_title}</h1>

{message && (
<div style={{
background:"#e6ffed",
color:"#1f7a3f",
padding:"10px",
marginBottom:"15px",
borderRadius:"6px"
}}>
{message}
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

<form onSubmit={handleSubmit}>

<input
name="email"
type="email"
placeholder={t.email}
value={form.email}
onChange={handleChange}
required
autoComplete="email"
/>

<br/><br/>

<input
name="nickname"
placeholder={t.nickname}
value={form.nickname}
onChange={handleChange}
required
minLength={3}
/>

<br/><br/>

<input
name="name"
placeholder={t.name_optional}
value={form.name}
onChange={handleChange}
/>

<br/><br/>

<input
ref={phoneRef}
type="tel"
placeholder={t.phone}
required
/>

<br/><br/>

<input
name="password"
type="password"
placeholder={t.password}
value={form.password}
onChange={handleChange}
required
minLength={6}
autoComplete="new-password"
/>

<br/><br/>

<button type="submit" disabled={loading}>
{loading ? t.loading : t.register}
</button>

</form>

<br/>

<button onClick={()=>navigate("/login")}>
{t.back_to_login}
</button>

</div>

);

}