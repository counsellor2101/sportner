import AppShell from "../components/AppShell"
import "../styles/screen.css"
import "../styles/game-card.css"
import "../styles/app-layout.css"
import "../styles/my-games.css"
import { texts } from "../i18n/texts"

import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import GameCard from "../components/GameCard"
import GameDetailsModal from "../components/GameDetailsModal"

import FiltersBar from "../components/FiltersBar"

export default function MyGames(){

  const [games, setGames] = useState([])
  const [selectedGameId, setSelectedGameId] = useState(null)

const autoScrolledRef = useRef(false)

const [filters, setFilters] = useState({
  city_ids: [],
  sport_ids: [],
  levels: [],
  venue_ids: [],
  group_ids: []
})

const [activeFilter, setActiveFilter] = useState("city")

const [cities, setCities] = useState([])
const [sports, setSports] = useState([])
const [venues, setVenues] = useState([])
const [groups, setGroups] = useState([])
const [levels, setLevels] = useState([])

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg



  async function loadGames(){
    try{
      const res = await api.get("/me/games")
      setGames(res.data.data || [])
    }catch(e){
      console.log(e)
    }
  }



useEffect(() => {
  loadGames()

  function handleUpdate(){
    loadGames()
  }

  window.addEventListener("gamesUpdated", handleUpdate)

  return () => {
    window.removeEventListener("gamesUpdated", handleUpdate)
  }
}, [])

useEffect(() => {

  let mounted = true

  async function loadFilters(){

    try{

      const [citiesRes, sportsRes, venuesRes, groupsRes] = await Promise.all([
        api.get("/cities"),
        api.get("/sports"),
        api.get("/venues"),
        api.get("/me/groups")
      ])

      if (!mounted) return

      setCities(
        Array.isArray(citiesRes.data)
          ? citiesRes.data
          : citiesRes.data?.data || []
      )

      setSports(
        sportsRes.data?.sports || []
      )

      setVenues(
        Array.isArray(venuesRes.data)
          ? venuesRes.data
          : venuesRes.data?.data || []
      )

      setGroups(
        Array.isArray(groupsRes.data)
          ? groupsRes.data
          : groupsRes.data?.data || []
      )

      setLevels([
        "beginner",
        "intermediate",
        "advanced",
        "pro"
      ])

    } catch(e){
      console.log(e)
    }
  }

  loadFilters()

  return () => {
    mounted = false
  }

}, [])


function toggleFilter(type, value){

  setFilters(prev => {

    const exists = prev[type].includes(value)

    let next = {
      ...prev,
      [type]: exists
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }

    if (type === "city_ids" || type === "sport_ids") {
      next.venue_ids = []
    }

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



const filteredVenues = venues.filter(v => {

  const matchSport =
    filters.sport_ids.length === 0 ||
    filters.sport_ids.some(sid => v.sport_ids?.includes(sid))

  const matchCity =
    filters.city_ids.length === 0 ||
    filters.city_ids.includes(v.city_id)

  return matchSport && matchCity
})


const allowedCityIds = new Set()

venues.forEach(v => {

  if (filters.sport_ids.length > 0) {

    const match =
      v.sport_ids?.some(id =>
        filters.sport_ids.includes(id)
      )

    if (!match) return
  }

  allowedCityIds.add(v.city_id)
})



const allowedSportIds = new Set()

venues.forEach(v => {

  if (
    filters.city_ids.length > 0 &&
    !filters.city_ids.includes(v.city_id)
  ) {
    return
  }

  v.sport_ids?.forEach(id => {
    allowedSportIds.add(id)
  })
})

function groupByDate(games){

  const grouped = {}

  games.forEach(g => {
    const date = g.game_date

    if(!grouped[date]){
      grouped[date] = []
    }

    grouped[date].push(g)
  })

  return grouped
}

const filteredGames = games.filter(game => {

  if (
    filters.city_ids.length > 0 &&
    !filters.city_ids.includes(game.city_id)
  ) {
    return false
  }

  if (
    filters.sport_ids.length > 0 &&
    !filters.sport_ids.includes(game.sport_id)
  ) {
    return false
  }

  if (
    filters.levels.length > 0 &&
    !filters.levels.includes(game.level_required)
  ) {
    return false
  }

  if (
    filters.venue_ids.length > 0 &&
    !filters.venue_ids.includes(game.venue_id)
  ) {
    return false
  }

  if (
    filters.group_ids.length > 0 &&
    !filters.group_ids.includes(game.group_id)
  ) {
    return false
  }

  return true
})

const grouped = groupByDate(filteredGames)

useEffect(() => {

  if (autoScrolledRef.current) {
    return
  }

  const today = new Date()

  const todayKey =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0")

  const el = document.getElementById(
    `my-day-${todayKey}`
  )

  if (!el) {
    return
  }

  autoScrolledRef.current = true

  setTimeout(() => {

  requestAnimationFrame(() => {

    el.scrollIntoView({
      behavior: "smooth",
      block: "center"
    })

  })

}, 300)

}, [games])


Object.keys(grouped).forEach(date => {
  grouped[date].sort((a,b) => {
    return a.start_time.localeCompare(b.start_time)
  })
})

function formatDate(dateStr){

  const d = new Date(dateStr)
  const today = new Date()

  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  if(isToday){
    return "Today"
  }

  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  })
}













  return (
  <>
    <AppShell pageClass="app-layout">

      <div className="screen">

        <div className="discover-panel">
          <div className="discover-title">
            {t.my_games}
          </div>
</div>
      <div className="mygames-page">
<FiltersBar
  filters={filters}
  toggleFilter={toggleFilter}
  clearFilters={clearFilters}
  cities={cities}
  sports={sports}
  venues={filteredVenues}
  levels={levels}
  groups={groups}
  activeFilter={activeFilter}
  setActiveFilter={setActiveFilter}
  allowedCityIds={allowedCityIds}
  allowedSportIds={allowedSportIds}
  t={t}
/>
  </div>

        {/* 🔥 използваме timeline само като контейнер */}
        <div className="timeline">
          <div className="timeline-inner">

            {Object.entries(grouped).map(([date, dayGames]) => (

              <div
  key={date}
  id={`my-day-${date}`}
  className="my-day"
>

                <div className="my-day-title">
                  {formatDate(date)}
                </div>

                {dayGames.map(game => (
  <div key={game.id} className="timeline-slot">



    <div className="timeline-content">

      <div className="slot-games-row">

        <GameCard
          game={game}
          variant="my-games"
          onOpen={() => setSelectedGameId(game.id)}
        />

      </div>

    </div>

  </div>
))}

              </div>

            ))}

          </div>
        </div>

      </div>

    </AppShell>

    {selectedGameId && (
      <GameDetailsModal
        gameId={selectedGameId}
        onClose={() => setSelectedGameId(null)}
        profileComplete={true}
      />
    )}
  </>
)
}