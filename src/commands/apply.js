const { addPlayer, getClan, getGuild, getPlayer } = require("../util/services")
const { pink } = require("../static/colors")
const { errorMsg, getArenaEmoji, getPlayerCardData, successMsg, warningMsg } = require("../util/functions")
const { formatRole, formatStr, formatTag } = require("../util/formatting")

module.exports = {
  data: {
    description: "Apply to join the clan.",
    description_localizations: {
      de: "Bewerben Sie sich, um dem Clan beizutreten.",
      "es-ES": "Solicita unirte al clan.",
      fr: "Postulez pour rejoindre le clan.",
      it: "Richiedi di unirti al clan.",
      nl: "Solliciteer om lid te worden van de clan.",
      tr: "Klana katılmak için başvurun.",
    },
    name: "apply",
    name_localizations: {
      de: "bewerben",
      "es-ES": "solicitar",
      fr: "postuler",
      it: "applica",
      nl: "solliciteren",
      tr: "başvur",
    },
    options: [
      {
        description: "Player tag (#ABC123)",
        description_localizations: {
          de: "Spielertag (#ABC123)",
          "es-ES": "Etiqueta del jugador (#ABC123)",
          fr: "Tag du joueur (#ABC123)",
          it: "Tag del giocatore (#ABC123)",
          nl: "Spelertag (#ABC123)",
          tr: "Oyuncu etiketi (#ABC123)",
        },
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          "es-ES": "etiqueta",
          fr: "balise",
          it: "tag",
          nl: "tag",
          tr: "etiket",
        },
        required: true,
        type: 3,
      },
    ],
  },
  run: async (i, db, client) => {
    const { data: guild, error: guildError } = await getGuild(i.guildId, true)

    if (guildError) {
      return errorMsg(i, guildError)
    }

    const { applicationsChannelID } = guild.channels || {}

    const APPLICATIONS_CHANNEL = applicationsChannelID && client.channels.cache.get(applicationsChannelID)

    if (!APPLICATIONS_CHANNEL) {
      const msg = `The set **applications** channel has been deleted. Please set the new channel [here](https://www.cwstats.com/me/servers/${i.guildId}/channels).`
      return warningMsg(i, msg)
    }

    const iTag = i.options.getString("tag")

    const { data: player, error: playerError } = await getPlayer(iTag)

    if (playerError) {
      return errorMsg(i, playerError)
    }

    // add player for website searching
    addPlayer(player.tag)

    const inClan = !!player.clan

    let clanBadge = "no_clan"

    if (inClan) {
      const { data: clan, error: clanError } = await getClan(player.clan.tag)

      if (clanError) {
        return errorMsg(i, clanError)
      }

      clanBadge = clan.badge
    }

    const ladderArena = getArenaEmoji(player.trophies)
    const pbArena = getArenaEmoji(player.bestTrophies)

    const badgeEmoji = client.cwEmojis.get(clanBadge)
    const levelEmoji = client.cwEmojis.get(`level${player.expLevel}`)
    const polMedalsEmoji = client.cwEmojis.get("polmedals")
    const ladderEmoji = client.cwEmojis.get(ladderArena)
    const pbEmoji = client.cwEmojis.get(pbArena)
    const level15 = client.cwEmojis.get("level15")
    const level14 = client.cwEmojis.get("level14")
    const level13 = client.cwEmojis.get("level13")
    const wildShardEmoji = client.cwEmojis.get("wildshard")

    const ccWins = player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
    const gcWins = player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
    const cw2Wins = player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0

    const { evolutions, lvl13, lvl14, lvl15 } = getPlayerCardData(player.cards)

    const applicationEmbed = {
      color: pink,
      description: ``,
      thumbnail: {
        url: "attachment://arena.png",
      },
      title: "__New Application!__",
    }

    const royaleApiUrl = `https://royaleapi.com/player/${formatTag(player.tag, false)}`
    const name = formatStr(player.name)
    const clanName = inClan ? formatStr(player.clan.name) : "*None*"
    const role = inClan ? ` (${formatRole(player.role)})` : ""

    applicationEmbed.description += `${levelEmoji} [**${name}**](${royaleApiUrl})\n`
    applicationEmbed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${player.bestTrophies}\n`
    applicationEmbed.description += `${badgeEmoji} **${clanName}**${role}`

    const { bestPathOfLegendSeasonResult: bestPOLObj, currentPathOfLegendSeasonResult: currentPOLObj } = player

    // POL
    const currentPOLSeasonStr =
      currentPOLObj?.leagueNumber === 10 ? `${polMedalsEmoji} **${currentPOLObj.trophies}**` : "N/A"
    const bestPOLSeasonStr =
      bestPOLObj?.leagueNumber === 10
        ? `${polMedalsEmoji} **${bestPOLObj.trophies}**${bestPOLObj.rank ? ` (#${bestPOLObj.rank})` : ""}`
        : "N/A"

    applicationEmbed.description += `\n\n**__POL__**\n`
    applicationEmbed.description += `**Current Season**: ${currentPOLSeasonStr}`
    applicationEmbed.description += `\n**Best Season**: ${bestPOLSeasonStr}`

    applicationEmbed.description += `\n\n**__Stats__**\n**Legacy PB**: ${
      player.legacyTrophyRoadHighScore || "None"
    }\n**CW1 Wins**: ${player.warDayWins}\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${
      player.challengeMaxWins
    }\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` // stats
    applicationEmbed.description += `**__Cards__**\n${wildShardEmoji}: ${evolutions}\n${level15}: ${lvl15}\n${level14}: ${lvl14}\n${level13}: ${lvl13}` // cards
    applicationEmbed.description += `\n\n**Request By**: <@!${i.user.id}>`

    successMsg(i, `✅ Request sent for **${name}**! A Co-Leader will contact you shortly.`)

    return APPLICATIONS_CHANNEL.send({
      embeds: [applicationEmbed],
      files: [
        {
          attachment: `./src/static/images/arenas/${ladderArena}.png`,
          name: "arena.png",
        },
      ],
    })
  },
}
