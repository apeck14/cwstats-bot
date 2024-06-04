const dice = require("fast-dice-coefficient")
const badges = require("../static/badges")
const { red } = require("../static/colors")

const getClanBadge = (badgeId, trophyCount, returnEmojiPath = true) => {
  if (badgeId === -1 || badgeId === null) return "no_clan" // no clan

  const badgeName = badges.find((b) => b.id === badgeId).name
  let league

  if (returnEmojiPath) {
    if (trophyCount >= 5000) league = "legendary3"
    else if (trophyCount >= 4000) league = "legendary2"
    else if (trophyCount >= 3000) league = "legendary1"
    else if (trophyCount >= 2500) league = "gold3"
    else if (trophyCount >= 2000) league = "gold2"
    else if (trophyCount >= 1500) league = "gold1"
    else if (trophyCount >= 1200) league = "silver3"
    else if (trophyCount >= 900) league = "silver2"
    else if (trophyCount >= 600) league = "silver1"
    else if (trophyCount >= 400) league = "bronze3"
    else if (trophyCount >= 200) league = "bronze2"
    else league = "bronze1"
  } else if (trophyCount >= 5000) league = "legendary-3"
  else if (trophyCount >= 4000) league = "legendary-2"
  else if (trophyCount >= 3000) league = "legendary-1"
  else if (trophyCount >= 2500) league = "gold-3"
  else if (trophyCount >= 2000) league = "gold-2"
  else if (trophyCount >= 1500) league = "gold-1"
  else if (trophyCount >= 1200) league = "silver-3"
  else if (trophyCount >= 900) league = "silver-2"
  else if (trophyCount >= 600) league = "silver-1"
  else if (trophyCount >= 400) league = "bronze-3"
  else if (trophyCount >= 200) league = "bronze-2"
  else league = "bronze-1"

  return `${badgeName}_${league}`
}

const getArenaEmoji = (pb) => {
  if (pb >= 8000) return "arena24"
  if (pb >= 7600) return "arena23"
  if (pb >= 7300) return "arena22"
  if (pb >= 7000) return "arena21"
  if (pb >= 6600) return "arena20"
  if (pb >= 6300) return "arena19"
  if (pb >= 6000) return "arena18"
  if (pb >= 5600) return "arena17"
  if (pb >= 5300) return "arena16"
  if (pb >= 5000) return "arena15"
  if (pb >= 4600) return "arena14"
  if (pb >= 4200) return "arena13"
  if (pb >= 3800) return "arena12"
  if (pb >= 3400) return "arena11"
  if (pb >= 3000) return "arena10"
  if (pb >= 2600) return "arena9"
  if (pb >= 2300) return "arena8"
  if (pb >= 2000) return "arena7"
  if (pb >= 1600) return "arena6"
  if (pb >= 1300) return "arena5"
  if (pb >= 1000) return "arena4"
  if (pb >= 600) return "arena3"
  if (pb >= 300) return "arena2"
  return "arena1"
}

const getLeague = (pb) => {
  if (pb >= 8000) return "league-10"
  if (pb >= 7600) return "league-9"
  if (pb >= 7300) return "league-8"
  if (pb >= 7000) return "league-7"
  if (pb >= 6600) return "league-6"
  if (pb >= 6300) return "league-5"
  if (pb >= 6000) return "league-4"
  if (pb >= 5600) return "league-3"
  if (pb >= 5300) return "league-2"
  if (pb >= 5000) return "league-1"
  return null
}

const hexToRgbA = (hex) => {
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    let c = hex.substring(1).split("")

    if (c.length === 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }

    c = `0x${c.join("")}`

    return `rgba(${[(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",")},0.25)`
  }

  return "rgba(255, 255, 255, 0.25)" // transparent white
}

const errorMsg = (i, message) => {
  i.editReply({
    embeds: [
      {
        color: red,
        description: message,
      },
    ],
  })
}

const findBestMatch = (str, arr) => {
  let bestMatch = { rating: 0, str: null }

  for (const s of arr) {
    const rating = dice(str, s)

    if (rating === 1)
      return {
        rating,
        str: s,
      }

    if (rating > bestMatch.rating) bestMatch = { rating, str: s }
  }

  return bestMatch
}

const getPlayerCardData = (cards) => {
  const cardData = {
    evolutions: 0,
    lvl13: 0,
    lvl14: 0,
    lvl15: 0,
  }

  for (const c of cards) {
    const levelDiff = c.maxLevel - c.level

    if (levelDiff === -1) cardData.lvl15++
    else if (levelDiff === 0) cardData.lvl14++
    else if (levelDiff === 1) cardData.lvl13++

    if (c.evolutionLevel) cardData.evolutions++
  }

  return cardData
}

module.exports = {
  errorMsg,
  findBestMatch,
  getArenaEmoji,
  getClanBadge,
  getLeague,
  getPlayerCardData,
  hexToRgbA,
}
