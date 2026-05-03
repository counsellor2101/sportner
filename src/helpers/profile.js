export function getProfileCompletion(user) {
  if (!user) return 0

  let score = 0

  if (user.phone) score += 30
  if (user.play_city?.id) score += 30

  if (user.sports?.length > 0) {
    score += 30

    const hasSide = user.sports.some(s => s.preferred_side)
    if (hasSide) score += 10
  }

  return score
}