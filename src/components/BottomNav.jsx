import { NavLink } from "react-router-dom"
import "../styles/bottom-nav.css"
import { useCreateGame } from "../context/CreateGameContext"

export default function BottomNav(){

const { openCreateGame } = useCreateGame()

return(

<nav className="bottom-nav">

<div className="nav-gap" />

  <NavLink to="/" className="nav-item">
    <img src="/images/discover.png" className="nav-icon-img" />
  </NavLink> {/* 2 */}

<div className="nav-gap" />

  <NavLink to="/my-games" className="nav-item">
    <img src="/images/mygames.png" className="nav-icon-img" />
  </NavLink> {/* 4 */}

<div className="nav-gap" />

  <div
    className="create-btn"
    onClick={() => {

  const saved = localStorage.getItem("timeline_filters")

  let filters = {}

  try {
    filters = saved ? JSON.parse(saved) : {}
  } catch {}

  openCreateGame({
    date: new Date(),
    start_time: null,

    sport_id: filters.sport_ids?.[0] || null,
    city_id: filters.city_ids?.[0] || null,
    level_required: filters.levels?.[0] || null,
    venue_id: filters.venue_ids?.[0] || null,
    group_id: filters.group_ids?.[0] || null,
    game_type: filters.group_ids?.length ? "group" : "public"
  })

}}
  >
    <svg width="35" height="35" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  </div> {/* 6 */}

<div className="nav-gap" />

  <NavLink to="/groups" className="nav-item">
    <img src="/images/group.png" className="nav-icon-img" />
  </NavLink> {/* 8 */}

<div className="nav-gap" />

  <NavLink to="/availability" className="nav-item">
    <img src="/images/availability.png" className="nav-icon-img" />
  </NavLink> {/* 10 */}

<div className="nav-gap" />

</nav>

)

}