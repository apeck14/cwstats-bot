const { addPlayer, getClan, getPlayer } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { errorMsg, getArenaEmoji, getClanBadge } = require("../util/functions")
const { formatRole, formatStr, formatTag } = require("../util/formatting")

module.exports = {
  data: {
    description: "View player stats.",
    description_localizations: {
      de: "Spielerstatistiken anzeigen.",
      "es-ES": "Ver estadísticas del jugador.",
      fr: "Afficher les statistiques du joueur.",
      it: "Visualizza le statistiche del giocatore.",
      nl: "Bekijk spelersstatistieken.",
      tr: "Oyuncu istatistiklerini görüntüleyin.",
    },
    name: "player",
    name_localizations: {
      de: "spieler",
      "es-ES": "jugador",
      fr: "joueur",
      it: "giocatore",
      nl: "speler",
      tr: "oyuncu",
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
        required: false,
        type: 3,
      },
      {
        description: "Select a Discord user",
        description_localizations: {
          de: "Wähle einen Discord-Benutzer",
          "es-ES": "Seleccionar un usuario de Discord",
          fr: "Sélectionnez un utilisateur Discord",
          it: "Seleziona un utente Discord",
          nl: "Selecteer een Discord-gebruiker",
          tr: "Bir Discord kullanıcısı seçin",
        },
        name: "user",
        name_localizations: {
          de: "benutzer",
          "es-ES": "usuario",
          fr: "utilisateur",
          it: "utente",
          nl: "gebruiker",
          tr: "kullanıcı",
        },
        required: false,
        type: 6,
      },
    ],
  },
  run: async (i, db, client) => {
    const linkedAccounts = db.collection("Linked Accounts")

    const user = i.options.getUser("user")
    const iTag = i.options.getString("tag")
    let tag

    if (!user && !iTag) {
      // linked account
      const linkedAccount = await linkedAccounts.findOne({
        discordID: i.user.id,
      })

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: `**No tag linked!** Use **/link** to link your tag.`,
            },
          ],
        })
      }
    } else if (iTag)
      tag = iTag // tag
    else {
      // user
      const linkedAccount = await linkedAccounts.findOne({
        discordID: user.id,
      })

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: `<@!${user.id}> **does not have an account linked.**`,
            },
          ],
        })
      }
    }

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
    const level12 = client.cwEmojis.get("level12")

    const ccWins = player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
    const gcWins = player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
    const cw2Wins = player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0
    const lvl15Cards = player.cards.filter((c) => c.maxLevel - c.level === -1).length
    const lvl14Cards = player.cards.filter((c) => c.maxLevel - c.level === 0).length
    const lvl13Cards = player.cards.filter((c) => c.maxLevel - c.level === 1).length
    const lvl12Cards = player.cards.filter((c) => c.maxLevel - c.level === 2).length

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
    embed.description += `**__Cards__**\n${level15}: ${lvl15Cards}\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}` // cards

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
