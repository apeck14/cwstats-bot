const badges = require("../static/badges.js")
const { red } = require("../static/colors")
const allEmojis = require("../../allEmojis.json")
const fs = require("fs")

const getClanBadge = (badgeId, trophyCount, returnEmojiPath = true) => {
  if (badgeId === -1 || badgeId === null) return "no_clan" //no clan

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
  } else {
    //file path
    if (trophyCount >= 5000) league = "legendary-3"
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
  }

  return `${badgeName}_${league}`
}
const getEmoji = (emojiName) => {
  return allEmojis[emojiName]
}
const getArenaEmoji = (pb) => {
  if (pb >= 8000) return "arena24"
  else if (pb >= 7600) return "arena23"
  else if (pb >= 7300) return "arena22"
  else if (pb >= 7000) return "arena21"
  else if (pb >= 6600) return "arena20"
  else if (pb >= 6300) return "arena19"
  else if (pb >= 6000) return "arena18"
  else if (pb >= 5600) return "arena17"
  else if (pb >= 5300) return "arena16"
  else if (pb >= 5000) return "arena15"
  else if (pb >= 4600) return "arena14"
  else if (pb >= 4200) return "arena13"
  else if (pb >= 3800) return "arena12"
  else if (pb >= 3400) return "arena11"
  else if (pb >= 3000) return "arena10"
  else if (pb >= 2600) return "arena9"
  else if (pb >= 2300) return "arena8"
  else if (pb >= 2000) return "arena7"
  else if (pb >= 1600) return "arena6"
  else if (pb >= 1300) return "arena5"
  else if (pb >= 1000) return "arena4"
  else if (pb >= 600) return "arena3"
  else if (pb >= 300) return "arena2"
  else return "arena1"
}
const getLeague = (pb) => {
  if (pb >= 8000) return "league-10"
  else if (pb >= 7600) return "league-9"
  else if (pb >= 7300) return "league-8"
  else if (pb >= 7000) return "league-7"
  else if (pb >= 6600) return "league-6"
  else if (pb >= 6300) return "league-5"
  else if (pb >= 6000) return "league-4"
  else if (pb >= 5600) return "league-3"
  else if (pb >= 5300) return "league-2"
  else if (pb >= 5000) return "league-1"
  else return null
}

//convert hex to transparent rgba value
const hexToRgbA = (hex) => {
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    let c = hex.substring(1).split("")

    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]]
    }

    c = "0x" + c.join("")

    return (
      "rgba(" + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(",") + ",0.25)"
    )
  }

  return "rgba(255, 255, 255, 0.25)" //transparent white
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

const updateEmojis = (newEmojis) =>
  fs.writeFile("allEmojis.json", JSON.stringify(newEmojis), (err) => {
    if (err) console.error(err)
    else console.log("Emojis successfully updated!")
  })

module.exports = {
  getClanBadge,
  getEmoji,
  getArenaEmoji,
  getLeague,
  hexToRgbA,
  errorMsg,
  updateEmojis,
}
