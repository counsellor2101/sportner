import { useEffect, useState } from "react"
import api from "../api/api"
import FeedbackModal from "./FeedbackModal"
import { useAuth } from "../context/authcontext"
import { texts } from "../i18n/texts"

export default function FeedbackModalHost() {

  const { user } = useAuth()

  const [open, setOpen] = useState(false)

  const [gameId, setGameId] = useState(null)

  const [loading, setLoading] = useState(false)

  const [players, setPlayers] = useState([])

const [game, setGame] = useState(null)

const lang =
  (localStorage.getItem("lang") || "bg")
    .toLowerCase()

const t =
  texts[lang] ?? texts.bg

  useEffect(() => {

    async function openModal(gameId) {

      try {

        setLoading(true)

        const res = await api.get(
          `/games/${gameId}`
        )

        const game = res.data

setGame(game)

        setPlayers(
          game.players || []
        )

        setGameId(gameId)

        setOpen(true)

      } catch (e) {

        console.log(
          "feedback modal load error",
          e
        )

      } finally {

        setLoading(false)

      }

    }

    function handler(e) {

      const gameId =
        e.detail?.gameId

      if (!gameId) return

      openModal(gameId)

    }

    window.addEventListener(
      "openFeedbackModal",
      handler
    )

    return () => {

      window.removeEventListener(
        "openFeedbackModal",
        handler
      )

    }

  }, [])

  async function submitFeedback(data) {

  try {

    const canSubmitResults =
      Number(game?.created_by) ===
        Number(user?.user?.id ?? user?.id)
      ||
      (user?.user?.role ?? user?.role)
        === "admin"

    if (canSubmitResults) {

  if (
    data.results_mode === "advanced"
  ) {

    await api.post(
      `/games/${gameId}/results`,
      {
        mode: "advanced",
        matches: data.matches
      }
    )

  } else if (
    data.results?.length
  ) {

    await api.post(
      `/games/${gameId}/results`,
      {
        mode: "simple",

        played_games:
          data.played_games,

        players: data.results.map(
          player => ({
            user_id: player.user_id,
            wins: player.wins,
            losses: 0,
            placement: null
          })
        )
      }
    )

  }

}

    await api.post(
      `/games/${gameId}/feedback`,
      {
        mvp_user_id:
          data.mvp_user_id,

        level_feedback:
          data.level_feedback
      }
    )

    setOpen(false)

alert(
  t.feedback_thanks ||
  "Feedback submitted"
)

    window.dispatchEvent(
      new Event("gamesUpdated")
    )

    window.dispatchEvent(
      new Event(
        "notificationsUpdated"
      )
    )

  } catch (e) {

  const error =
    e?.response?.data?.error

  if (
    error ===
    "Feedback already submitted"
  ) {

    alert(
      t.feedback_already_submitted ||
      "You have already submitted feedback for this game."
    )

    setOpen(false)

    return
  }

  console.log(
    "submit feedback error",
    e
  )

  alert(
    t.feedback_submit_failed ||
    "Failed to submit feedback"
  )

}

}

  return (
  <FeedbackModal
    open={open}
    onClose={() => setOpen(false)}
    players={players}
    currentUser={user}
    game={game}
    hasReservedPlayers={
  (game?.reserved_players || [])
    .length > 0
}
    isOwner={
  Number(game?.created_by) ===
    Number(user?.user?.id ?? user?.id)
  ||
  (user?.user?.role ?? user?.role) === "admin"
}
    onSubmit={submitFeedback}
  />
)
}