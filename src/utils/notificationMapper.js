// ✅ Notification Mapper (Enterprise style)

export function mapNotification(n, t){
  let payload = {}

  try{
    payload = n.data ? JSON.parse(n.data) : {}
  }catch(e){
    console.log("payload parse error", e)
  }

  const rawTitle = payload.title || n.title || ""
  const rawBody  = payload.body  || n.body  || ""

  let type = n.type || detectType(rawTitle, rawBody)

if (
  type === "game_discovery" &&
  rawBody.toLowerCase().includes("favorite player activity")
) {
  type = "favorite_game"
}

  return {
  id: n.id,
  isUnread: !Number(n.is_read),

type, // 🔥 ТОВА ДОБАВЯШ

  ...payload,

  title: resolveTitle(type, rawTitle, t),
  body: resolveBody(type, rawBody, t, payload),
}
}

function extractName(text){
  return text?.replace(/ joined.*| left.*/i, "") || ""
}

/**
 * 🧠 DETECT TYPE
 */
function detectType(title, body){
  const t = (title || "").trim().toLowerCase()
  const b = (body || "").trim().toLowerCase()

if (t.includes("player wants to connect")) {
  return "player_contact"
}

  if(t.includes("new game available")){
    return "game_discovery"
  }

  if(t.includes("new group game")){
    return "group_game_created"
  }



  if(b.includes("match: your preferences")){
    return "game_match"
  }

  if(b.startsWith("your group has a new game")){
    return "group_game_created"
  }

if(b.includes("match: your availability")){
  return "game_availability"
}

  return "generic"
}


/**
 * 🎯 TITLE RESOLVER
 */

function resolveTitle(type, fallback, t){

  const map = {
    favorite_game: t.notification_favorite_game || "Favorite player created a game",
    game_discovery: t.notification_new_game,
    game_match: t.notification_new_game,
group_game: t.notification_group_game_created,
    group_game_created: t.notification_group_game_created,
    game_availability: t.notification_new_game,
game_reminder: t.notification_game_reminder || "Game reminder",
    game_joined: t.notification_player_joined || "Player joined",
    game_left: t.notification_player_left || "Player left",
    game_cancelled: t.notification_game_cancelled || "Game cancelled",
player_contact: t.notification_player_contact || "Player wants to connect",

    generic: fallback
  }

  return map[type] || fallback
}

function resolveBody(type, fallback, t, payload){

  const map = {
    favorite_game: t.notification_favorite_game_body || "Your favorite player created a new game",
    game_discovery: t.notification_match_preferences,
    game_match: t.notification_match_preferences,
group_game: t.notification_group_game_body,
    group_game_created: t.notification_group_game_body,
    game_availability: t.notification_match_availability,
game_reminder: payload?.metadata?.[0]?.reminder_type === "2h"
  ? (t.notification_reminder_2h || "Your game starts in 2 hours")
  : (t.notification_reminder_30m || "Your game starts in 30 minutes"),

    game_joined: t.notification_player_joined_body 
      ? t.notification_player_joined_body.replace(
          "{name}",
          payload?.actor_name || extractName(fallback)
        )
      : fallback,

    game_left: t.notification_player_left_body
      ? t.notification_player_left_body.replace(
          "{name}",
          payload?.actor_name || extractName(fallback)
        )
      : fallback,

    game_cancelled: t.notification_game_cancelled_body || fallback,
player_contact: payload.message
  ? `${payload.from_user_name}: ${payload.message}`
  : fallback,

    generic: fallback
  }

  return map[type] || fallback
}