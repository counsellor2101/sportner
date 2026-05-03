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
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useCreateGame } from "../context/CreateGameContext"

import { useRef } from "react"

export default function Discover(){

const { openCreateGame } = useCreateGame()

const { id } = useParams()
const navigate = useNavigate()
const [venues, setVenues] = useState([])
const [groups, setGroups] = useState([])
const location = useLocation()




useEffect(() => {
  if (!id) return;

  const gameId = Number(id);

  // 🔥 първо отваряме modal-а
  setSelectedGameId(gameId);

  // 🔥 след малък delay махаме URL-то (за стабилност)
  setTimeout(() => {
    navigate("/", { replace: true });
  }, 0);

}, [id, navigate]);



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
function closeGame(){
setSelectedGameId(null)
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
onCreateGame={(data) => {

  openCreateGame({
    date: selectedDate,
    start_time: data.slot,

    sport_id: filters.sport_ids[0] || null,
    city_id: filters.city_ids[0] || null,
    level_required: filters.levels[0] || null,
    venue_id: filters.venue_ids?.[0] || null,
    group_id: filters.group_ids?.[0] || null,
    game_type: filters.group_ids?.length ? "group" : "public"
  })

}}
/>

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