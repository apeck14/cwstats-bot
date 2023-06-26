const { getPlayer, getClan } = require("../util/api")
const { orange, pink } = require("../static/colors")
const {
  getClanBadge,
  getEmoji,
  getArenaEmoji,
  errorMsg,
} = require("../util/functions")
const { createCanvas, registerFont, loadImage } = require("canvas")
const { formatTag, formatRole, formatStr } = require("../util/formatting")
registerFont("./src/static/fonts/Supercell-Magic.ttf", {
  family: "Supercell-Magic",
})

module.exports = {
  data: {
    name: "player",
    name_localizations: {
      de: "spieler",
      fr: "joueur",
      "es-ES": "jugador",
      tr: "oyuncu",
      it: "giocatore",
      nl: "speler",
    },
    description: "View player stats.",
    description_localizations: {
      de: "Spielerstatistiken anzeigen.",
      fr: "Afficher les statistiques du joueur.",
      "es-ES": "Ver estadísticas del jugador.",
      tr: "Oyuncu istatistiklerini görüntüleyin.",
      it: "Visualizza le statistiche del giocatore.",
      nl: "Bekijk spelersstatistieken.",
    },
    options: [
      {
        type: 3,
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          fr: "balise",
          "es-ES": "etiqueta",
          tr: "etiket",
          it: "tag",
          nl: "tag",
        },
        description: "Player tag (#ABC123)",
        description_localizations: {
          de: "Spielertag (#ABC123)",
          fr: "Tag du joueur (#ABC123)",
          "es-ES": "Etiqueta del jugador (#ABC123)",
          tr: "Oyuncu etiketi (#ABC123)",
          it: "Tag del giocatore (#ABC123)",
          nl: "Spelertag (#ABC123)",
        },
        required: false,
      },
      {
        type: 6,
        name: "user",
        name_localizations: {
          de: "benutzer",
          fr: "utilisateur",
          "es-ES": "usuario",
          tr: "kullanıcı",
          it: "utente",
          nl: "gebruiker",
        },
        description: "Select a Discord user",
        description_localizations: {
          de: "Wähle einen Discord-Benutzer",
          fr: "Sélectionnez un utilisateur Discord",
          "es-ES": "Seleccionar un usuario de Discord",
          tr: "Bir Discord kullanıcısı seçin",
          it: "Seleziona un utente Discord",
          nl: "Selecteer een Discord-gebruiker",
        },
        required: false,
      },
    ],
  },
  run: async (i, db) => {
    const linkedAccounts = db.collection("Linked Accounts")

    const user = i.options.getUser("user")
    const iTag = i.options.getString("tag")
    let tag

    if (!user && !iTag) {
      //linked account
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
    } else if (iTag) tag = iTag //tag
    else {
      //user
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

    const { error: playerError, data: player } = await getPlayer(tag)

    if (playerError) return errorMsg(i, playerError)

    const playerRank = player.leagueStatistics?.currentSeason?.rank
    const arenaImage = await loadImage(
      `./src/static/images/arenas/${getArenaEmoji(player.trophies)}.png`
    )

    const canvas = createCanvas(arenaImage.width, arenaImage.height)
    const context = canvas.getContext("2d")

    context.drawImage(arenaImage, 0, 0, canvas.width, canvas.height)

    //add global rank
    if (playerRank >= 1) {
      const fontSize = () => {
        if (playerRank < 10) return 130
        if (playerRank < 1000) return 115

        return 90
      }

      context.font = `${fontSize()}px Supercell-Magic`

      const textWidth = context.measureText(playerRank).width
      const [tX, tY] = [
        (arenaImage.width - textWidth) / 2,
        arenaImage.height / 2 + 15,
      ]
      const [oX, oY] = [tX + 4, tY + 6]

      context.fillStyle = "black"
      context.fillText(playerRank, oX, oY)

      context.fillStyle = "white"
      context.fillText(playerRank, tX, tY)
    }

    let clanBadge

    if (!player.clan) {
      player.clan = {
        name: "None",
      }
      clanBadge = getClanBadge(-1)
    } else {
      //get clan badge
      const { data: clan, error: clanError } = await getClan(player.clan.tag)

      if (clanError) return errorMsg(i, clanError)

      clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    }

    const badgeEmoji = getEmoji(clanBadge)
    const levelEmoji = getEmoji(`level${player.expLevel}`)
    const polMedalsEmoji = getEmoji("polmedals")
    const ladderEmoji = getEmoji(getArenaEmoji(player.trophies))
    const pbEmoji = getEmoji(getArenaEmoji(player.bestTrophies))
    const level15 = getEmoji("level15")
    const level14 = getEmoji("level14")
    const level13 = getEmoji("level13")
    const level12 = getEmoji("level12")

    const ccWins =
      player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
    const gcWins =
      player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
    const cw2Wins =
      player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0
    const lvl15Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === -1
    ).length
    const lvl14Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 0
    ).length
    const lvl13Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 1
    ).length
    const lvl12Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 2
    ).length

    const embed = {
      color: pink,
      url: `https://royaleapi.com/player/${formatTag(tag).substring(1)}`,
      title: `${levelEmoji} **${player.name}**`,
      description: ``,
      thumbnail: {
        url: "attachment://arena.png",
      },
    }

    embed.description += `${ladderEmoji} **${player.trophies}** / ${pbEmoji} ${
      player.bestTrophies
    }\n${badgeEmoji} **${formatStr(player.clan.name)}**${
      player.role ? ` (${formatRole(player.role)})` : ""
    }`

    const {
      currentPathOfLegendSeasonResult: currentPOL,
      bestPathOfLegendSeasonResult: bestPOL,
    } = player

    // POL
    if (currentPOL.leagueNumber === 10 || bestPOL.leagueNumber === 10) {
      embed.description += `\n\n**__POL__**\n`
      embed.description += `**Current Season**: ${polMedalsEmoji} **${currentPOL.trophies}**`

      embed.description += `\n**Best Season**: `

      if (bestPOL.leagueNumber === 10)
        embed.description += `${polMedalsEmoji} **${bestPOL.trophies}**${
          bestPOL.rank ? ` (#${bestPOL.rank})` : ""
        }`
      else embed.description += "None"
    }

    embed.description += `\n\n**__Stats__**\n**Legacy PB**: ${
      player.legacyTrophyRoadHighScore || "None"
    }\n**CW1 Wins**: ${
      player.warDayWins
    }\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${
      player.challengeMaxWins
    }\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` //stats
    embed.description += `**__Cards__**\n${level15}: ${lvl15Cards}\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}` //cards

    return i.editReply({
      embeds: [embed],
      files: [
        {
          attachment: canvas.toBuffer(),
          name: "arena.png",
        },
      ],
    })
  },
}
