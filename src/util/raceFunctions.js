module.exports = {
  getRacePlacements: (race, isColosseum) => {
    // return [{tag: '', fame: 0, placement: 0, crossedFinishLine: true}]
    const fameAccessor = isColosseum ? "fame" : "periodPoints"
    const boatAccessor = isColosseum ? "periodPoints" : "fame"
    const newRace = race.map((c) => ({
      tag: c.tag,
      fame: c[fameAccessor],
      placement: Infinity,
    }))

    const clansWithPointsSorted = newRace
      .filter((cl) => cl.fame > 0)
      .sort((a, b) => b.fame - a.fame)

    const clansCrossed = race.filter((c) => c[boatAccessor] >= 10000)

    clansCrossed.forEach(
      (c) => (newRace.find((cl) => cl.tag === c.tag).crossedFinishLine = true)
    )

    let place = 1

    for (let i = 0; i < clansWithPointsSorted.length; i++) {
      const clan = clansWithPointsSorted[i]

      if (clan.crossedFinishLine) continue

      const clansWithSameFame = [clan.tag]

      for (let x = i + 1; x < clansWithPointsSorted.length; x++) {
        const nextClan = clansWithPointsSorted[x]
        if (nextClan.fame === clan.fame) clansWithSameFame.push(nextClan.tag)
      }

      for (const c of clansWithSameFame)
        newRace.find((cl) => c === cl.tag).placement = place

      i += clansWithSameFame.length - 1
      place += clansWithSameFame.length
    }

    return newRace.sort((a, b) => a.placement - b.placement)
  },
  getAvgFame: (clan, isColosseum, dayOfWeek) => {
    const attacksCompletedToday = clan.participants.reduce(
      (a, b) => a + b.decksUsedToday,
      0
    )
    const currentFame = isColosseum ? clan.fame : clan.periodPoints
    const isTraining = dayOfWeek <= 3
    const battleDaysCompleted = !isColosseum || isTraining ? 0 : dayOfWeek - 3

    if (isColosseum) {
      if (attacksCompletedToday === 0 && battleDaysCompleted === 0) return 0

      return currentFame / (attacksCompletedToday + 200 * battleDaysCompleted)
    }

    if (attacksCompletedToday === 0) return 0

    return currentFame / attacksCompletedToday
  },
  getProjFame: (clan, isColosseum, dayOfWeek) => {
    const movementPoints = isColosseum ? clan.periodPoints : clan.fame
    const fame = isColosseum ? clan.fame : clan.periodPoints
    const multiple = fame % 10 === 0 ? 50 : 25

    if (!isColosseum && movementPoints >= 10000) return 0

    const maxDuelsCompletedToday = clan.participants.filter(
      (p) => p.decksUsedToday >= 2
    ).length
    const attacksCompletedToday = clan.participants.reduce(
      (a, b) => a + b.decksUsedToday,
      0
    )
    const isTraining = dayOfWeek <= 3
    const battleDaysCompleted = !isColosseum || isTraining ? 0 : dayOfWeek - 3

    const totalPossibleFame = () => {
      const movementPoints = isColosseum ? clan.periodPoints : clan.fame
      const fame = isColosseum ? clan.fame : clan.periodPoints

      if (!isColosseum && movementPoints >= 10000) return 0

      const duelsRemainingToday = 50 - maxDuelsCompletedToday
      const totalAttacksRemaining = 200 - attacksCompletedToday
      let maxPossibleFame =
        fame +
        duelsRemainingToday * 500 +
        (totalAttacksRemaining - duelsRemainingToday * 2) * 200 //max fame today

      if (isColosseum) {
        maxPossibleFame += 45000 * (3 - battleDaysCompleted)

        return maxPossibleFame > 180000 ? 180000 : maxPossibleFame
      }

      return maxPossibleFame > 45000 ? 45000 : maxPossibleFame
    }

    let currentPossibleFame =
      maxDuelsCompletedToday * 500 +
      (attacksCompletedToday - maxDuelsCompletedToday * 2) * 200
    let winRate = fame / currentPossibleFame

    if (isColosseum) {
      if (attacksCompletedToday === 0 && battleDaysCompleted === 0) return 0

      currentPossibleFame += 45000 * battleDaysCompleted
      winRate = fame / currentPossibleFame

      const projFame = fame + (totalPossibleFame() - fame) * winRate

      return projFame > 180000 ? 180000 : Math.ceil(projFame / 50) * 50
    }

    if (attacksCompletedToday === 0) return 0
    const projFame = fame + (totalPossibleFame() - fame) * winRate

    return projFame > 45000 ? 45000 : Math.ceil(projFame / multiple) * multiple
  },
}
