import "../styles/filters-bar.css"
import { useEffect, useState } from "react"

export default function FiltersBar({
  filters,
  toggleFilter,
  clearFilters,
  cities,
  sports,
  levels,
venues,   // ✅ ново
  groups,   // ✅ ново
  activeFilter,
  setActiveFilter,
allowedCityIds,
  allowedSportIds,
t, // 🔥 добави
disabledFilters = []
}){

const lang = localStorage.getItem("lang") || "bg"

function getCityName(c){
  return lang === "bg"
    ? c.name_bg || c.name
    : c.name_en || c.name_bg
}

const sortedCities = [
  ...cities.filter(c => filters.city_ids.includes(c.id)),
  ...cities.filter(c => !filters.city_ids.includes(c.id))
]

const sortedSports = [
  ...sports.filter(s => filters.sport_ids.includes(s.id)),
  ...sports.filter(s => !filters.sport_ids.includes(s.id))
]

const sortedVenues = [
  ...(venues || []).filter(v => (filters.venue_ids || []).includes(v.id)),
  ...(venues || []).filter(v => !(filters.venue_ids || []).includes(v.id))
]

const [showVenueSearch, setShowVenueSearch] = useState(false)
const [venueSearch, setVenueSearch] = useState("")

const searchableVenues = sortedVenues.filter(v => {

  if (!venueSearch.trim()) return true

  const search = venueSearch.toLowerCase()

  const city = cities.find(c => c.id === v.city_id)

  const venueSports = sports.filter(s =>
    v.sport_ids?.includes(s.id)
  )

  const keywords = [
    v.name,

    city?.name_bg,
    city?.name_en,

    ...venueSports.map(s => s.name_bg),
    ...venueSports.map(s => s.name_en),
    ...venueSports.map(s => s.slug)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return keywords.includes(search)
})

const sortedGroups = [
  ...(groups || []).filter(g => (filters.group_ids || []).includes(g.id)),
  ...(groups || []).filter(g => !(filters.group_ids || []).includes(g.id))
]






useEffect(() => {

  if(!activeFilter) return

  function handleScroll(){
    setActiveFilter(null)
  }

  const el = document.querySelector(".timeline")

  if(!el) return

  el.addEventListener("scroll", handleScroll)

  return () => {
    el.removeEventListener("scroll", handleScroll)
  }

}, [activeFilter, setActiveFilter])
  return (

<div className="filters-wrapper">

  {/* 🔹 ROW 1 — CATEGORIES */}
  <div className="filters-categories">

    <div
      className={`filter-cat ${activeFilter === "city" ? "active" : ""}`}
      onClick={() => {
  setActiveFilter(prev => {
    const next = prev === "city" ? null : "city"
    return next
  })


}}
    >
      {t.filter_city}
    </div>


<div
  className={`filter-cat ${activeFilter === "venue" ? "active" : ""}`}
  onClick={() => {
    setActiveFilter(prev => prev === "venue" ? null : "venue")

  }}
>
  {t.filter_venue}
</div>



    <div
      className={`filter-cat ${activeFilter === "sport" ? "active" : ""}`}
      onClick={() => {
  setActiveFilter(prev => prev === "sport" ? null : "sport")

}}
    >
      {t.filter_sport}
    </div>

    <div
  className={`filter-cat 
    ${activeFilter === "level" ? "active" : ""} 
    ${disabledFilters.includes("level") ? "disabled" : ""}
  `}
  onClick={() => {
    if (disabledFilters.includes("level")) return

    setActiveFilter(prev => prev === "level" ? null : "level")

  }}
>
  {t.filter_level}
</div>




<div
  className={`filter-cat 
    ${activeFilter === "group" ? "active" : ""} 
    ${disabledFilters.includes("group") ? "disabled" : ""}
  `}
  onClick={() => {
    if (disabledFilters.includes("group")) return

    setActiveFilter(prev => prev === "group" ? null : "group")

  }}
>
  {t.filter_group}
</div>
</div>
  {/* 🔹 ROW 2 — SELECTED */}
  <div className="filters-selected">

    {/* cities */}
    {filters.city_ids.map(id => {
      const c = cities.find(x => x.id === id)
      if(!c) return null

      return (
        <div
          key={"c"+id}
          className="filter-chip active"
          onClick={() => {
  toggleFilter("city_ids", id)

}}
        >
          {getCityName(c)} ✕
        </div>
      )
    })}

    {/* sports */}
    {filters.sport_ids.map(id => {
      const s = sports.find(x => x.id === id)
      if(!s) return null

      return (
        <div
          key={"s"+id}
          className="filter-chip active"
          onClick={() => {
  toggleFilter("sport_ids", id)

}}
        >
<img
    src={`/images/${s.icon}`}
    alt=""
    className="filter-sport-icon"
  />
          {s.name_en} ✕
        </div>
      )
    })}

    {/* levels */}
    {filters.levels.map(level => (
      <div
        key={level}
        className="filter-chip active"
        onClick={() => {
  toggleFilter("levels", level)

}}
      >
        {level} ✕
      </div>
    ))}

{/* venues */}
{(filters.venue_ids || []).map(id => {
  const v = (venues || []).find(x => x.id === id)
  if(!v) return null

  return (
    <div
      key={"v"+id}
      className="filter-chip active"
      onClick={() => {
        toggleFilter("venue_ids", id)

      }}
    >
      {v.name} ✕
    </div>
  )
})}

{/* groups */}
{(filters.group_ids || []).map(id => {
  const g = (groups || []).find(x => x.id === id)
  if(!g) return null

  return (
    <div
      key={"g"+id}
      className="filter-chip active"
      onClick={() => {
        toggleFilter("group_ids", id)

      }}
    >
      {g.name} ✕
    </div>
  )
})}

    {/* clear */}
    {(filters.city_ids.length > 0 ||
 filters.sport_ids.length > 0 ||
 filters.levels.length > 0 ||
 (filters.venue_ids?.length || 0) > 0 ||
 (filters.group_ids?.length || 0) > 0) && (

  <div className="filter-chip clear" onClick={clearFilters}>
    {t.filter_clear}
  </div>
)}

  </div>


  {/* 🔹 ROW 3 — OPTIONS */}
{activeFilter && (
  <div className="filters-options show">

    {/* CITY */}
    {activeFilter === "city" && sortedCities.map(city => {
      const disabled = allowedCityIds ? !allowedCityIds.has(city.id) : false

      return (
        <div
          key={city.id}
          className={`filter-chip 
            ${filters.city_ids.includes(city.id) ? "active" : ""} 
            ${disabled ? "disabled" : ""}
          `}
          onClick={() => {
            if (disabled) return
            toggleFilter("city_ids", city.id)
          }}
        >
          {getCityName(city)}
        </div>
      )
    })}

    {/* SPORT */}
    {activeFilter === "sport" && sortedSports.map(sport => {
      const disabled = allowedSportIds ? !allowedSportIds.has(sport.id) : false

      return (
        <div
          key={sport.id}
          className={`filter-chip 
            ${filters.sport_ids.includes(sport.id) ? "active" : ""} 
            ${disabled ? "disabled" : ""}
          `}
          onClick={() => {
            if (disabled) return
            toggleFilter("sport_ids", sport.id)
          }}
        >
          <>
  <img
    src={`/images/${sport.icon}`}
    alt=""
    className="filter-sport-icon"
  />

  {sport.name_en}
</>
        </div>
      )
    })}

    {/* LEVEL */}
    {activeFilter === "level" && levels.map(level => (
      <div
        key={level}
        className={`filter-chip ${filters.levels.includes(level) ? "active" : ""}`}
        onClick={() => {
          toggleFilter("levels", level)
        }}
      >
        {level}
      </div>
    ))}

   {/* VENUES */}
{activeFilter === "venue" && (
  <>
{!showVenueSearch ? (

  <div
    className="filter-chip"
    onClick={() => setShowVenueSearch(true)}
  >
    🔍
  </div>

) : (

  <div className="filter-search-chip">
    <input
      autoFocus
      type="text"
      placeholder={t.club_search}
      value={venueSearch}
      onChange={e => setVenueSearch(e.target.value)}
      onBlur={() => {
        if (!venueSearch.trim()) {
          setShowVenueSearch(false)
        }
      }}
      className="filter-search-input"
    />
 <span
  className="filter-search-clear"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => {
    setVenueSearch("")
    setShowVenueSearch(false)
  }}
>
  ✕
</span>
  </div>

)}

{searchableVenues.map(v => (

      <div
        key={v.id}
        className={`filter-chip ${(filters.venue_ids || []).includes(v.id) ? "active" : ""}`}
        onClick={() => {
          toggleFilter("venue_ids", v.id)
        }}
      >
        {v.name}
      </div>
    ))}
  </>
)}

    {/* GROUPS */}
    {activeFilter === "group" && sortedGroups.map(g => (
      <div
        key={g.id}
        className={`filter-chip ${(filters.group_ids || []).includes(g.id) ? "active" : ""}`}
        onClick={() => {
          toggleFilter("group_ids", g.id)
        }}
      >
        {g.name}
      </div>
    ))}

  </div>
)}
</div>


)
}