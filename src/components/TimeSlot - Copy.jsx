import GameCard from "./GameCard"
import { texts } from "../i18n/texts"

export default function TimeSlot({
slot,
slotGames,
expanded,
toggleSlot,
maxCards,
profileComplete,
onOpenGame,
onCreateGame   // 🔥 ново
}){

const lang = localStorage.getItem("lang") || "bg"
const t = texts[lang] || texts.bg

const isHour = slot.endsWith(":00")

let visibleGames = slotGames

if(!expanded && slotGames.length > maxCards){
visibleGames = slotGames.slice(0,maxCards)
}

return(

<div
id={"slot-"+slot}
className={`timeline-slot
${slotGames.length === 0 ? "empty" : ""}
${expanded ? "expanded" : ""}
`}
>

<div
  className="timeline-time"
  onClick={(e) => {
  e.stopPropagation()

  console.log("CLICK TIME", slot)

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

<div className="slot-games-row">

{visibleGames.map(game => (
<GameCard
key={game.id}
game={game}
profileComplete={profileComplete}
onOpenGame={onOpenGame}
/>
))}

{!expanded && slotGames.length > maxCards && (

<div
className="more-games"
onClick={() => toggleSlot(slot)}
>
+{slotGames.length - maxCards}
</div>

)}

</div>

{expanded && slotGames.length > maxCards && (

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