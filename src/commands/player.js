const { addPlayer, getClan, getLinkedAccount, getPlayer } = require("../util/services")
const { pink } = require("../static/colors")
const { errorMsg, getArenaEmoji, getPlayerCardData, warningMsg } = require("../util/functions")
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
    const iUser = i.options.getUser("user")
    const iTag = i.options.getString("tag")

    let tag

    if (!iUser && !iTag) {
      // linked account
      const { data: linkedAccount, error } = await getLinkedAccount(i.user.id)

      if (error) return errorMsg(i, error)

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else return warningMsg(i, `**No tag linked!** Use </link:960088363417882631> to link your tag.`)
    } else if (iTag) tag = iTag
    else {
      // user
      const { data: linkedAccount, error } = await getLinkedAccount(iUser.id)

      if (error) return errorMsg(i, error)

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else return warningMsg(i, `<@!${iUser.id}> **does not have an account linked.**`)
    }

    const { data: player, error: playerError } = await getPlayer(tag)

    if (playerError) return errorMsg(i, playerError)

    // add player for website searching
    addPlayer(player.tag)

    const inClan = !!player.clan

    let clanBadge = "no_clan"

    if (inClan) {
      const { data: clan, error: clanError } = await getClan(player.clan.tag, true)

      if (clanError) return errorMsg(i, clanError)

      clanBadge = clan.badge
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
      url: `https://royaleapi.com/player/${formatTag(tag, false)}`,
    }

    embed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${
      player.bestTrophies
    }\n${badgeEmoji} **${formatStr(player.clan.name)}**${player.role ? ` (${formatRole(player.role)})` : ""}`

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

    i.editReply({
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
