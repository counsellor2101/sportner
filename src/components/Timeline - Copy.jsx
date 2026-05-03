import { useEffect, useRef, useState } from "react"
import TimeSlot from "./TimeSlot"
import api from "../api/api"

export default function Timeline({ selectedDate, filters, isDesktop, onOpenGame, profileComplete, onCreateGame }){

const timelineRef = useRef(null)
const [currentTop, setCurrentTop] = useState(null)
const [expandedSlots, setExpandedSlots] = useState({})

const maxCards = isDesktop ? 4 : 2
const [games,setGames] = useState({})

function generateTimeSlots(){

const slots = []

for(let minutes = 6*60; minutes <= 24*60; minutes += 30){

const h = Math.floor(minutes / 60)
const m = minutes % 60

const hour = String(h).padStart(2,'0')
const min = String(m).padStart(2,'0')

slots.push(`${hour}:${min}`)

}

return slots

}

const slots = generateTimeSlots()

function toggleSlot(slotTime){

setExpandedSlots(prev => ({
...prev,
[slotTime]: !prev[slotTime]
}))

}

useEffect(()=>{

async function loadGames(){

try{

function formatLocalDate(date){

return date.getFullYear() + "-" +
String(date.getMonth()+1).padStart(2,'0') + "-" +
String(date.getDate()).padStart(2,'0')

}

const date = formatLocalDate(selectedDate)

const res = await api.get("/games/timeline",{
params:{
  date,
  ...(filters.city_ids.length && { city_ids: filters.city_ids }),
  ...(filters.sport_ids.length && { sport_ids: filters.sport_ids }),
  ...(filters.venue_ids.length && { venue_ids: filters.venue_ids }),
  ...(filters.levels.length && { levels: filters.levels }),
...(filters.group_ids.length && { group_ids: filters.group_ids })
}
})

if(res && res.data && res.data.slots){

setGames(res.data.slots)

}

}catch(e){

console.log("timeline error", e)

}

}

loadGames()

/* LISTEN FOR GAME UPDATES */

function handleUpdate(){
loadGames()
}

window.addEventListener("gamesUpdated", handleUpdate)

const interval = setInterval(() => {
  loadGames()
}, 10000)

return () => {

clearInterval(interval)

window.removeEventListener("gamesUpdated", handleUpdate)

}

},[
  selectedDate,
  JSON.stringify(filters?.city_ids),
  JSON.stringify(filters?.sport_ids),
  JSON.stringify(filters?.levels),
  JSON.stringify(filters?.venue_ids),
  JSON.stringify(filters?.group_ids) // 🔥
])


useEffect(() => {
setExpandedSlots({})
},[
  selectedDate,
  JSON.stringify(filters?.city_ids),
  JSON.stringify(filters?.sport_ids),
  JSON.stringify(filters?.levels),
  JSON.stringify(filters?.venue_ids),
  JSON.stringify(filters?.group_ids) // 🔥
])

/* red line realtime */

useEffect(() => {

function updateCurrentLine(){

const now = new Date()

let hours = now.getHours()
let minutes = now.getMinutes()

if(hours < 6){
hours = 6
minutes = 0
}

if(hours >= 24){
hours = 23
minutes = 59
}

const slotMinutes = minutes < 30 ? "00" : "30"

const slotId =
"slot-" + String(hours).padStart(2,"0") + ":" + slotMinutes

const slotElement = document.getElementById(slotId)

if(!slotElement) return

const slotTop = slotElement.offsetTop
const slotHeight = slotElement.offsetHeight

const minutesInsideSlot = minutes % 30
const pixelsPerMinute = slotHeight / 30

const top = slotTop + minutesInsideSlot * pixelsPerMinute

setCurrentTop(top)

}

updateCurrentLine()

const interval = setInterval(updateCurrentLine,1000)

return () => clearInterval(interval)

},[])

/* AUTO SCROLL */

useEffect(() => {

const now = new Date()

let hours = now.getHours()
const minutes = now.getMinutes()

if(hours < 6){
hours = 6
}

if(hours >= 24){
hours = 23
}

const roundedMinutes = minutes < 30 ? "00" : "30"

const currentSlot =
String(hours).padStart(2,"0") + ":" + roundedMinutes

const element = document.getElementById("slot-" + currentSlot)

if(element){

timelineRef.current.scrollTo({
top: element.offsetTop - 120,
behavior: "smooth"
})

}

},[])


return(

<div className="timeline" ref={timelineRef}>

<div className="timeline-inner">

{currentTop !== null && (

<div
className="current-time-line"
style={{top:currentTop+"px"}}
>

<div className="current-time-dot"></div>

</div>

)}

{slots.map(slot => {

const slotGames = games[slot] || []

return(

<TimeSlot
key={slot}
slot={slot}
slotGames={slotGames}
expanded={expandedSlots[slot]}
toggleSlot={toggleSlot}
maxCards={maxCards}
profileComplete={profileComplete}
onOpenGame={onOpenGame}
onCreateGame={onCreateGame}

/>

)

})}

</div>

</div>

)
}