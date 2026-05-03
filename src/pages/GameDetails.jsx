import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import AppShell from "../components/AppShell"
import api from "../api/api"
import "../styles/game-detail.css"

export default function GameDetails(){

const { id } = useParams()

const [game,setGame] = useState(null)
const [loading,setLoading] = useState(true)

/* COLORS */

const sportColors = {
1:"#7ED957",
2:"#2d7df6",
3:"#ff8c42",
4:"#ef8282"
}

const levelColors = {
beginner:"#3ae766",
intermediate:"#2D7DF6",
advanced:"#fff000",
pro:"#FF3B30"
}

/* LOAD GAME */

useEffect(()=>{

async function loadGame(){

try{

const res = await api.get(`/games/${id}`)

setGame(res.data)

}catch(e){

console.log("game details error",e)

}

setLoading(false)

}

loadGame()

},[id])

/* LOADING */

if(loading){
return <AppShell>Loading...</AppShell>
}

if(!game){
return <AppShell>Game not found</AppShell>
}

/* GAME DATA */

const sportColor = sportColors[game.sport_id] || "#ccc"
const levelColor = levelColors[game.level_required] || "#ccc"

const players = game.players_count ?? 0
const freeSpots = game.max_players - players

const isJoined = Number(game.is_joined) === 1
const isOwner = Number(game.is_owner) === 1
const isFull = Number(game.is_full) === 1

/* ACTIONS */

async function joinGame(){

try{

await api.post(`/games/${game.id}/join`)

}catch(e){

console.log("join error",e)

}

}

async function leaveGame(){

try{

await api.delete(`/games/${game.id}/leave`)

}catch(e){

console.log("leave error",e)

}

}

async function cancelGame(){

try{

await api.delete(`/games/${game.id}/cancel`)

}catch(e){

console.log("cancel error",e)

}

}

/* BUTTON LOGIC */

let button

if(isOwner){

button = (
<button className="btn-cancel" onClick={cancelGame}>
Cancel Game
</button>
)

}

else if(isJoined){

button = (
<button className="btn-leave" onClick={leaveGame}>
Leave Game
</button>
)

}

else if(isFull){

button = (
<button className="btn-full" disabled>
Game Full
</button>
)

}

else{

button = (
<button className="btn-join" onClick={joinGame}>
Join Game
</button>
)

}

/* RENDER */

return(

<AppShell pageClass="app-layout">

<div className="screen">

<div className="game-details">

{/* HEADER */}

<div className="game-header">

<div className="sport-bar-game-details" style={{background:sportColor}}></div>

<div className="game-header-top">

<span className="sport-icon">🎾</span>

<span
className="level-dot"
style={{background:levelColor}}
></span>

</div>

<div className="game-header-info">

<div>
📅 {game.date}
</div>

<div>
🕒 {game.start_time.slice(0,5)} – {game.end_time.slice(0,5)}
</div>

<div>
📍 {game.venue_name}
</div>

<div>
{players}/{game.max_players} players
</div>

</div>

</div>


{/* PLAYERS */}

<div className="players-section">

<div className="players-title">
Players
</div>

<div className="players-list">

{game.players?.map(p => (

<div key={p.id} className="player-row">

<div className="player-info">

<div className="player-avatar">
{p.nickname.charAt(0).toUpperCase()}
</div>

<span>{p.nickname}</span>

</div>

<span>{p.level}</span>

</div>

))}

{Array.from({length:freeSpots}).map((_,i)=>(

<div key={"free"+i} className="player-row free-spot">

<div className="player-info">

<div className="player-avatar free-avatar">
+
</div>

<span>Free spot</span>

</div>

</div>

))}

</div>

</div>


{/* ACTION */}

<div className="game-action">

{button}

</div>

</div>

</div>

</AppShell>

)

}