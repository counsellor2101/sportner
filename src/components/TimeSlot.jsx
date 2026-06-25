import GameCard from "./GameCard"
import { texts } from "../i18n/texts"
import api from "../api/api"
import PromotionCard from "./PromotionCard"

export default function TimeSlot({
slot,
slotGames,
expanded,
toggleSlot,
maxCards,
profileComplete,
onOpenGame,
onCreateGame,
fullSlotClickable = false,
isSelected = false,
isStart = false,
isEnd = false,
showGames = true,   // 🔥
hasAlert = false,
alert = null,
alerts = [],
isAlertStart = false,   // 🔥 ДОБАВИ ТОВА
  cities = [],
  sports = [],
  venues = [],
isPast = false
}){

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

const isHour = slot.endsWith(":00")

const promotions = slotGames.filter(
  g => g.type === "promotion"
)

const realGames = slotGames.filter(
  g => g.type !== "promotion"
)

let visibleGames = showGames ? realGames : []

if(showGames && !expanded && slotGames.length > maxCards){
visibleGames = slotGames.slice(0,maxCards)
}

const getCityName = (id) => {
  const c = cities.find(c => c.id === id)
  if (!c) return ""
  return lang === "bg"
    ? c.name_bg || c.name
    : c.name_en || c.name_bg
}

const getSport = (id) => {
  return sports.find(s => s.id === id)
}



const getSportName = (id) => {
  const s = sports.find(s => s.id === id)
  if (!s) return ""

  return s.name_en || s.name_bg || s.name
}

const getLevelLabel = (level) => {
  return level || ""
}

const getVenueName = (id) => {
  const v = venues.find(v => v.id === id)
  if (!v) return ""
  return v.name
}

async function handleDeleteAlert(e){
  e.stopPropagation()

  if (!alerts || alerts.length === 0) return

const alertsToDelete = alert
  ? alerts.filter(a =>
      a.start === alert.start &&
      a.date === alert.date
    )
  : []

  for (const a of alertsToDelete){

    if(!a.id) continue

    try{
      await api.delete(`/me/alerts/${a.id}`)
    }catch(e){
      if(e.response?.status !== 404){
        console.log("delete alert error", e)
      }
    }
  }

  window.dispatchEvent(new Event("alertsUpdated"))
}

const slotAlerts = alert
  ? alerts.filter(a =>
      a.start === alert.start &&
      a.date === alert.date
    )
  : []

return(

<div
id={"slot-"+slot}
className={`timeline-slot
${(!showGames || slotGames.length === 0) ? "empty" : ""}
${expanded ? "expanded" : ""}
${isSelected ? "selected" : ""}
${isStart ? "selected-start" : ""}
${isEnd ? "selected-end" : ""}
${hasAlert ? "has-alert" : ""}
${isPast ? "past" : ""}
`}
onClick={() => {
if (isPast) return   // 🛑 блок

  if (!fullSlotClickable) return

  onCreateGame?.({
    slot,
    slotGames
  })
}}
>

<div
  className="timeline-time"
  onClick={(e) => {

if (isPast) return   // 🛑 блок


    if (fullSlotClickable) return

    e.stopPropagation()

    onCreateGame?.({
      slot,
      slotGames
    })
  }}
>

<span className={`time-label ${isHour ? "hour":"half"}`}>
{slot}
</span>

</div>

<div className={`time-line ${isHour ? "hour-line":"half-line"}`}></div>

<div className="timeline-content">

{alert && isAlertStart ? (

  <div
  className="alert-inline availability-alert-inline"
  onClick={(e) => e.stopPropagation()}
>

    <div className="notification-levels-vertical">

  {slotAlerts.map(a => {

    const sport = getSport(a.sport_id)
    if (!sport) return null

    return (
      <div key={a.id} className="notification-inline-group">

        {/* SPORT */}
        <div className="cgm-chip cgm-sport-chip active">
          <div className="cgm-sport-icon">
            <img
              src={sport.icon
                ? `/images/${sport.icon}`
                : `/images/sports/${sport.id}.png`}
              alt={sport.name_en}
            />
          </div>
          {getSportName(a.sport_id)}
        </div>

        {/* LEVEL */}
        <div className={`cgm-chip cgm-level-chip active level-${a.level}`}>
          {getLevelLabel(a.level)}
        </div>

        {/* VENUE */}
        {a.venue_id && (
          <div className="cgm-chip cgm-venue-chip active">
            {getVenueName(a.venue_id)}
          </div>
        )}

      </div>
    )
  })}

</div>

    {isAlertStart && (
  <button
    type="button"
    className="alert-delete availability-alert-delete"
    onClick={handleDeleteAlert}
  >
    ✕
  </button>
)}

  </div>

) : (

  <div className="slot-games-row">

{promotions.map(promo => (

  <PromotionCard
    key={`promo-${promo.id}`}
    promotion={promo}
  />

))}


    {showGames && visibleGames.map(game => (



      <GameCard
        key={game.id}
        game={game}
        profileComplete={profileComplete}
        onOpenGame={onOpenGame}
      />
    ))}

    {showGames && !expanded && slotGames.length > maxCards && (
      <div
        className="more-games"
        onClick={() => toggleSlot(slot)}
      >
        +{slotGames.length - maxCards}
      </div>
    )}

  </div>

)}

{showGames && expanded && slotGames.length > maxCards && (

<div
className="collapse-games"
onClick={() => toggleSlot(slot)}
>
{t.collapse}
</div>

)}

</div>





</div>

)

}