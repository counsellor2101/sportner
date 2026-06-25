import AppShell from "../components/AppShell"
import "../styles/screen.css"
import "../styles/game-card.css"
import "../styles/app-layout.css"
import "../styles/my-games.css"
import { texts } from "../i18n/texts"

import { useEffect, useState } from "react"
import api from "../api/api"
import GameCard from "../components/GameCard"
import GameDetailsModal from "../components/GameDetailsModal"

export default function MyGames(){

  const [games, setGames] = useState([])
  const [selectedGameId, setSelectedGameId] = useState(null)

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

  useEffect(() => {
    loadGames()
  }, [])

  async function loadGames(){
    try{
      const res = await api.get("/me/games")
      setGames(res.data.data || [])
    }catch(e){
      console.log(e)
    }
  }

  const sortedGames = [...games].sort((a, b) => {
    const aDate = new Date(`${a.game_date}T${a.start_time}`)
    const bDate = new Date(`${b.game_date}T${b.start_time}`)
    return bDate - aDate
  })

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

const grouped = groupByDate(games)

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

        {/* 🔥 използваме timeline само като контейнер */}
        <div className="timeline">
          <div className="timeline-inner">

            {Object.entries(grouped).map(([date, dayGames]) => (

              <div key={date} className="my-day">

                <div className="my-day-title">
                  {formatDate(date)}
                </div>

                {dayGames.map(game => (
  <div key={game.id} className="timeline-slot">

    <div className="timeline-time">
      <span className="time-label hour">
        {game.start_time.slice(0,5)}
      </span>
    </div>

    <div className="time-line hour-line"></div>

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