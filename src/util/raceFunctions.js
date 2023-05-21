module.exports = {
  getRacePlacements: (race, isColosseum) => {
    const fameAccessor = isColosseum ? "fame" : "periodPoints"
    const boatAccessor = isColosseum ? "periodPoints" : "fame"
    let newRace = {}

    race.forEach((c) => {
      newRace[c.tag] = {
        tag: c.tag,
        fame: c[fameAccessor],
        placement: Infinity,
        crossedFinishLine: c[boatAccessor] >= 10000,
      }
    })

    let clansWithPointsSorted = Object.values(newRace)
      .filter((cl) => cl.fame > 0)
      .sort((a, b) => b.fame - a.fame)

    let place = 1
    for (let i = 0; i < clansWithPointsSorted.length; i++) {
      const clan = clansWithPointsSorted[i]

      if (clan.crossedFinishLine) continue

      const clansWithSameFame = [clan.tag]
      while (
        clansWithPointsSorted[i + 1] &&
        clansWithPointsSorted[i + 1].fame === clan.fame
      ) {
        clansWithSameFame.push(clansWithPointsSorted[i + 1].tag)
        i++
      }

      clansWithSameFame.forEach((tag) => (newRace[tag].placement = place))

      place += clansWithSameFame.length
    }

    return Object.values(newRace).sort((a, b) => a.placement - b.placement)
  },
  getAvgFame: (clan, isColosseum, dayOfWeek) => {
    const { participants, fame, periodPoints } = clan
    const currentFame = isColosseum ? fame : periodPoints
    const isTraining = dayOfWeek <= 3
    const battleDaysCompleted = !isColosseum || isTraining ? 0 : dayOfWeek - 3

    if (currentFame === 0) return 0

    const attacksCompletedToday = participants.reduce(
      (a, b) => a + b.decksUsedToday,
      0
    )

    if (isColosseum) {
      if (attacksCompletedToday + 200 * battleDaysCompleted === 0) return 0
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

    let maxDuelsCompletedToday = 0
    let attacksCompletedToday = 0
    clan.participants.forEach((p) => {
      attacksCompletedToday += p.decksUsedToday
      if (p.decksUsedToday >= 2) maxDuelsCompletedToday++
    })

    const isTraining = dayOfWeek <= 3
    const battleDaysCompleted = !isColosseum || isTraining ? 0 : dayOfWeek - 3

    const totalPossibleFame = () => {
      const duelsRemainingToday = 50 - maxDuelsCompletedToday
      const totalAttacksRemaining = 200 - attacksCompletedToday
      let maxPossibleFame =
        fame +
        duelsRemainingToday * 500 +
        (totalAttacksRemaining - duelsRemainingToday * 2) * 200

      if (isColosseum) {
        maxPossibleFame += 45000 * (3 - battleDaysCompleted)
        return Math.min(maxPossibleFame, 180000)
      }

      return Math.min(maxPossibleFame, 45000)
    }

    let currentPossibleFame =
      maxDuelsCompletedToday * 500 +
      (attacksCompletedToday - maxDuelsCompletedToday * 2) * 200

    if (isColosseum) {
      currentPossibleFame += 45000 * battleDaysCompleted
    }

    let winRate = currentPossibleFame === 0 ? 0 : fame / currentPossibleFame
    const projFame = fame + (totalPossibleFame() - fame) * winRate

    if (isColosseum) {
      if (attacksCompletedToday === 0 && battleDaysCompleted === 0) return 0
      return Math.min(Math.ceil(projFame / 50) * 50, 180000)
    }

    if (attacksCompletedToday === 0) return 0
    return Math.min(Math.ceil(projFame / multiple) * multiple, 45000)
  },
}
