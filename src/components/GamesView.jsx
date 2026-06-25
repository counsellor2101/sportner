import React from "react"

import "../styles/game-card.css"

import "../styles/my-games.css"
import { texts } from "../i18n/texts"

import { useEffect, useState } from "react"
import api from "../api/api"

import GameCard from "../components/GameCard"
import GameDetailsModal from "../components/GameDetailsModal"
import PromotionCard from "../components/PromotionCard"


export default function GamesView({
  filters
}) {



  const [selectedGameId, setSelectedGameId] = useState(null)

const [games, setGames] = useState([])

const [promotions, setPromotions] = useState([])



const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg


async function loadGames(){



if(!filters) return

  try{

    const params = {}

    if(filters.city_ids.length){
      params.city_ids = filters.city_ids
    }

    if(filters.sport_ids.length){
      params.sport_ids = filters.sport_ids
    }

    if(filters.levels.length){
      params.levels = filters.levels
    }

    if(filters.venue_ids.length){
      params.venue_ids = filters.venue_ids
    }

    if(filters.group_ids.length){
      params.group_ids = filters.group_ids
    }

    const res = await api.get("/games/list", {
      silent: true,
      params
    })

    const newGames = res.data.data || []
const newPromotions = res.data.promotions || []

setGames(prev => {

  if(JSON.stringify(prev) === JSON.stringify(newGames)){
    return prev
  }

  return newGames
})

setPromotions(prev => {

  if(JSON.stringify(prev) === JSON.stringify(newPromotions)){
    return prev
  }

  return newPromotions
})

  } catch(e){
    console.log(e)
  }
}


useEffect(() => {

  loadGames()

  function handleUpdate(){
    loadGames()
  }

  window.addEventListener(
    "gamesUpdated",
    handleUpdate
  )

  const interval = setInterval(() => {
    loadGames()
  }, 10000)

  return () => {

    clearInterval(interval)

    window.removeEventListener(
      "gamesUpdated",
      handleUpdate
    )

  }

},[
  JSON.stringify(filters?.city_ids),
  JSON.stringify(filters?.sport_ids),
  JSON.stringify(filters?.levels),
  JSON.stringify(filters?.venue_ids),
  JSON.stringify(filters?.group_ids)
])



  
















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

const filteredGames = games

const grouped = groupByDate(filteredGames)

Object.keys(grouped).forEach(date => {
  grouped[date].sort((a,b) => {
    return a.start_time.localeCompare(b.start_time)
  })
})

function formatDate(dateStr){

  const d = new Date(dateStr)

  const today = new Date()

  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  if(isToday){
    return t.today || "Today"
  }

  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate()

  if(isTomorrow){
    return t.tomorrow || "Tomorrow"
  }

  return d.toLocaleDateString(
    lang === "bg" ? "bg-BG" : "en-GB",
    {
      weekday: "short",
      day: "2-digit",
      month: "short"
    }
  )
}



const dayEntries = Object.entries(grouped)
let globalCardIndex = 0

const totalGames = games.length






  return (
  <>
    


        {/* 🔥 използваме timeline само като контейнер */}
        <div className="timeline">
          <div className="timeline-inner">

{promotions
  .filter(
    promo => Number(promo.gamesview_after_card) === 0
  )
  .map(promo => (

    <PromotionCard
      key={`promo-top-${promo.id}`}
      promotion={promo}
    />

  ))
}

            {dayEntries.map(([date, dayGames]) => (

              <div
  key={date}
  id={`day-${date}`}
  data-date={date}
  className="my-day"
>

                <div className="my-day-title">
                  {formatDate(date)}
                </div>

               {dayGames.map((game) => {

  globalCardIndex++

  const cardIndex = globalCardIndex

  return (

    <React.Fragment key={game.id}>

      <div className="timeline-slot">

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

      {promotions
        .filter(
          promo => Number(promo.gamesview_after_card) === cardIndex
        )
        .map(promo => (

          <PromotionCard
            key={`promo-${promo.id}`}
            promotion={promo}
          />

        ))
      }

    </React.Fragment>

  )

})}
	
              </div>

            ))}

{promotions
  .filter(
    promo =>
      Number(promo.gamesview_after_card) > totalGames
  )
  .map(promo => (

    <PromotionCard
      key={`promo-bottom-${promo.id}`}
      promotion={promo}
    />

  ))
}

          </div>
        </div>



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