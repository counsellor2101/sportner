import AppShell from "../components/AppShell"
import "../styles/screen.css"
import "../styles/timeline.css"
import "../styles/game-card.css"
import "../styles/app-layout.css"
import { useEffect, useState } from "react"
import DaySelector from "../components/DaySelector"
import FiltersBar from "../components/FiltersBar"
import Timeline from "../components/Timeline"
import { texts } from "../i18n/texts"
import GameDetailsModal from "../components/GameDetailsModal"
import api from "../api/api"
import { useParams, useNavigate } from "react-router-dom"
import { useCreateGame } from "../context/CreateGameContext"

export default function Discover(){

const [alerts, setAlerts] = useState([])
const [saving, setSaving] = useState(false)
async function loadAlerts(){
  try{
    const res = await api.get("/me/alerts")

    if(Array.isArray(res.data)){
      setAlerts(res.data)
    } else if(Array.isArray(res.data?.data)){
      setAlerts(res.data.data)
    }

    console.log("alerts loaded:", res.data)

  }catch(e){
    console.log("alerts load error", e)
  }
}

useEffect(() => {

  loadAlerts()

  function handleAlertsUpdated(){
    loadAlerts()
  }

  window.addEventListener("alertsUpdated", handleAlertsUpdated)

  return () => {
    window.removeEventListener("alertsUpdated", handleAlertsUpdated)
  }

}, [])



const [selectedRanges, setSelectedRanges] = useState([])
const [startSlot, setStartSlot] = useState(null)
const [endSlot, setEndSlot] = useState(null)


function mergeRanges(ranges){

  const sorted = [...ranges].sort((a,b) =>
    a.start.localeCompare(b.start)
  )

  const result = []

  for(const r of sorted){

    if(!result.length){
      result.push({...r})
      continue
    }

    const last = result[result.length - 1]

    if(r.start <= last.end){
      // merge
      if(r.end > last.end){
        last.end = r.end
      }
    }else{
      result.push({...r})
    }
  }

  return result
}


function handleSlotPick(slot){

  const dateStr = selectedDate.toISOString().split("T")[0]

  const fullSlot = {
    date: dateStr,
    time: slot
  }

  if (startSlot && !endSlot && startSlot.time === slot) {
    setStartSlot(null)
    setSelectedRanges([])
    return
  }

  if (!startSlot) {
    setStartSlot(fullSlot)
    return
  }

  const start = startSlot.time < fullSlot.time ? startSlot : fullSlot
  const end   = startSlot.time < fullSlot.time ? fullSlot : startSlot

  const newRange = {
  date: dateStr,
  start: start.time,
  end: end.time
}

setSelectedRanges(prev => {

  const sameDate = prev.filter(r => r.date === dateStr)
  const otherDates = prev.filter(r => r.date !== dateStr)

  const merged = mergeRanges([
    ...sameDate,
    newRange
  ])

  return [
    ...otherDates,
    ...merged
  ]
})

  setStartSlot(null)
}


async function handleSaveAvailability(){

  if(saving) return
  setSaving(true)

  const token = localStorage.getItem("access_token")

  try{

    // 🔥 guard
    if (!filters.city_ids.length) {
      alert("Избери град")
      return
    }

    if (!selectedRanges.length) {
      alert("Избери време")
      return
    }

    const payload = {
      city_id: filters.city_ids[0] || null,
      sport_ids: filters.sport_ids,
      levels: filters.levels,
      venue_ids: filters.venue_ids,
      slots: selectedRanges.map(r => ({
        date: r.date,
        start_time: r.start,
        end_time: r.end
      })),
      notify_email: 1
    }

    const res = await fetch("https://sportech-store.com/sports-match-api/me/alerts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    })

    const text = await res.text()

    console.log("STATUS:", res.status)
    console.log("RESPONSE:", text)

    if(!res.ok){
      throw new Error("Request failed")
    }

    console.log("✅ availability saved (batch)")

    window.dispatchEvent(new Event("alertsUpdated"))

setSelectedRanges([])
setStartSlot(null)
setEndSlot(null)

  }catch(e){
    console.log("❌ save error", e)
  }finally{
    setSaving(false)   // 🔥 ВИНАГИ се изпълнява
  }
}

const { openCreateGame } = useCreateGame()

const { id } = useParams()
const navigate = useNavigate()
const [venues, setVenues] = useState([])
const [groups, setGroups] = useState([])


useEffect(() => {
  if (!id) return;

  const gameId = Number(id);

  setSelectedGameId(gameId);

  // 🔥 махаме /game/:id от URL веднага
  navigate("/", { replace: true });

}, [id]);

function closeGame(){
  setSelectedGameId(null)
  navigate("/")
}



  const [filters, setFilters] = useState(() => {

  const defaultFilters = {
    city_ids: [],
    sport_ids: [],
    levels: [],
    venue_ids: [],
    group_ids: []
  }

  try{
    const saved = localStorage.getItem("timeline_filters")
    if(!saved) return defaultFilters

    const parsed = JSON.parse(saved)

    return {
      ...defaultFilters,
      ...parsed
    }

  }catch{
    return defaultFilters
  }

})

useEffect(() => {
  try{
    localStorage.setItem("timeline_filters", JSON.stringify(filters))
  }catch(e){
    console.log("filters save error", e)
  }
}, [filters])

const [cities, setCities] = useState([])
const [sports, setSports] = useState([])
const [levels, setLevels] = useState([])
const [selectedDate,setSelectedDate] = useState(new Date())
const [isDesktop,setIsDesktop] = useState(window.innerWidth >= 900)
const [activeFilter, setActiveFilter] = useState("city")

useEffect(() => {

  let mounted = true

  async function loadFilters(){

    try{

      const [citiesRes, sportsRes, venuesRes, groupsRes] = await Promise.all([
  api.get("/cities"),
  api.get("/sports"),
  api.get("/venues"),
  api.get("/me/groups") // 🔥 това ще направим
])



      const citiesData = Array.isArray(citiesRes.data)
        ? citiesRes.data
        : Array.isArray(citiesRes.data?.data)
          ? citiesRes.data.data
          : []

      const sportsData = sportsRes.data?.sports || []

      if(!mounted) return

      setCities(citiesData)
      setSports(sportsData)

const venuesData = Array.isArray(venuesRes.data)
  ? venuesRes.data
  : venuesRes.data?.data || []

const groupsData = Array.isArray(groupsRes.data)
  ? groupsRes.data
  : groupsRes.data?.data || []

setVenues(venuesData)
setGroups(groupsData)

      if(!citiesData.length && !sportsData.length){
        console.log("⚠️ empty filters")
      }

      setLevels(["beginner","intermediate","advanced","pro"])

      setFilters(prev => ({
  ...prev,
  city_ids: prev.city_ids.filter(id => citiesData.some(c => c.id === id)),
  sport_ids: prev.sport_ids.filter(id => sportsData.some(s => s.id === id)),
}))

    }catch(e){
      console.log("filters load error", e)
    }

  }

  loadFilters()

  return () => {
    mounted = false
  }

}, [])

const filteredVenues = venues.filter(v => {
  const matchSport =
    filters.sport_ids.length === 0 ||
    filters.sport_ids.some(sid => v.sport_ids.includes(sid))

  const matchCity =
    filters.city_ids.length === 0 ||
    filters.city_ids.includes(v.city_id)

  return matchSport && matchCity
})

const allowedCityIds = new Set()

venues.forEach(v => {

  if (filters.sport_ids.length > 0) {
    const match = v.sport_ids.some(id => filters.sport_ids.includes(id))
    if (!match) return
  }

  allowedCityIds.add(v.city_id)
})

const allowedSportIds = new Set()

venues.forEach(v => {

  if (filters.city_ids.length > 0 && !filters.city_ids.includes(v.city_id)) {
    return
  }

  v.sport_ids.forEach(id => {
    allowedSportIds.add(id)
  })
})






const me = null

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

const [selectedGameId,setSelectedGameId] = useState(null)
function openGame(id){
setSelectedGameId(id)
}


function toggleFilter(type, value){
  setFilters(prev => {

    const exists = prev[type].includes(value)

    let next = {
      ...prev,
      [type]: exists
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }

    // 🔥 🔥 🔥 КРИТИЧЕН FIX
    if (type === "city_ids" || type === "sport_ids") {
      next.venue_ids = []
    }

    // 🔥 BONUS (силно препоръчително)
    if (type === "venue_ids") {
      const selectedVenue = venues.find(v => v.id === value)
      if (selectedVenue) {
        next.city_ids = [selectedVenue.city_id]
      }
    }

    return next
  })
}

function clearFilters(){
  setFilters({
  city_ids: [],
  sport_ids: [],
  levels: [],
  venue_ids: [],
  group_ids: []
})
}



function isPastSlot(slot, selectedDate){
  const now = new Date()

  const [h, m] = slot.split(":").map(Number)

  const slotDate = new Date(selectedDate)
  slotDate.setHours(h, m, 0, 0)

  return slotDate < now
}



useEffect(()=>{

function handleResize(){
setIsDesktop(window.innerWidth >= 900)
}

window.addEventListener("resize",handleResize)

return ()=>window.removeEventListener("resize",handleResize)

},[])

return(
<>

<AppShell pageClass="app-layout">

<div className="screen">

<div className="discover-panel">

<div className="discover-title">
{t.discover}
</div>
</div>

<DaySelector
selectedDate={selectedDate}
setSelectedDate={setSelectedDate}
/>

<FiltersBar
  filters={filters}
  toggleFilter={toggleFilter}
  clearFilters={clearFilters}
  cities={cities}        // ❗ вече НЕ filtered
  sports={sports}        // ❗ вече НЕ filtered
  venues={filteredVenues}
  levels={levels}
  groups={groups}
  activeFilter={activeFilter}
  setActiveFilter={setActiveFilter}
  allowedCityIds={allowedCityIds}   // 🔥 ново
  allowedSportIds={allowedSportIds} // 🔥 ново
  t={t}
/>




<Timeline
  selectedDate={selectedDate}
  filters={filters}
  isDesktop={isDesktop}
  onOpenGame={openGame}
  profileComplete={true}

  fullSlotClickable={true}   // 🔥 ТОВА ЛИПСВА

  onCreateGame={({ slot }) => {
    handleSlotPick(slot)
  }}

  startSlot={startSlot}
  endSlot={endSlot}
selectedRanges={selectedRanges}
showGames={false}
alerts={alerts}   // 🔥 НОВО

  cities={cities}
  sports={sports}
  venues={venues}
/>

<button
  className="save-availability-btn"
  onClick={handleSaveAvailability}
>
  {t.save_availability}
</button>

</div>




</AppShell>
{selectedGameId && (
<GameDetailsModal
gameId={selectedGameId}
onClose={closeGame}
profileComplete={true}
/>
)}


</>
)

}