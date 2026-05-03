import { useEffect, useState } from "react"
import api from "../api/api"
import AppShell from "../components/AppShell"
import VenueCard from "../components/VenueCard"
import ReportModal from "../components/ReportModal"
import "../styles/innapp_notification.css"
import "../styles/create-game-modal.css"
import "../styles/venues.css"
import FiltersBar from "../components/FiltersBar"

import { texts } from "../i18n/texts"

export default function Venues(){

  const [venues, setVenues] = useState([])
  const [cities, setCities] = useState([])
  const [sports, setSports] = useState([])
  const [initialized, setInitialized] = useState(false)
const [suggestOpen, setSuggestOpen] = useState(false)

const [filters, setFilters] = useState({
  city_ids: [],
  sport_ids: [],
  levels: [],
  venue_ids: [] // ✅ добави
})

const [activeFilter, setActiveFilter] = useState(null)

function toggleFilter(key, value){
  setFilters(prev => {
    const arr = prev[key] || []

    return {
      ...prev,
      [key]: arr.includes(value)
        ? arr.filter(x => x !== value)
        : [...arr, value]
    }
  })
}

function clearFilters(){
  setFilters({
    city_ids: [],
    sport_ids: [],
    levels: [], // ✅ важно
venue_ids: [] // ✅ добави
  })
}

const filteredVenues = venues.filter(v => {

  // CITY
  if (filters.city_ids.length > 0 &&
      !filters.city_ids.includes(v.city_id)) {
    return false
  }

  // SPORT
  if (filters.sport_ids.length > 0) {
    const hasSport = v.sport_ids?.some(id =>
      filters.sport_ids.includes(id)
    )

    if (!hasSport) return false
  }

// VENUE
if (filters.venue_ids.length > 0 &&
    !filters.venue_ids.includes(v.id)) {
  return false
}

  return true
})

const cityMap = Object.fromEntries(
  cities.map(c => [Number(c.id), c])
)

const sportMap = Object.fromEntries(
  sports.map(s => [Number(s.id), s])
)

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

  useEffect(() => {
    loadMeta()
  }, [])

  async function loadMeta(){
    try{
      const res = await api.get("/meta")

      const { venues = [], cities = [], sports = [] } = res.data || {}

      setVenues(venues)
      setCities(cities)
      setSports(sports)

    }catch(e){
      console.error("meta load error", e)
    }finally{
      setInitialized(true)
    }
  }

  return (
    <AppShell pageClass="app-layout venues-page">
      <div className="screen">

        {/* HEADER */}
        <div className="discover-panel">
          <div className="discover-title">
          {t.venues || "Venues"}
        </div>
</div>










<div className="timeline">

        <div>

          <button
  type="button"
  className="notif-clear-btn"
  onClick={() => setSuggestOpen(true)}
>
  {t.suggest_venue || "Suggest venue"}
</button>
<FiltersBar
  filters={filters}
  toggleFilter={toggleFilter}
  clearFilters={clearFilters}
  cities={cities}
  sports={sports}
  levels={[]}      // ❌ не ни трябва
  venues={venues}
  groups={[]}      // ❌ не ни трябва
  activeFilter={activeFilter}
  setActiveFilter={setActiveFilter}
disabledFilters={["level", "group"]}
  t={t}
/>

        </div>



        <div className="inappnotifications">

          {initialized && filteredVenues.length === 0 && (
            <div className="venues-empty">
              {t.no_venues || "No venues found"}
            </div>
          )}

          {filteredVenues.map(v => (
            <VenueCard
  key={v.id}
  venue={v}
  cityMap={cityMap}
  sportMap={sportMap}
/>
          ))}

        </div>

      </div>
</div>
<ReportModal
      open={suggestOpen}
      onClose={() => setSuggestOpen(false)}
      user={null}
      type="suggestion"
    />
    </AppShell>
  )
}