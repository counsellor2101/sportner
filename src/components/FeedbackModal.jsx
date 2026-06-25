import { useEffect, useState } from "react"
import { texts } from "../i18n/texts"
import "../styles/feedback-modal.css"

export default function FeedbackModal({
  open,
  onClose,
  players = [],
  currentUser,
  game,
  isOwner = false,
  hasReservedPlayers = false,
  onSubmit
}) {	

  const lang = (localStorage.getItem("lang") || "bg").toLowerCase()
  const t = texts[lang] ?? texts.bg

  const [mvpUserId, setMvpUserId] = useState(null)
  const [levelFeedback, setLevelFeedback] = useState(null)

const [playerResults, setPlayerResults] =
  useState([])

const [playedGames, setPlayedGames] =
  useState(1)

const [resultsMode, setResultsMode] =
  useState("simple")

const [matches, setMatches] =
  useState([])

useEffect(() => {

  setPlayedGames(1)

setResultsMode("simple")
setMatches([])

  setPlayerResults(
    players.map(player => ({
      user_id: player.id,
      wins: 0
    }))
  )

}, [players])

function increaseWin(userId) {

  setPlayerResults(prev =>
    prev.map(player =>
      player.user_id === userId
        ? {
            ...player,
            wins:
  Math.min(
    playedGames,
    player.wins + 1
  )
          }
        : player
    )
  )

}

function decreaseWin(userId) {

  setPlayerResults(prev =>
    prev.map(player =>
      player.user_id === userId
        ? {
            ...player,
            wins: Math.max(
                0,
                player.wins - 1
              )
          }
        : player
    )
  )

}

function increasePlayedGames() {

  setPlayedGames(prev => prev + 1)

}

function decreasePlayedGames() {

  const nextValue =
    Math.max(1, playedGames - 1)

  setPlayedGames(nextValue)

  setPlayerResults(prev =>
    prev.map(player => ({
      ...player,
      wins: Math.min(
        player.wins,
        nextValue
      )
    }))
  )

}

function addMatch() {
  setMatches(prev => [
    ...prev,
    {
      id: Date.now(),
      teamA: [],
      teamB: [],
      scoreA: "",
      scoreB: ""
    }
  ])
}

function removeMatch(matchId) {
  setMatches(prev =>
    prev.filter(match => match.id !== matchId)
  )
}

function updateMatchScore(matchId, key, value) {
  setMatches(prev =>
    prev.map(match =>
      match.id === matchId
        ? {
            ...match,
            [key]: value
          }
        : match
    )
  )
}

function addPlayerToTeam(matchId, userId, team) {
  setMatches(prev =>
    prev.map(match => {
      if (match.id !== matchId) return match

      return {
        ...match,
        teamA:
          team === "A"
            ? [
                ...match.teamA.filter(id => id !== userId),
                userId
              ]
            : match.teamA.filter(id => id !== userId),

        teamB:
          team === "B"
            ? [
                ...match.teamB.filter(id => id !== userId),
                userId
              ]
            : match.teamB.filter(id => id !== userId)
      }
    })
  )
}

function removePlayerFromMatch(matchId, userId) {
  setMatches(prev =>
    prev.map(match =>
      match.id === matchId
        ? {
            ...match,
            teamA: match.teamA.filter(id => id !== userId),
            teamB: match.teamB.filter(id => id !== userId)
          }
        : match
    )
  )
}

function getPlayerName(userId) {
  return players.find(p => Number(p.id) === Number(userId))
    ?.nickname || "Player"
}

function isAdvancedInvalid() {
  if (resultsMode !== "advanced") return false

  if (!matches.length) return true

if (
  matches.every(
    match =>
      !match.teamA.length &&
      !match.teamB.length
  )
) {
  return true
}

  return matches.some(match => {
    if (!match.teamA.length) return true
    if (!match.teamB.length) return true
    if (match.scoreA === "") return true
    if (match.scoreB === "") return true
    if (Number(match.scoreA) === Number(match.scoreB)) return true

    const allPlayers = [
      ...match.teamA,
      ...match.teamB
    ]

    return new Set(allPlayers).size !== allPlayers.length
  })
}

const currentUserId =
  Number(
    currentUser?.user?.id ??
    currentUser?.id
  )

function formatGameDate(date, lang = "bg") {
    if (!date) return ""

    const d = new Date(date)

    const weekday = new Intl.DateTimeFormat(lang, {
      weekday: "long"
    }).format(d)

    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()

    const w = weekday.charAt(0).toUpperCase() + weekday.slice(1)

    return `${w} ${day}.${month}.${year}`
  }

function formatTime(time) {
  if (!time) return ""

  // ако е HH:mm:ss
  if (time.length <= 8) {
    return time.slice(0, 5)
  }

  // ако е datetime → взимаме само часа
  return time.slice(11, 16)
}




  if (!open) return null


  return (
    <div
      className="feedback-overlay"
      onClick={onClose}
    >
      <div
        className="feedback-container"
        onClick={(e) => e.stopPropagation()}
      >

<button
  type="button"
  className="feedback-close-btn"
  onClick={onClose}
>
  ✕
</button>

        <div className="feedback-title">
          {t.feedback_title || "Game Feedback"}
        </div><div className="feedback-game-info">

  <div className="gdm-info-row">
    <img
      src={`/images/${game?.sport_icon}`}
      className="gdm-info-icon"
    />
    {game?.sport_name}
  </div>

  <div className="gdm-info-row">
    <img
      src="/images/calendar_icon.png"
      className="gdm-info-icon"
    />
    {formatGameDate(
      game?.game_date,
      lang
    )}
  </div>

  <div className="gdm-info-row">
    <img
      src="/images/clock_icon.png"
      className="gdm-info-icon"
    />
    {formatTime(game?.start_time)}
    {" – "}
    {formatTime(game?.end_time)}
  </div>

  <div className="gdm-info-row">
    <img
      src="/images/location_icon.png"
      className="gdm-info-icon"
    />

    <span className="venue-text">
      {game?.venue_name}

      <span className="venue-divider">
        |
      </span>

      {lang === "bg"
        ? game?.city_name
        : game?.city_name_en ||
          game?.city_name}
    </span>

  </div>

</div>

        <div className="feedback-sub">
          {t.feedback_sub || "Help improve ratings and matchmaking"}
        </div>

{isOwner && (

<>
  <div className="feedback-section-title">
    🏆 {t.game_result || "Game Result"}
  </div>

<div className="feedback-mode-switch">

  <button
    type="button"
    className={
      resultsMode === "simple"
        ? "feedback-mode-btn active"
        : "feedback-mode-btn"
    }
    onClick={() => setResultsMode("simple")}
  >
    {t.results_simple || "Simple"}
  </button>

  <button
  type="button"
  disabled={hasReservedPlayers}
  className={
    resultsMode === "advanced"
      ? "feedback-mode-btn active"
      : "feedback-mode-btn"
  }
  onClick={() => {

    if (hasReservedPlayers) {
      return
    }

    setResultsMode("advanced")
  }}
>
    {t.results_advanced || "Advanced"}
{hasReservedPlayers
  ? " 🔒"
  : ""}
  </button>

</div>

{hasReservedPlayers && (

  <div className="feedback-warning">

    {t.advanced_results_disabled ||
      "Advanced results are unavailable when reserved players are in the game because some players may not have a level or rating yet."}

  </div>

)}

{resultsMode === "simple" && (
  <>

<div className="feedback-played-games">

  <div className="feedback-played-label">
    {t.played_games || "Played Games"}
  </div>

  <div className="feedback-result-controls">

    <button
      type="button"
      onClick={decreasePlayedGames}
    >
      -
    </button>

    <div className="feedback-result-value">
      {playedGames}
    </div>

    <button
      type="button"
      onClick={increasePlayedGames}
    >
      +
    </button>

  </div>

</div>	

  <div className="feedback-results">

    {playerResults.map(result => {

      const player =
        players.find(
          p => p.id === result.user_id
        )

      if (!player) return null

      return (

        <div
          key={player.id}
          className="feedback-result-row"
        >

          <div className="feedback-result-player">

  {player.avatar && (
    <img
      src={player.avatar}
      className="feedback-result-avatar"
    />
  )}

  <span>
    {player.nickname}
  </span>

</div>

          <div className="feedback-result-controls">

            <button
              type="button"
              onClick={() =>
                decreaseWin(player.id)
              }
            >
              -
            </button>

            <div className="feedback-result-value">
  {result.wins}
</div>

            <button
              type="button"
              onClick={() =>
                increaseWin(player.id)
              }
            >
              +
            </button>

          </div>

        </div>

      )

    })}

  </div>
</>

)}

{resultsMode === "advanced" && (

  <div className="feedback-advanced">

    {matches.map((match, index) => {

  const selectedPlayers = [
    ...match.teamA,
    ...match.teamB
  ]

  const availablePlayers =
    players.filter(
      player =>
        !selectedPlayers.includes(
          player.id
        )
    )

  return (

      <div
        key={match.id}
        className="feedback-match-card"
      >

        <div className="feedback-match-header">

          <span>
            {t.match || "Match"} {index + 1}
          </span>

          <button
            type="button"
            onClick={() =>
              removeMatch(match.id)
            }
          >
            ✕
          </button>

        </div>

<div className="feedback-available-players">

  {availablePlayers.map(player => (

    <div
      key={player.id}
      className="feedback-available-player"
    >

      <span>
        {player.nickname}
      </span>

      <div className="feedback-player-actions">

        <button
          type="button"
          onClick={() =>
            addPlayerToTeam(
              match.id,
              player.id,
              "A"
            )
          }
        >
          A
        </button>

        <button
          type="button"
          onClick={() =>
            addPlayerToTeam(
              match.id,
              player.id,
              "B"
            )
          }
        >
          B
        </button>

      </div>

    </div>




))}

</div>

<div className="feedback-match-teams">

  <div className="feedback-team-box">

  <div className="feedback-team-title">
    {t.team_a || "Team A"}
  </div>

  {match.teamA.map(userId => (

  <button
    key={userId}
    type="button"
    className="feedback-team-player"
    onClick={() =>
      removePlayerFromMatch(
        match.id,
        userId
      )
    }
  >
    {getPlayerName(userId)} ✕
  </button>

))}

<input
  type="number"
  min="0"
  className="feedback-score-input"
  placeholder={
    t.score || "Score"
  }
  value={match.scoreA}
  onChange={(e) =>
    updateMatchScore(
      match.id,
      "scoreA",
      e.target.value
    )
  }
/>

</div>

  <div className="feedback-team-box">

  <div className="feedback-team-title">
    {t.team_b || "Team B"}
  </div>

  {match.teamB.map(userId => (

  <button
    key={userId}
    type="button"
    className="feedback-team-player"
    onClick={() =>
      removePlayerFromMatch(
        match.id,
        userId
      )
    }
  >
    {getPlayerName(userId)} ✕
  </button>

))}

<input
  type="number"
  min="0"
  className="feedback-score-input"
  placeholder={
    t.score || "Score"
  }
  value={match.scoreB}
  onChange={(e) =>
    updateMatchScore(
      match.id,
      "scoreB",
      e.target.value
    )
  }
/>

</div>

</div>

      </div>

)

})}

    <button
      type="button"
      className="feedback-add-match"
      onClick={addMatch}
    >
      + {t.add_match || "Add Match"}
    </button>

  </div>

)}

</>
)}

        {/* MVP */}

        <div className="feedback-section-title">
          {t.feedback_best_player ||
 "Which of the other players performed best today?"}
        </div>

        <div className="feedback-players">
  {players
  .filter(
    player =>
      Number(player.id) !==
      currentUserId
  )
  .map(player => (
      <button
        key={player.id}
        className={
          mvpUserId === player.id
            ? "feedback-player active"
            : "feedback-player"
        }
        onClick={() => setMvpUserId(player.id)}
      >
        {player.nickname}
      </button>
    ))}
</div>

        {/* LEVEL */}

        <div className="feedback-section-title">
          {t.feedback_level || "How was the game level for you?"}
        </div>

        <div className="feedback-levels">

          <button
            className={
              levelFeedback === -1
                ? "feedback-level active"
                : "feedback-level"
            }
            onClick={() => setLevelFeedback(-1)}
          >
            🔴 {t.level_below || "Below my level"}
          </button>

          <button
            className={
              levelFeedback === 0
                ? "feedback-level active"
                : "feedback-level"
            }
            onClick={() => setLevelFeedback(0)}
          >
            🟡 {t.level_same || "At my level"}
          </button>

          <button
            className={
              levelFeedback === 1
                ? "feedback-level active"
                : "feedback-level"
            }
            onClick={() => setLevelFeedback(1)}
          >
            🟢 {t.level_above || "Above my level"}
          </button>

        </div>

        <button
          className="feedback-submit"
          disabled={
  mvpUserId === null ||
  levelFeedback === null ||
  isAdvancedInvalid()
}
          onClick={() =>
  onSubmit?.({
    mvp_user_id: mvpUserId,
    level_feedback: levelFeedback,

    results_mode: resultsMode,

    results: playerResults,

    played_games: playedGames,

    matches
  })
}
        >
          {t.feedback_submit || "Submit"}
        </button>

      </div>
    </div>
  )
}