import AppShell from "../components/AppShell"
import "../styles/screen.css"
import "../styles/timeline.css"
import "../styles/game-card.css"
import "../styles/app-layout.css"
import { useEffect, useState } from "react"
import DaySelector from "../components/DaySelector"
import FiltersBar from "../components/FiltersBar"
import Timeline from "../components/Timeline"
import GamesView from "../components/GamesView"
import { texts } from "../i18n/texts"
import GameDetailsModal from "../components/GameDetailsModal"
import api from "../api/api"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useCreateGame } from "../context/CreateGameContext"
import { useAuth } from "../context/AuthContext"

import { useRef } from "react"

export default function Discover(){

const { openCreateGame } = useCreateGame()
const { loading: authLoading } = useAuth()

const { id } = useParams()
const navigate = useNavigate()
const [venues, setVenues] = useState([])
const [groups, setGroups] = useState([])
const location = useLocation()




useEffect(() => {
  if (!id) return;

  const gameId = Number(id);

  const inviteToken =
    new URLSearchParams(
      location.search
    ).get("invite");

  setSelectedGameId(gameId);

  setSelectedInviteToken(
    inviteToken
  );

  // 🔥 след малък delay махаме URL-то (за стабилност)
  setTimeout(() => {
    navigate("/", { replace: true });
  }, 0);

}, [id, location.search, navigate]);



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

const [view, setView] = useState(
  localStorage.getItem("discover_view") || "timeline"
)

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
const [selectedInviteToken, setSelectedInviteToken] = useState(null)

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


function formatDateKey(date){
  return date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0")
}

const programmaticScrollRef = useRef(false)

const dateLoadingRef = useRef(false)


function handleDaySelect(day){

  if(
    selectedDate.getFullYear() === day.getFullYear() &&
    selectedDate.getMonth() === day.getMonth() &&
    selectedDate.getDate() === day.getDate()
  ){
    return
  }

dateLoadingRef.current = true

  if (view === "timeline") {

  window.dispatchEvent(
    new Event("globalLoadingStart")
  )

}

setSelectedDate(day)

if(view !== "games") return

  setTimeout(() => {

    const dateKey = formatDateKey(day)

    const exactEl = document.getElementById(`day-${dateKey}`)

    if(exactEl){

      programmaticScrollRef.current = true

      exactEl.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })

      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 700)

      return
    }

    const sections = [
      ...document.querySelectorAll(".my-day[data-date]")
    ]

    if(!sections.length){
      return
    }

    const targetTime = new Date(dateKey).getTime()

    let closest = null
    let closestDiff = Infinity

    sections.forEach(section => {

      const sectionDate = section.dataset.date
      const sectionTime = new Date(sectionDate).getTime()

      const diff = Math.abs(sectionTime - targetTime)

      if(diff < closestDiff){
        closestDiff = diff
        closest = section
      }

    })

    if(closest){

      programmaticScrollRef.current = true

      closest.scrollIntoView({
        behavior: "smooth",
        block: "start"
      })

      setTimeout(() => {
        programmaticScrollRef.current = false
      }, 700)

    }

  }, 50)
}




useEffect(() => {

  if(view !== "games") return

  function handleScroll(){

    if(programmaticScrollRef.current){
      return
    }

    const days = [
      ...document.querySelectorAll(".my-day[data-date]")
    ]

    let activeDay = null

    days.forEach(day => {

      const rect = day.getBoundingClientRect()

      if(rect.top <= 180){
        activeDay = day
      }

    })

    if(!activeDay){
      return
    }

    const dateStr = activeDay.dataset.date

    const d = new Date(dateStr)

    setSelectedDate(prev => {

      if(
        prev.getFullYear() === d.getFullYear() &&
        prev.getMonth() === d.getMonth() &&
        prev.getDate() === d.getDate()
      ){
        return prev
      }

      return d
    })

  }

  const el = document.querySelector(".timeline")

if(!el) return

el.addEventListener("scroll", handleScroll)

return () => {
  el.removeEventListener("scroll", handleScroll)
}

}, [view])

if (authLoading) {
  return null
}

return(
<>

<AppShell pageClass="app-layout">

<div className="screen">

<div className="discover-panel">

  <div className="discover-title">
    {t.discover}
  </div>

  <div className="discover-view-switch">

    <span className="discover-view-label">
      {t.view}
    </span>

    <button
      className={`discover-switch ${
        view === "games" ? "active" : ""
      }`}
      onClick={() => {

        const nextView =
          view === "timeline"
            ? "games"
            : "timeline"

        setView(nextView)

        localStorage.setItem(
          "discover_view",
          nextView
        )

      }}
    >
      <span className="discover-switch-thumb" />
    </button>

  </div>

</div>

<DaySelector
  selectedDate={selectedDate}
  setSelectedDate={handleDaySelect}
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

{view === "timeline" ? (
<Timeline
  selectedDate={selectedDate}
  filters={filters}
  isDesktop={isDesktop}
  onOpenGame={openGame}
  profileComplete={true}
  dateLoadingRef={dateLoadingRef}
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
) : (

  <GamesView
    filters={filters}
  />

)}

</div>




</AppShell>
{selectedGameId && (
<GameDetailsModal
  gameId={selectedGameId}
  inviteToken={selectedInviteToken}
  onClose={closeGame}
  profileComplete={true}
/>
)}



</>
)

}