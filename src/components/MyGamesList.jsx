export default function MyGamesList({ games, onOpenGame }) {

  const sortedGames = [...games].sort((a, b) => {
    const aDate = new Date(`${a.game_date}T${a.start_time}`)
    const bDate = new Date(`${b.game_date}T${b.start_time}`)
    return bDate - aDate
  })

  return (
    <div className="my-games">
      {sortedGames.map(game => (
        <GameCard
          key={game.id}
          game={game}
          onOpen={() => onOpenGame(game.id)}
        />
      ))}
    </div>
  )
}