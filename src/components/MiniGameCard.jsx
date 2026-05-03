export default function MiniGameCard({game}){

return(

<div className="mini-game-card">

<span className="mini-sport">🎾</span>

<span className="mini-level"></span>

<span className="mini-players">
{game.players}/{game.max_players}
</span>

<span className="mini-time">
{game.start_time}
</span>

</div>

)

}