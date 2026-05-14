import { useEffect, useRef, useState } from "react"
import TimeSlot from "./TimeSlot"
import api from "../api/api"



function isPastSlot(slot, selectedDate){
  const now = new Date()

  const [h, m] = slot.split(":").map(Number)



  const slotDate = new Date(selectedDate)
  slotDate.setHours(h, m, 0, 0)

  return slotDate < now
}


export default function Timeline({
  selectedDate,
  filters,
  isDesktop,
  onOpenGame,
  profileComplete,
  onCreateGame,
  fullSlotClickable = false,
  startSlot = null,
  endSlot = null,
  selectedRanges = [],   // 🔥 ново
showGames = true,   // 🔥 НОВО
alerts = [],   // 🔥
  cities = [],
  sports = [],
  venues = []
}){

const timelineRef = useRef(null)

const [expandedSlots, setExpandedSlots] = useState({})

const maxCards = isDesktop ? 4 : 2
const [games,setGames] = useState({})

const loadingRef = useRef(false)

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

  if (!selectedDate) return   // 🔥 защита за date

  if (loadingRef.current) return
  loadingRef.current = true



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

} finally {
    loadingRef.current = false
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


function isSlotInAvailability(slot, item){
  const start = item.start?.slice(0,5)
  let end = item.end?.slice(0,5)

  if(!start || !end) return false

  // 00:00 в availability означава край на деня = 24:00
  if(end === "00:00"){
    end = "24:00"
  }

  return slot >= start && slot <= end
}


return(

<div className="timeline" ref={timelineRef}>

<div className="timeline-inner">



{slots.map(slot => {
const dateStr = selectedDate.toISOString().split("T")[0]

const inSavedRange = selectedRanges.some(r =>
  r.date === dateStr &&
  slot >= r.start &&
  slot <= r.end
)

const isStartSaved = selectedRanges.some(r =>
  r.date === dateStr &&
  r.start === slot
)

const isEndSaved = selectedRanges.some(r =>
  r.date === dateStr &&
  r.end === slot
)

const isPendingStart =
  startSlot &&
  startSlot.date === dateStr &&
  startSlot.time === slot

const slotGames = games[slot] || []
const isPast = isPastSlot(slot, selectedDate)


const slotAlerts = alerts.filter(a =>
  a.date === dateStr &&
  isSlotInAvailability(slot, a)
)

const alertStarts = alerts.filter(a =>
  a.date === dateStr &&
  a.start === slot
)




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
  fullSlotClickable={fullSlotClickable}
  isSelected={inSavedRange || isPendingStart}
isStart={isStartSaved || isPendingStart}
isEnd={isEndSaved}
showGames={showGames}   // 🔥
hasAlert={slotAlerts.length > 0}
isAlertStart={alertStarts.length > 0}
alert={alertStarts[0] || null}
cities={cities}
sports={sports}
venues={venues}
alerts={alerts}
isPast={isPast}
/>



)

})}

</div>

</div>

)
}