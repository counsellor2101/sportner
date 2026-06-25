import { useEffect, useState, useRef } from "react"
import api from "../api/api"
import "../styles/game-details-modal.css"
import { texts } from "../i18n/texts"
import { useAuth } from "../context/authcontext"
import {
  computeGameState,
  getGameActionType
} from "../helpers/gameState"
import ConfirmModal from "./ConfirmModal"
import UserProfileModal from "./UserProfileModal"
import { triggerPushPrompt } from "../push/pushBus"
import { Capacitor } from "@capacitor/core"


export default function GameDetailsModal({
  gameId,
  inviteToken,
  onClose
}) {

const [confirmType, setConfirmType] = useState(null)
// "leave" | "cancel" | null

const [selectedUserId, setSelectedUserId] = useState(null)
  const { user, loading: userLoading } = useAuth()

  const [game, setGame] = useState(null)
const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)

  const sheetRef = useRef(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const dragging = useRef(false)

const gameState = game ? computeGameState(game, user) : null
const actionType = gameState ? getGameActionType(gameState) : null



const isTournament = !!game?.name && game.name.trim() !== ""
const isTraining =
  game?.activity_type === "training"

const [isEditingNote, setIsEditingNote] = useState(false)
const [noteValue, setNoteValue] = useState("")
const [savingNote, setSavingNote] = useState(false)

  const sportColor = game?.sport_color || "#b30a0a"

  const lang = localStorage.getItem("lang") || "bg"
  const t = texts[lang] || texts.bg

const [showReserveInput, setShowReserveInput] = useState(false)
const [reservedName, setReservedName] = useState("")






const [inviteInfo, setInviteInfo] = useState(null)

  /* LOAD GAME */

  async function reloadGame() {
    try {
      const res = await api.get(`/games/${gameId}`)
      setGame(res.data)
const activitiesRes = await api.get(
  `/games/${gameId}/activities`
)

setActivities(
  activitiesRes.data?.data || []
)
    } catch (e) {
      console.log("game reload error", e)
    }
  }

  useEffect(() => {
    reloadGame()
  }, [gameId])

useEffect(() => {

  if (!inviteToken) return

  api.get(
    `/reserved-invite/${inviteToken}`
  )
  .then(res => {

    setInviteInfo(res.data)

  })
  .catch(() => {

    setInviteInfo(null)

  })

}, [inviteToken])

useEffect(() => {
  if (game && !isEditingNote) {
    setNoteValue(game.note || "")
  }
}, [game, isEditingNote])

async function saveNote() {
  if (savingNote) return

  try {
    setSavingNote(true)

    await api.put(`/games/${game.id}`, {
      note: noteValue
    })

    await reloadGame()

    setIsEditingNote(false)

    window.dispatchEvent(new Event("gamesUpdated"))

  } catch (e) {
    console.log("save note error", e)
  } finally {
    setSavingNote(false)
  }
}

const isOwner =
  Number(user?.user?.id) === Number(game?.creator_id)



  useEffect(() => {
    function handleGamesUpdated() {
      reloadGame()
    }

    window.addEventListener("gamesUpdated", handleGamesUpdated)

    return () =>
      window.removeEventListener("gamesUpdated", handleGamesUpdated)
  }, [gameId])

useEffect(() => {

  async function pollGame() {

    try {

      const res = await api.get(
        `/games/${gameId}`,
        {
          silent: true
        }
      )

      setGame(res.data)

      const activitiesRes = await api.get(
        `/games/${gameId}/activities`,
        {
          silent: true
        }
      )

      setActivities(
        activitiesRes.data?.data || []
      )

    } catch(e) {

      console.log(
        "game polling error",
        e
      )

    }

  }

  const interval = setInterval(
    pollGame,
    5000
  )

  return () => {
    clearInterval(interval)
  }

}, [gameId])

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

  function sportGradient(color) {
    return `linear-gradient(
      135deg,
      ${color},
      ${color}cc
    )`
  }

  useEffect(() => {

    function handleMove(e) {
      moveDrag(e)
    }

    function handleEnd() {
      endDrag()
    }

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", handleMove, { passive: false })
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleMove)
      window.removeEventListener("touchend", handleEnd)
    }

  }, [])

  /* DRAG START */

  function startDrag(e) {
    dragging.current = true
    startY.current = e.touches ? e.touches[0].clientY : e.clientY
    currentY.current = startY.current

    // <-- липсваше
    document.body.style.userSelect = "none"
  }

  /* DRAG MOVE */

  function moveDrag(e) {
    if (!dragging.current) return
    if (!sheetRef.current) return

if (e.cancelable && dragging.current) {
  e.preventDefault()
}

    currentY.current = e.touches
      ? e.touches[0].clientY
      : e.clientY

    const diff = currentY.current - startY.current

    if (diff > 0) {
      sheetRef.current.style.transition = "none"
      sheetRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  /* DRAG END */

  function endDrag() {
    if (!dragging.current) return
    if (!sheetRef.current) return

    dragging.current = false

    const diff =
      (currentY.current || startY.current) - startY.current

    sheetRef.current.style.transition = "transform .25s ease"

    if (diff > 120) {
      sheetRef.current.style.transform = "translateY(100%)"
      setTimeout(() => {
        onClose()
      }, 200)
    } else {
      sheetRef.current.style.transform = "translateY(0)"
    }

    document.body.style.userSelect = "auto"
  }

  function handleBackdrop(e) {
    if (dragging.current) return

    if (e.target.classList.contains("gdm-backdrop")) {
      onClose()
    }
  }

  function openProfileSetupFlow() {
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

  async function joinGame() {
    if (loading) return

    try {
      setLoading(true)



await api.post(`/games/${game.id}/join`)
await reloadGame()

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
      console.log("join error", e)

      const errorCode = e?.response?.data?.error?.code

      if (errorCode === "PROFILE_INCOMPLETE") {
        openProfileSetupFlow()
        return
      }

      if (errorCode === "SPORT_NOT_ALLOWED") {
        alert(t.sport_not_allowed || "You cannot join this sport")
        
      }

    } finally {
      setLoading(false)
    }
  }

async function acceptReservedInvite(){

  if (!inviteToken) return

  try {

    await api.post(
      `/reserved-invite/${inviteToken}/accept`
    )

    await reloadGame()

    setInviteInfo(null)

    window.dispatchEvent(
      new Event("gamesUpdated")
    )

    alert(
      t.reserved_spot_accepted ||
      "Reserved spot accepted"
    )

  } catch(e) {

    console.log(
      "accept reserved error",
      e
    )

  }
}

 async function leaveGame() {
  if (loading) return

  try {
    setLoading(true)

    await api.delete(`/games/${game.id}/leave`)

await reloadGame()
    window.dispatchEvent(new Event("gamesUpdated"))

  } catch (e) {
    console.log("leave error", e)
  } finally {
    setLoading(false)
  }
}

async function cancelGame() {
  if (loading) return

  try {
    setLoading(true)

    await api.delete(`/games/${game.id}/cancel`)
    window.dispatchEvent(new Event("gamesUpdated"))
    onClose()

  } catch (e) {
    console.log("cancel error", e)
  } finally {
    setLoading(false)
  }
}
console.log(
  "inviteInfo state",
  inviteInfo
)

  if (!game || userLoading) return null

  const freeSpots =
    game.max_players - (game.players_count || 0)



function renderAction() {
  switch (actionType) {

    case "disabled":
      return (
        <button className="gdm-join-btn" disabled>
          {gameState === "CANCELLED"
            ? (t.cancelled || "Cancelled")
            : (t.finished || "Finished")}
        </button>
      )

    case "profile":

      return (
        <button
          className="gdm-join-btn profile-required"
          onClick={openProfileSetupFlow}
        >
          {t.complete_profile || "Complete profile"}
        </button>
      )

    case "owner":
  return (
    <div className="game-card-actions owner-actions">
      <button
        className="game-card-btn cancel"
        onClick={() => setConfirmType("cancel")}
        disabled={loading}
      >
        {t.cancel}
      </button>

      <button
        className="game-card-btn leave"
        onClick={() => setConfirmType("leave")}
        disabled={loading}
      >
        {t.leave}
      </button>
    </div>
  )

case "owner_not_joined":
  return (
    <div className="game-card-actions owner-actions">

      <button
        className="gdm-join-btn"
        onClick={joinGame}
        disabled={loading || Number(game?.is_full) === 1}
      >
        {Number(game?.is_full) === 1
          ? (t.full || "Full")
          : (t.play || "Play")}
      </button>

      <button
        className="game-card-btn cancel"
        onClick={() => setConfirmType("cancel")}
        disabled={loading}
      >
        {t.cancel}
      </button>

    </div>
  )

    case "leave":
      return (
        <button
          className="gdm-join-btn"
          onClick={() => setConfirmType("leave")}
          disabled={loading}
        >
          {t.leave}
        </button>
      )

    case "full":
  if (isTournament) {
    return (
      <button
        className="gdm-join-btn"
        onClick={joinGame}
        disabled={loading}
      >
        {t.play}
      </button>
    )
  }

  return (
    <button className="gdm-join-btn" disabled>
      {t.full}
    </button>
  )

    case "join":
      return (
        <button
          className="gdm-join-btn"
          onClick={joinGame}
          disabled={loading}
        >
          {t.play}
        </button>
      )

    case "join_disabled":
      return (
        <button className="gdm-join-btn" disabled>
          {t.play}
        </button>
      )

    default:
      return null
  }
}

function buildShareText(game) {

  const tournamentLine = game.name
    ? `🏆 ${game.name}\n`
    : ""

  const sportLine =
    `🏅 ${game.sport_name}\n`

  return `
${tournamentLine}${sportLine}
📍 ${lang === "bg" ? game.city_name : game.city_name_en}
🏟 ${game.venue_name}
🗓 ${formatGameDate(game.game_date, lang)}
⏰ ${formatTime(game.start_time)} - ${formatTime(game.end_time)}
📶 ${game.level_required}
${(() => {

  const players = game.players || []
  const reservedPlayers = game.reserved_players || []
  const max = game.max_players || players.length

  const lines = []

  // реални играчи
  players.forEach(p => {
    lines.push(`👤 ${p.nickname}`)
  })

  // reserved играчи
  reservedPlayers.forEach(p => {
    lines.push(`👤 ${p.reserved_name}`)
  })

  // свободни места
  const occupied =
    players.length + reservedPlayers.length

  for (let i = occupied; i < max; i++) {
    lines.push("👤 ")
  }

  return lines.join("\n")

})()}
${game.court_reserved ? "✅ Court booked" : "❌ No court booked"}

👉 https://sportner.online/game/${game.id}
  `.trim()
} 	

function buildActivityCaption(game) {

  return `
${game.venue_name} | ${
  lang === "bg"
    ? game.city_name
    : game.city_name_en || game.city_name
} | ${formatGameDate(game.game_date, lang)}

  `.trim()
}

async function handleShare() {
  if (!game) return

  const text = buildShareText(game)

  // 📱 Native share (WhatsApp, Viber, etc.)
  if (navigator.share) {
    try {
      await navigator.share({
        title: game.sport_name,
        text
      })
      return
    } catch (e) {
      console.log("share cancelled")
    }
  }

  // 💻 fallback → copy
  try {
    await navigator.clipboard.writeText(text)
    alert("Copied to clipboard")
  } catch (e) {
    alert("Copy failed")
  }
}


async function toggleCourt() {
  if (!isOwner) return

  try {
    const newValue = game.court_reserved ? 0 : 1

    // 🔥 optimistic update
    setGame(prev => ({
      ...prev,
      court_reserved: newValue
    }))

    await api.put(`/games/${game.id}`, {
      court_reserved: newValue
    })

    window.dispatchEvent(new Event("gamesUpdated"))

  } catch (e) {
    console.log("toggle court error", e)
    await reloadGame() // fallback
  }
}

async function addReservedPlayer(){

  const name = reservedName.trim()

  if (!name) return

  try {

    await api.post(
      `/games/${game.id}/reserved-players`,
      {
        name
      }
    )

    setReservedName("")
    setShowReserveInput(false)

    await reloadGame()

    window.dispatchEvent(
      new Event("gamesUpdated")
    )

  } catch(e) {

    console.log(
      "add reserved error",
      e
    )

  }
}

const maxPlayers = game.max_players || 0
const players = game.players || []

const mainPlayers = players.slice(0, maxPlayers)
const reservePlayers = players.slice(maxPlayers)

const reservedPlayers =
  game.reserved_players || []



async function uploadActivity(e){

  const file = e.target.files?.[0]

  if (!file || !game) return

  try {

    const fd = new FormData()

    fd.append(
      "caption",
      buildActivityCaption(game)
    )

    fd.append(
      "visibility",
      "public"
    )

    fd.append(
      "game_id",
      game.id
    )

    fd.append(
      "media",
      file
    )

    const res = await api.post(
      "/activities",
      fd,
      {
        headers: {
          "Content-Type":
            "multipart/form-data"
        }
      }
    )

    console.log(res.data)

    alert(
      t.activity_uploaded ||
      "Activity uploaded"
     )
await reloadGame()

  } catch(e) {

    console.log(
      "activity upload error",
      e
    )

    alert(

  e?.response?.data?.error ||

  t.upload_failed ||

  "Upload failed"
)
  }

  e.target.value = ""
}


function renderNote(text) {

  if (!text) return null

  const urlRegex = /(https?:\/\/[^\s]+)/g

  return text.split(urlRegex).map((part, i) => {

    if (part.match(urlRegex)) {

      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="gdm-note-link-btn"
        >
          🔗 Open link
        </a>
      )
    }

    return part
  })
}

  return (

<>


    <div
      className="gdm-backdrop"
      onClick={handleBackdrop}
    >

      <div className="gdm-sheet" ref={sheetRef}>

        <div
          className="gdm-top-gradient"
          style={{ "--sport-color": sportColor }}
          onMouseDown={startDrag}
          onTouchStart={startDrag}
        >
          <div className="gdm-handle" />
        </div>

        {/* SPORT HEADER */}
<div className="gdm-content">
        <div className="gdm-sport-header">
          <img
            src={`/images/${game.sport_icon}`}
            className="gdm-sport-icon"
          />

          <div className="gdm-sport-title">
            {game.sport_name}
          </div>

          <div className={`level-badge level-${game.level_required}`}>
            <span className="level-dot"></span>
            <span className="level-text">
              {game.level_required}
            </span>
          </div>
<div
  className={`level-badge court-badge ${
    game.court_reserved ? "reserved" : "not-reserved"
  } ${isOwner ? "clickable" : ""}`}
  onClick={(e) => {
    e.stopPropagation()
    toggleCourt()
  }}
>

  <span className="level-text">
    {game.court_reserved
      ? (t.court_reserved || "Reserved")
      : (t.court_not_reserved || "Not reserved")}
  </span>
</div>

        </div>

        <div className="game-divider"></div>

        {/* GAME INFO */}


        <div className="gdm-info">

{isTournament ? (
  <div className="gdm-tournament-chip">
    🏆 {game.name}
  </div>
) : game.visibility === "group" && game.group_name ? (
  <div className="gdm-group-chip">
    {game.group_name}
  </div>
) : null}


          <div className="gdm-info-row">
            <img src="/images/calendar_icon.png" className="gdm-info-icon" />
            {formatGameDate(game.game_date, lang)}
          </div>

          <div className="gdm-info-row">
            <img src="/images/clock_icon.png" className="gdm-info-icon" />
            {formatTime(game.start_time)} – {formatTime(game.end_time)}
          </div>

          <div className="gdm-info-row">
            <img src="/images/location_icon.png" className="gdm-info-icon" />
             <span className="venue-text">
    {game.venue_name}

    <span className="venue-divider">|</span>

    {lang === "bg"
      ? game.city_name
      : game.city_name_en || game.city_name}
  </span>
          </div>

          <div className="gdm-info-row">
            <img src="/images/players_icon.png" className="gdm-info-icon" />
            {game.players_count}/{game.max_players} {t.players}
          </div>

        </div>

        {/* PLAYERS */}

        <div className="gdm-players-section">

{inviteInfo && !game.is_joined && (

  <div className="reserved-invite-box">

    <div className="reserved-invite-title">

      {t.reserved_spot_for || "Reserved spot for"}

      {" "}

      <strong>
        {inviteInfo.reserved_name}
      </strong>

    </div>

    <button
      className="gdm-join-btn"
      onClick={acceptReservedInvite}
    >
      {t.accept_reserved_spot || "Accept Reserved Spot"}
    </button>

  </div>

)}

          

<div className="gdm-players-actions">

{isOwner && (

  <button
    className="gdm-invite-btn"
    onClick={() =>
      setShowReserveInput(v => !v)
    }
  >
    ➕ {t.reserve_spot || "Reserve"}
  </button>

)}

  <button
    className="gdm-invite-btn"
    onClick={handleShare}
  >
    🔗 {t.invite_players || "Invite Players"}
  </button>

<label className="gdm-invite-btn">

  📸 {t.post_activity || "Post"}

  <input
    type="file"
    accept="image/*"
    hidden
    onChange={uploadActivity}
  />

</label>

<button
  className={`gdm-invite-btn ${
    gameState !== "FINISHED"
      ? "disabled-feedback-btn"
      : ""
  }`}
  disabled={gameState !== "FINISHED"}
  onClick={() => {

  if (gameState !== "FINISHED") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(
      "openFeedbackModal",
      {
        detail: {
          gameId: game.id
        }
      }
    )
  )

}}
>
  🏆 {t.game_result || "Game Result"}
</button>


          </div>

<div className="gdm-players-title">
            <span>{t.player_details}</span>
</div>

          <div className="gdm-players-list">

{showReserveInput && (

  <div className="reserve-player-box">

    <input
      className="reserve-player-input"
      value={reservedName}
      onChange={(e) =>
        setReservedName(e.target.value)
      }
      placeholder="Name"
    />

    <button
      className="gdm-invite-btn"
      onClick={addReservedPlayer}
    >
      Save
    </button>

  </div>

)}

            {/* MAIN PLAYERS */}
{mainPlayers.map(p => {
  const isPlayerOwner = p.id === game.creator_id
  const isCoach =
  isTraining &&
  isPlayerOwner

  return (
    <div
      key={p.id}
      className={`gdm-player-row ${
  isCoach ? "coach-row" : ""
}`}
      onClick={() => setSelectedUserId(p.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="gdm-player-avatar">
        {p.avatar ? (
          <img src={p.avatar} alt={p.nickname} />
        ) : (
          <span>{p.nickname.charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="gdm-player-info">
        <div className="player-row1">
          <span className="gdm-player-name">{p.nickname}</span>

          {isPlayerOwner && (
  <span className="player-owner">
    {isCoach
      ? t.coach
      : "👑"}
  </span>
)}

          <span className={`player-level level-${p.level || "mid"}`}>
            {p.level || "—"}
          </span>
        </div>

        <div className="player-row2">
          {t.player_side}:{" "}
          {p.preferred_side && (
            <span className={`player-side ${p.preferred_side}`}>
              {t[`side_${p.preferred_side}`] || p.preferred_side}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})}

{/* DIVIDER */}
{isTournament && reservePlayers.length > 0 && (
  <div className="gdm-divider">
    <span>{t.reserves || "Reserves"}</span>
  </div>
)}

{reservedPlayers.map(p => (

  <div
    key={`reserved-${p.id}`}
    className="gdm-player-row"
  >

    <div className="gdm-player-avatar gdm-free-avatar">
      👤
    </div>

    <div className="gdm-player-info">

      <div className="player-row1 reserved-row-header">

        <span className="gdm-player-name">
          {p.reserved_name}
        </span>

        {isOwner && (
  <div className="reserved-actions">

    <button
  className="gdm-invite-btn"
  onClick={async (e) => {

    e.stopPropagation()

    const link =
      `https://sportner.online/game/${game.id}?invite=${p.invite_token}`

    try {

      await navigator.clipboard.writeText(
        link
      )

      alert(
        t.link_copied ||
        "Invite link copied"
      )

    } catch(e) {

      console.log(
        "copy link error",
        e
      )

    }

  }}
>
  🔗 {t.invite_link || "Invite"}
</button>

    <button
      className="reserved-remove-btn"
      onClick={async (e) => {

        e.stopPropagation()

        if (!window.confirm(
          "Remove reserved player?"
        )) {
          return
        }

        await api.delete(
          `/games/${game.id}/reserved-players/${p.id}`
        )

        await reloadGame()

        window.dispatchEvent(
          new Event("gamesUpdated")
        )

      }}
    >
      ✕
    </button>

  </div>
)}

      </div>

    </div>

  </div>

))}

{/* RESERVES */}
{reservePlayers.map(p => (
  <div
    key={`reserve-${p.id}`}
    className="gdm-player-row"
    onClick={() => setSelectedUserId(p.id)}
    style={{ cursor: "pointer" }}
  >
    <div className="gdm-player-avatar">
      {p.avatar ? (
        <img src={p.avatar} alt={p.nickname} />
      ) : (
        <span>{p.nickname.charAt(0).toUpperCase()}</span>
      )}
    </div>

    <div className="gdm-player-info">

      <div className="player-row1">
       <span className="gdm-player-name">
    {p.nickname}
  </span>

        <span className={`player-level level-${p.level || "mid"}`}>
          {p.level || "—"}
        </span>
      </div>

      <div className="player-row2">
        {t.player_side}:{" "}
        {p.preferred_side && (
          <span className={`player-side ${p.preferred_side}`}>
            {t[`side_${p.preferred_side}`] || p.preferred_side}
          </span>
        )}
      </div>

    </div>
  </div>
))}

            {Array.from({ length: freeSpots }).map((_, i) => (
  <div
    key={"free" + i}
    className="gdm-player-row gdm-free"
    style={{
      cursor:
        actionType === "join" ||
        actionType === "profile"
          ? "pointer"
          : "default"
    }}
    onClick={() => {

      if (actionType === "profile") {
        openProfileSetupFlow()
        return
      }

      if (actionType === "join") {
        joinGame()
      }

    }}
  >

    <div className="gdm-player-avatar gdm-free-avatar">
      +
    </div>

    <div className="gdm-player-info">
      <div className="gdm-player-name">
        {t.free_spot_join || "Join game"}
      </div>
    </div>

  </div>
))}

          </div>
        </div>

{activities.length > 0 && (

  <div className="gdm-activities">

    <div className="gdm-note-title">
      {t.activities || "Activities"}
    </div>

    <div className="gdm-activities-list">

      {activities.map(a => (

        <div
  key={a.id}
  className="gdm-activity-card"
>

  {Number(a.user_id) === Number(user?.user?.id) && (

    <button
      className="gdm-activity-delete"
      onClick={async (e) => {

        e.stopPropagation()

        const ok = window.confirm(
          t.delete_activity_confirm ||
          "Delete activity?"
        )

        if (!ok) return

        try {

          await api.delete(
            `/activities/${a.id}`
          )

          setActivities(prev =>
            prev.filter(x => x.id !== a.id)
          )

        } catch(e) {

          console.log(
            "delete activity error",
            e
          )
        }
      }}
    >
      ✕
    </button>

  )}

          <img
            src={a.media_url}
            className="gdm-activity-image"
          />

          {a.caption && (

            <div className="gdm-activity-caption">
              {a.caption}
            </div>

          )}

        </div>
      ))}

    </div>

  </div>
)}

{/* NOTE */}
{(game.note || isOwner) && (

  <div className="gdm-note-card">

    <div className="gdm-note-title">
      {t.note || "Note"}

      {isOwner && !isEditingNote && (
        <button
          className="gdm-note-edit-btn"
          onClick={() => setIsEditingNote(true)}
        >
          ✏️
        </button>
      )}
    </div>

    {isOwner && isEditingNote ? (
      <>
        <textarea
          className="gdm-note-input"
          
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          rows={3}
        />

        <div className="gdm-note-actions">
          <button
            className="game-card-btn"
            onClick={saveNote}
            disabled={savingNote}
          >
            {t.save || "Save"}
          </button>

          <button
            className="game-card-btn cancel"
            onClick={() => {
              setIsEditingNote(false)
              setNoteValue(game.note || "")
            }}
          >
            {t.cancel || "Cancel"}
          </button>
        </div>
      </>
    ) : (
      <div className="gdm-note-text">
  {game.note
    ? renderNote(game.note)
    : (isOwner ? (t.add_note || "Add note...") : "")
  }
</div>
    )}

  </div>

)}
        {/* ACTION BAR */}


         <div className="gdm-action">
  {renderAction()}
</div>

{isTournament && isOwner && (
  <div className="gdm-action">
    <button
      className="game-card-btn cancel"
      onClick={() => setConfirmType("cancel")}
      disabled={loading}
    >
      {t.cancel}
    </button>
  </div>
)}


            </div> 
    </div>     
</div>   

    {/* 🔥 CONFIRM MODAL */}
    <ConfirmModal
      open={!!confirmType}
      title={
  confirmType === "cancel"
    ? (t.confirm_cancel_title || "Cancel game")
    : (t.confirm_leave_title || "Leave game")
}
      message={
        confirmType === "cancel"
          ? (t.confirm_cancel_message || "Are you sure you want to cancel this game?")
          : (t.confirm_leave_message || "Are you sure you want to leave this game?")
      }
      confirmText={
  confirmType === "cancel"
    ? (t.confirm_cancel_btn || "Cancel game")
    : (t.confirm_leave_btn || "Leave game")
}
      cancelText={t.confirm_back || "No"}
      type={confirmType === "cancel" ? "danger" : "default"}
      onCancel={() => setConfirmType(null)}
      onConfirm={async () => {

        if (confirmType === "cancel") {
          await cancelGame()
        }

        if (confirmType === "leave") {
          await leaveGame()
        }

        setConfirmType(null)
      }}
    />

{selectedUserId && (
  <UserProfileModal
    userId={selectedUserId}
    onClose={() => setSelectedUserId(null)}
  />
)}
  </>
)
}
