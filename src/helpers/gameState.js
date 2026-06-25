export function computeGameStatus(game) {
  if (!game) return "open"

  if (game.status === "cancelled") return "cancelled"

  if (!game.game_date || !game.start_time || !game.end_time) {
    return "open"
  }

  function toTimestamp(date, time) {
  const [y, m, d] = date.split("-").map(Number)

  const cleanTime = String(time).includes(" ")
    ? String(time).split(" ")[1]
    : String(time)

  const [hh, mm] = cleanTime.split(":").map(Number)

  return new Date(y, m - 1, d, hh, mm).getTime()
}
  const now = Date.now()

  const start = toTimestamp(game.game_date, game.start_time)
  let end = toTimestamp(game.game_date, game.end_time)

  // ако играта минава през полунощ
  if (end <= start) {
    end += 24 * 60 * 60 * 1000
  }

  if (now > end) return "finished"
  if (now >= start) return "live"

  return "open"
}

export function computeGameMeta(game, user) {
  const isJoined = Number(game?.is_joined) === 1
  const isOwner = Number(game?.is_owner) === 1
  const isFull = Number(game?.is_full) === 1

  const canPlayThisSport =
    !!game?.sport_id &&
    !!user?.sports?.length &&
    user.sports.some(s => s.sport_id == game.sport_id)

  return {
    isJoined,
    isOwner,
    isFull,
    canPlayThisSport
  }
}

export function computeGameState(game, user) {

const conflict = Number(game.has_conflict) === 1

  const status = computeGameStatus(game)

  const {
    isJoined,
    isOwner,
    isFull,
    canPlayThisSport
  } = computeGameMeta(game, user)

const isTournament = game?.name && game.name.trim() !== ""



  // 🔥 HARD STATES
  if (status === "cancelled") return "CANCELLED"
  if (status === "finished") return "FINISHED"

if (conflict && !isJoined && !isOwner) {
  return "CONFLICT"
}

  // 🔥 USER BLOCKERS
  if (!canPlayThisSport) return "PROFILE_REQUIRED"



if (isOwner && isJoined) return "OWNER"

if (isOwner && !isJoined) {
  return "OWNER_NOT_JOINED"
}

if (isJoined) return "JOINED"

  // 🔥 GAME STATES
  if (isFull) return "FULL"

  return "AVAILABLE"
}

export function getGameCardClass(gameState, isGroup) {
  let cls = "game-card"

  if (isGroup) cls += " group-game"

if (gameState === "CONFLICT") {
  return "game-card conflict"
}

  switch (gameState) {
    case "JOINED":
case "OWNER":   // 🔥 ДОБАВИ ТОВА
      cls += " joined-game"
      break
    case "FULL":
      cls += " full-game"
      break
    case "CANCELLED":
      cls += " cancelled-game"
      break
    case "FINISHED":
      cls += " finished-game"
      break
  }

  return cls
}

export function getGameActionType(gameState) {
  switch (gameState) {
    case "CANCELLED":
    case "FINISHED":
      return "disabled"

case "CONFLICT":
  return "join_disabled"

    case "PROFILE_REQUIRED":
      return "profile"

    case "OWNER":
      return "owner"

case "OWNER_NOT_JOINED":
  return "owner_not_joined"

    case "JOINED":
      return "leave"

    case "FULL":
      return "full"

    default:
      return "join"
  }
}