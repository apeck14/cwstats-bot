const getPossibleRemainingFame = (attacksCompletedToday, maxDuelsCompletedToday, isColosseum, dayOfWeek) => {
  const duelsRemainingToday = 50 - maxDuelsCompletedToday
  const totalAttacksRemaining = 200 - attacksCompletedToday
  let maxPossibleRemainingFame = duelsRemainingToday * 500 + (totalAttacksRemaining - duelsRemainingToday * 2) * 200

  if (isColosseum) {
    maxPossibleRemainingFame += 45000 * (6 - dayOfWeek)
  }

  return isColosseum ? Math.min(180000, maxPossibleRemainingFame) : Math.min(45000, maxPossibleRemainingFame)
}

const getAvgFame = (clan, isColosseum, dayOfWeek) => {
  const attacksCompletedToday = clan.participants.reduce((sum, p) => sum + p.decksUsedToday, 0)

  if (isColosseum && dayOfWeek === 3 && attacksCompletedToday === 0) return 0
  if ((!isColosseum && (clan.fame >= 10000 || attacksCompletedToday === 0)) || dayOfWeek < 3) return 0

  const totalAttacksUsed = isColosseum ? attacksCompletedToday + 200 * (dayOfWeek - 3) : attacksCompletedToday

  return (isColosseum ? clan.fame : clan.periodPoints) / totalAttacksUsed
}

const getProjFame = (clan, isColosseum, dayOfWeek) => {
  if ((!isColosseum && clan.fame >= 10000) || dayOfWeek < 3 || !clan.participants.length) return 0

  let attacksCompletedToday = 0
  let maxDuelsCompletedToday = 0

  for (const p of clan.participants) {
    attacksCompletedToday += p.decksUsedToday
    if (p.decksUsedToday >= 2) maxDuelsCompletedToday++
  }

  if ((!isColosseum && attacksCompletedToday === 0) || (isColosseum && dayOfWeek === 3 && attacksCompletedToday === 0))
    return 0

  const fame = isColosseum ? clan.fame : clan.periodPoints
  const multiple = fame % 10 === 0 ? 50 : 25

  let currentPossibleFame = maxDuelsCompletedToday * 500 + (attacksCompletedToday - maxDuelsCompletedToday * 2) * 200

  if (isColosseum) {
    currentPossibleFame += 45000 * (dayOfWeek - 3)
  }

  const winRate = fame / currentPossibleFame
  const possibleRemainingFame = getPossibleRemainingFame(
    attacksCompletedToday,
    maxDuelsCompletedToday,
    isColosseum,
    dayOfWeek,
  )

  const projectedFame = fame + possibleRemainingFame * winRate

  return Math.min(isColosseum ? 180000 : 45000, Math.ceil(projectedFame / multiple) * multiple)
}

const getCurrentPlacements = (race) => {
  const sortedClans = race.sort((a, b) => b.fame - a.fame)

  let place = 1

  for (let i = 0; i < sortedClans.length; ) {
    const currentFame = sortedClans[i].fame

    if (currentFame === 0) break

    let sameFameCount = 0
    for (let j = i; j < sortedClans.length && sortedClans[j].fame === currentFame; j++) {
      sortedClans[j].placement = place
      sameFameCount++
    }

    i += sameFameCount
    place += sameFameCount
  }

  return sortedClans
}

const formatPlacement = (place) => {
  if (place === 1) return "1st"
  if (place === 2) return "2nd"
  if (place === 3) return "3rd"
  if (place === 4) return "4th"
  if (place === 5) return "5th"
  return "N/A"
}

const getProjPlacements = (clans, dayOfWeek) => {
  if (dayOfWeek < 3) return clans

  const clanProjections = clans.map((c) => ({
    fame: c.projFame,
    tag: c.tag,
  }))

  const projPlacements = getCurrentPlacements(clanProjections)

  return clans.map((c) => {
    const { placement } = projPlacements.find((cl) => cl.tag === c.tag)

    return {
      ...c,
      projPlace: placement ? formatPlacement(placement) : undefined,
    }
  })
}

const getRaceDetails = (race) => {
  if (!race || !race?.clans || !race.clans.length) return { clans: [] }

  const isColosseum = race.periodType === "colosseum"
  const dayOfWeek = race.periodIndex % 7

  const { boatAccessor, fameAccessor } = isColosseum
    ? { boatAccessor: "periodPoints", fameAccessor: "fame" }
    : { boatAccessor: "fame", fameAccessor: "periodPoints" }

  const mappedClans = race.clans.map((clan) => ({
    badgeId: clan.badgeId,
    boatPoints: clan[boatAccessor],
    crossedFinishLine: clan[boatAccessor] >= 10000,
    fame: clan[fameAccessor],
    fameAvg: getAvgFame(clan, isColosseum, dayOfWeek),
    name: clan.name,
    participants: clan.participants || [],
    projFame: getProjFame(clan, isColosseum, dayOfWeek),
    tag: clan.tag,
    trophies: clan.clanScore,
  }))

  // add projPlace to each clan
  const projPlacements = getProjPlacements(mappedClans, dayOfWeek)

  const clans = getCurrentPlacements(projPlacements)

  clans.sort((a, b) => b.crossedFinishLine - a.crossedFinishLine || a.placement - b.placement)

  return {
    clans,
    periodIndex: race.periodIndex,
    periodType: race.periodType,
    sectionIndex: race.sectionIndex,
  }
}

module.exports = {
  getAvgFame,
  getProjFame,
  getRaceDetails,
}
