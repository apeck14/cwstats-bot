const { getPlayer, getClan } = require("../util/api")
const { orange, pink } = require("../static/colors")
const {
  getClanBadge,
  getEmoji,
  getArenaEmoji,
  errorMsg,
} = require("../util/functions")
const { createCanvas, registerFont, loadImage } = require("canvas")
const { formatTag, formatStr, formatRole } = require("../util/formatting")
registerFont("./src/static/fonts/Supercell-Magic.ttf", {
  family: "Supercell-Magic",
})

module.exports = {
  data: {
    name: "player",
    description: "View player stats.",
    options: [
      {
        type: 3,
        name: "tag",
        description: "#PLAYERTAG",
        required: false,
      },
      {
        type: 6,
        name: "user",
        description: "User to view.",
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
    const ladderEmoji = getEmoji(getArenaEmoji(player.trophies))
    const pbEmoji = getEmoji(getArenaEmoji(player.bestTrophies))
    const level14 = getEmoji("level14")
    const level13 = getEmoji(`level13`)
    const level12 = getEmoji(`level12`)
    const level11 = getEmoji(`level11`)

    const ccWins =
      player.badges.find((b) => b.name === "Classic12Wins")?.progress || 0
    const gcWins =
      player.badges.find((b) => b.name === "Grand12Wins")?.progress || 0
    const cw2Wins =
      player.badges.find((b) => b.name === "ClanWarWins")?.progress || 0
    const lvl14Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 0
    ).length
    const lvl13Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 1
    ).length
    const lvl12Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 2
    ).length
    const lvl11Cards = player.cards.filter(
      (c) => c.maxLevel - c.level === 3
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
    }\n\n`
    embed.description += `**__Stats__**\n**CW1 Wins**: ${player.warDayWins}\n**CW2 Wins**: ${cw2Wins}\n**Most Chall. Wins**: ${player.challengeMaxWins}\n**CC Wins**: ${ccWins}\n**GC Wins**: ${gcWins}\n\n` //stats
    embed.description += `**__Cards__**\n${level14}: ${lvl14Cards}\n${level13}: ${lvl13Cards}\n${level12}: ${lvl12Cards}\n${level11}: ${lvl11Cards}` //cards

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
