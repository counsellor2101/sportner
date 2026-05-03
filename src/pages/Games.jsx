import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { texts } from "../i18n/texts";

export default function Games(){

const [lang,setLang] = useState(localStorage.getItem("lang") || "bg");
const t = texts[lang] || texts.bg;

const { logout } = useAuth();
const navigate = useNavigate();

const [games,setGames] = useState([]);
const [loading,setLoading] = useState(true);
const [error,setError] = useState(null);

function changeLang(l){
setLang(l);
localStorage.setItem("lang",l);
}

async function loadGames(){

try{

const res = await api.get("/games");

console.log("GAMES:",res.data);

setGames(res.data.data || []);

}catch(err){

console.log("GAMES ERROR:",err.response?.data);

if(!err.response){
setError(t.network_error || "Network error");
return;
}

if(err.response?.data?.error === "Invalid or expired token"){

alert(t.session_expired || "Session expired. Please login again.");

logout();
navigate("/login");

return;

}

setError(err.response?.data?.error || "Error loading games");

}finally{

setLoading(false);

}

}

useEffect(()=>{
loadGames();
},[navigate]);

if(loading){
return(
<div style={{padding:40,fontFamily:"Arial"}}>
{t.loading || "Loading..."}
</div>
);
}

return(

<div style={{padding:40,fontFamily:"Arial",maxWidth:700}}>

{/* HEADER */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:30
}}>

<div>
<button onClick={()=>changeLang("bg")}>BG</button>
<button onClick={()=>changeLang("en")} style={{marginLeft:10}}>
EN
</button>
</div>

<button onClick={()=>{
logout();
navigate("/login");
}}>
Logout
</button>

</div>

<h1>Sportner</h1>
<h3>{t.discover_games}</h3>

{/* ERROR */}

{error && (
<div style={{
background:"#ffe3e3",
color:"#a30000",
padding:"10px",
marginBottom:"20px",
borderRadius:"6px"
}}>
{error}
</div>
)}

{/* EMPTY */}

{games.length === 0 && (
<div style={{marginTop:20}}>
{t.no_games || "No games found"}
</div>
)}

{/* GAMES LIST */}

{games.map(game => (

<div
key={game.id}
style={{
border:"1px solid #ccc",
padding:15,
marginBottom:10,
borderRadius:8
}}
>

<div><b>{t.game_id}:</b> {game.id}</div>
<div><b>{t.sport}:</b> {game.sport_id}</div>
<div><b>{t.date}:</b> {game.game_date}</div>
<div><b>{t.players}:</b> {game.max_players}</div>

</div>

))}

</div>

);

}