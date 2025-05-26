const dice = require("fast-dice-coefficient")
const badges = require("../static/badges")
const { green, orange, pink, red } = require("../static/colors")
const { formatRole, formatStr } = require("./formatting")

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

const warningMsg = (i, message) => {
  i.editReply({
    embeds: [
      {
        color: orange,
        description: message,
      },
    ],
  })
}

const successMsg = (i, message) => {
  i.editReply({
    embeds: [
      {
        color: green,
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

const createPlayerEmbed = (client, player, clanBadge) => {
  const arenaEmoji = getArenaEmoji(player.trophies)

  const badgeEmoji = client.cwEmojis.get(clanBadge)
  const levelEmoji = client.cwEmojis.get(`level${player.expLevel}`)
  const polMedalsEmoji = client.cwEmojis.get("polmedals")
  const ladderEmoji = client.cwEmojis.get(arenaEmoji)
  const pbEmoji = client.cwEmojis.get(getArenaEmoji(player.bestTrophies))
  const level15 = client.cwEmojis.get("level15")
  const level14 = client.cwEmojis.get("level14")
  const level13 = client.cwEmojis.get("level13")
  const wildShardEmoji = client.cwEmojis.get("wildshard")

  const ccWins = player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
  const gcWins = player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
  const cw2Wins = player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0

  const { evolutions, lvl13, lvl14, lvl15 } = getPlayerCardData(player.cards)

  const embed = {
    color: pink,
    description: ``,
    thumbnail: {
      url: "attachment://arena.png",
    },
    title: `${levelEmoji} **${player.name}**`,
    url: `https://royaleapi.com/player/${player.tag.substring(1)}`,
  }

  const clanName = player?.clan?.name || "None"

  embed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${
    player.bestTrophies
  }\n${badgeEmoji} **${formatStr(clanName)}**${player.role ? ` (${formatRole(player.role)})` : ""}`

  const {
    bestPathOfLegendSeasonResult: bestPOLObj,
    currentPathOfLegendSeasonResult: currentPOLObj,
    lastPathOfLegendSeasonResult: lastPOLObj,
  } = player

  // ! bug with supercell's API for current POL season rank
  const currentPOLSeasonStr =
    currentPOLObj?.leagueNumber === 10 ? `${polMedalsEmoji} **${currentPOLObj.trophies}**` : "N/A"

  const bestPOLSeasonStr =
    bestPOLObj?.leagueNumber === 10
      ? `${polMedalsEmoji} **${bestPOLObj.trophies}**${bestPOLObj.rank ? ` (#${bestPOLObj.rank})` : ""}`
      : "N/A"

  const lastPOLSeasonStr =
    lastPOLObj?.leagueNumber === 10
      ? `${polMedalsEmoji} **${lastPOLObj.trophies}**${lastPOLObj.rank ? ` (#${lastPOLObj.rank})` : ""}`
      : "N/A"

  embed.description += `\n\n**__POL__**`
  embed.description += `\n**Current Season**: ${currentPOLSeasonStr}`
  embed.description += `\n**Last Season**: ${lastPOLSeasonStr}`
  embed.description += `\n**Best Season**: ${bestPOLSeasonStr}`

  embed.description += `\n\n**__Stats__**\n**Legacy PB**: ${
    player.legacyTrophyRoadHighScore || "None"
  }\n**CW1 Wins**: ${player.warDayWins}\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${
    player.challengeMaxWins
  }\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n`
  embed.description += `**__Cards__**\n${wildShardEmoji}: ${evolutions}\n${level15}: ${lvl15}\n${level14}: ${lvl14}\n${level13}: ${lvl13}`

  return {
    embeds: [embed],
    files: [
      {
        attachment: `./src/static/images/arenas/${arenaEmoji}.png`,
        name: "arena.png",
      },
    ],
  }
}

module.exports = {
  createPlayerEmbed,
  errorMsg,
  findBestMatch,
  getArenaEmoji,
  getClanBadge,
  getPlayerCardData,
  successMsg,
  warningMsg,
}
