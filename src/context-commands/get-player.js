const { ApplicationCommandType } = require("discord.js")
const { addPlayer, getClan, getPlayer } = require("../util/api")
const { pink } = require("../static/colors")
const { errorMsg, getArenaEmoji, getClanBadge, getPlayerCardData } = require("../util/functions")
const { formatRole, formatStr, formatTag } = require("../util/formatting")

module.exports = {
  data: {
    name: "Get Player",
    name_localizations: {
      de: "spieler",
      "es-ES": "jugador",
      fr: "joueur",
      it: "giocatore",
      nl: "speler",
      tr: "oyuncu",
    },
    type: ApplicationCommandType.Message,
  },
  run: async (i, db, client) => {
    const tag = i.targetMessage.content

    const { data: player, error: playerError } = await getPlayer(tag)

    if (playerError) return errorMsg(i, playerError)

    // add player for website searching
    addPlayer(db, {
      clanName: player?.clan?.name || "",
      name: player.name,
      tag: player.tag,
    })

    let clanBadge

    if (!player.clan) {
      player.clan = {
        name: "None",
      }
      clanBadge = getClanBadge(-1)
    } else {
      // get clan badge
      const { data: clan, error: clanError } = await getClan(player.clan.tag)

      if (clanError) return errorMsg(i, clanError)

      clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    }

    const badgeEmoji = client.cwEmojis.get(clanBadge)
    const levelEmoji = client.cwEmojis.get(`level${player.expLevel}`)
    const polMedalsEmoji = client.cwEmojis.get("polmedals")
    const ladderEmoji = client.cwEmojis.get(getArenaEmoji(player.trophies))
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
      url: `https://royaleapi.com/player/${formatTag(tag).substring(1)}`,
    }

    embed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${
      player.bestTrophies
    }\n${badgeEmoji} **${formatStr(player.clan.name)}**${player.role ? ` (${formatRole(player.role)})` : ""}`

    const { bestPathOfLegendSeasonResult: bestPOLObj, currentPathOfLegendSeasonResult: currentPOLObj } = player

    // POL
    const currentPOLSeasonStr =
      currentPOLObj?.leagueNumber === 10 ? `${polMedalsEmoji} **${currentPOLObj.trophies}**` : "N/A"
    const bestPOLSeasonStr =
      bestPOLObj?.leagueNumber === 10
        ? `${polMedalsEmoji} **${bestPOLObj.trophies}**${bestPOLObj.rank ? ` (#${bestPOLObj.rank})` : ""}`
        : "N/A"

    embed.description += `\n\n**__POL__**\n`
    embed.description += `**Current Season**: ${currentPOLSeasonStr}`
    embed.description += `\n**Best Season**: ${bestPOLSeasonStr}`

    embed.description += `\n\n**__Stats__**\n**Legacy PB**: ${
      player.legacyTrophyRoadHighScore || "None"
    }\n**CW1 Wins**: ${player.warDayWins}\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${
      player.challengeMaxWins
    }\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` // stats
    embed.description += `**__Cards__**\n${wildShardEmoji}: ${evolutions}\n${level15}: ${lvl15}\n${level14}: ${lvl14}\n${level13}: ${lvl13}` // cards

    return i.editReply({
      embeds: [embed],
      files: [
        {
          attachment: `./src/static/images/arenas/${getArenaEmoji(player.trophies)}.png`,
          name: "arena.png",
        },
      ],
    })
  },
}
