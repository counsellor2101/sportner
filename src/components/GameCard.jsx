import api from "../api/api"
import { texts } from "../i18n/texts"
import { useAuth } from "../context/authcontext"
import {
  computeGameState,
  getGameCardClass,
  getGameActionType
} from "../helpers/gameState"
import { useState } from "react"
import ConfirmModal from "./ConfirmModal"
import { triggerPushPrompt } from "../push/pushBus"
import { Capacitor } from "@capacitor/core"



export default function GameCard({ game, venues, cities, onOpen, onOpenGame, variant }) {


  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg
const isTournament = game?.name && game.name.trim() !== ""

const [loadingAction, setLoadingAction] = useState(false)
const [confirm, setConfirm] = useState(null)
const [year, month, day] = (game.game_date || "").split("-").map(Number)
const [sh, sm] = (game.start_time || "").split(":").map(Number)
const [eh, em] = (game.end_time || "").split(":").map(Number)
const groupName = game.group_name ?? ""
const handleOpen = () => {
  if (onOpen) return onOpen(game.id)
  if (onOpenGame) return onOpenGame(game.id)
}

const isMyGames = variant === "my-games"

  const levelColors = {
    beginner: "#3ae766",
    intermediate: "#2D7DF6",
    advanced: "#c58600",
    pro: "#FF3B30"
  }

const { user, loading: userLoading } = useAuth()
if (userLoading) return null
	
const cityName =
  lang === "bg"
    ? game.city_name
    : game.city_name_en || game.city_name
  



  const sportColor = game.sport_color || "#ccc"
  const levelColor = levelColors[game.level_required] || "#ccc"

  const players = game.players_count ?? 0
  const isGroup = game.visibility === "group"


  const venue = venues?.[game.venue_id]
  const city = cities?.[venue?.city_id]



const gameState = computeGameState(game, user)
const cardClass = getGameCardClass(gameState, isGroup)

const actionType = getGameActionType(gameState)


function openProfileSetup(e) {
  e?.stopPropagation()

  window.dispatchEvent(
    new CustomEvent("openProfileSetup", {
      detail: {
        sport_id: game.sport_id,
        sport_name: game.sport_name,
        sport_icon: game.sport_icon,
        sport_color: game.sport_color
      }
    })
  )
}


async function joinGame(e) {
  e?.stopPropagation()

  if (loadingAction) return

  try {
    setLoadingAction(true)

    await api.post(`/games/${game.id}/join`)
    window.dispatchEvent(new Event("gamesUpdated"))
    
    window.dispatchEvent(new Event("gameJoined"))

const isNative = Capacitor.isNativePlatform()

if (isNative) {

  const { PushNotifications } = await import("@capacitor/push-notifications")

  const perm = await PushNotifications.checkPermissions()

  if (perm?.receive !== "granted") {

  if (!window.__joinPushPromptShown) {

    window.__joinPushPromptShown = true

    triggerPushPrompt("join_game")
  }
}

} else {

  if (
    typeof Notification !== "undefined" &&
    Notification.permission !== "granted"
  ) {
    if (!window.__joinPushPromptShown) {

  window.__joinPushPromptShown = true

  triggerPushPrompt("join_game")
}
  }
}

  } catch (e) {
    const errorCode = e?.response?.data?.error?.code

    if (errorCode === "PROFILE_INCOMPLETE") {
      openProfileSetup(e)
      return
    }

    if (errorCode === "SPORT_NOT_ALLOWED") {
      alert(t.sport_not_allowed || "You cannot join this sport")
      return
    }

  } finally {
    setLoadingAction(false)
  }
}

async function leaveGame() {
  if (loadingAction) return

  try {
    setLoadingAction(true)

    await api.delete(`/games/${game.id}/leave`)
    window.dispatchEvent(new Event("gamesUpdated"))

  } catch (e) {
    console.log("leave error", e)
  } finally {
    setLoadingAction(false)
  }
}

async function cancelGame() {
  if (loadingAction) return

  try {
    setLoadingAction(true)

    await api.delete(`/games/${game.id}/cancel`)
    window.dispatchEvent(new Event("gamesUpdated"))

  } catch (e) {
    console.log("cancel error", e)
  } finally {
    setLoadingAction(false)
  }
}

function handleConfirm() {
  if (confirm?.type === "leave") {
    leaveGame()
  }

  if (confirm?.type === "cancel") {
    cancelGame()
  }

  setConfirm(null)
}

function confirmLeave(e) {
  e?.stopPropagation()

  setConfirm({
    type: "leave",
    title: t.confirm_leave_title,
    message: t.confirm_leave_message,
    confirmText: t.confirm_leave_btn,
    danger: true
  })
}

function confirmCancel(e) {
  e?.stopPropagation()

  setConfirm({
    type: "cancel",
    title: t.confirm_cancel_title,
    message: t.confirm_cancel_message,
    confirmText: t.confirm_cancel_btn,
    danger: true
  })
}

function renderActions() {
  switch (actionType) {

    case "disabled":
      return (
        <button className={`game-card-btn ${gameState.toLowerCase()}`} disabled>
          {gameState === "CANCELLED"
            ? (t.cancelled || "Cancelled")
            : (t.finished || "Finished")}
        </button>
      )

    case "profile":
      return (
        <button
          className="game-card-btn profile-required"
          onClick={openProfileSetup}
        >
          {t.complete_profile || "Complete profile"}
        </button>
      )

    case "owner":
      return (
        <div className="game-card-actions owner-actions">
          <button
  className="game-card-btn cancel"
  onClick={confirmCancel}
disabled={loadingAction}
>
            {t.cancel}
          </button>

          <button
  className="game-card-btn leave"
  onClick={confirmLeave}
disabled={loadingAction}
>
            {t.leave}
          </button>
        </div>
      )

    case "leave":
      return (
        <button
  className="game-card-btn leave"
  onClick={confirmLeave}
>
          {t.leave}
        </button>
      )

    case "full":
      return (
        <button className="game-card-btn full" disabled>
          {t.full}
        </button>
      )

    case "join":
    default:
      return (
        <button
          className="game-card-btn"
          onClick={joinGame}
disabled={loadingAction}
        >
          {t.play}
        </button>
      )
case "join_disabled":
  return (
    <button className="game-card-btn" disabled>
      {t.play}
    </button>
  )
  }
}

const actions = renderActions()







  return (
<>
  <div
  className={`${cardClass} ${isMyGames ? "my-games" : ""} ${isTournament ? "tournament-game" : ""}`}
  onClick={handleOpen}
  style={{ "--sport-color": sportColor }}
>

      <div className="game-row1">
        <div className="sport-info">
          <img
            src={`/images/${game.sport_icon}`}
            className="sport-icon"
            alt={game.sport_name || "sport"}
          />

          <span className="sport-name">
            {game.sport_name}
          </span>
        </div>
{isTournament ? (
  <div className="gc-tournament-chip">
    🏆
  </div>
) : groupName ? (
  <div className="gc-group-chip">
    🔒
  </div>
) : null}
        <div className={`level-badge level-${game.level_required}`}>

<span className="level-dot"></span>

<span className="level-text">
{game.level_required}
</span>

</div>
      </div>

      <div className="game-divider"></div>

      <div className="game-row">
        <img
          src="/images/location_icon.png"
          className="row-icon"
          alt="location"
        />

        <span className="venue-text">
  {venue?.name || game.venue_name || ""}

  <span className="venue-divider">|</span>

  {cityName}
</span>
      </div>

      <div className="game-row">
        <img
          src="/images/clock_icon.png"
          className="row-icon"
          alt="time"
        />

        <span>
          {game.start_time?.slice(0, 5)} - {game.end_time?.slice(0, 5)}
        </span>
      </div>

      <div className="game-row">
        <img
          src="/images/players_icon.png"
          className="row-icon"
          alt="players"
        />

        <span>
          {players}/{game.max_players} {t.players}
        </span>
      </div>

      <div className="game-row-button">
        {actions}
      </div>
    </div>
<ConfirmModal
  open={!!confirm}
  title={confirm?.title}
  message={confirm?.message}
  confirmText={confirm?.confirmText}
  cancelText={t.confirm_back}
  type={confirm?.danger ? "danger" : "default"}
  onConfirm={handleConfirm}
  onCancel={() => setConfirm(null)}
/>
</>
  )
}
