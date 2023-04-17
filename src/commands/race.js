const { getRiverRace } = require("../util/api")
const { orange, pink } = require("../static/colors")
const {
  getRacePlacements,
  getAvgFame,
  getProjFame,
} = require("../util/raceFunctions")
const { getClanBadge, getEmoji, errorMsg } = require("../util/functions")
const { formatStr, formatTag } = require("../util/formatting")

module.exports = {
  data: {
    name: "race",
    description: "View river race stats & projections.",
    options: [
      {
        type: 3,
        name: "tag",
        description: "#CLANTAG or abbreviation",
        required: true,
      },
    ],
  },
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")
    const { abbreviations } = await guilds.findOne({
      guildID: i.guildId,
    })

    let tag = i.options.getString("tag")
    const abbr = abbreviations?.find((a) => a.abbr === tag)

    if (abbr) tag = abbr.tag
    else if (tag.length < 5) {
      return i.editReply({
        embeds: [
          {
            description: "**Abbreviation does not exist.**",
            color: orange,
          },
        ],
      })
    }

    const { data: race, error } = await getRiverRace(tag)

    if (error) return errorMsg(i, error)

    if (race.state === "matchmaking") {
      return i.editReply({
        embeds: [
          {
            description: ":mag: **Matchmaking is underway!**",
            color: orange,
          },
        ],
      })
    }
    if (!race.clans || !race.clans.length) {
      return i.editReply({
        embeds: [
          {
            description: "**Clan is not in a river race.**",
            color: orange,
          },
        ],
      })
    }

    const isColosseum = race.periodType === "colosseum"
    const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

    const embed = {
      color: pink,
      title: isColosseum ? `**__Colosseum__**` : `**__River Race__**`,
      description: "",
      thumbnail: {
        url: "https://i.imgur.com/VAPR8Jq.png",
      },
      footer: {
        text: isColosseum ? "Missed attacks negatively affect fame/atk" : "",
      },
      author: {
        name: `Week ${race.sectionIndex + 1} | ${
          dayOfWeek < 3 ? "Training" : "War"
        } Day ${dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2}`,
      },
      url: `https://www.cwstats.com/clan/${race.clan.tag.substring(1)}/race`,
    }

    const placements = getRacePlacements(race.clans, isColosseum)
    const clansStillWarring = placements.filter((c) => !c.crossedFinishLine)
    const clansCrossedFinishLine = placements.filter((c) => c.crossedFinishLine)

    const fameEmoji = getEmoji("fame")
    const fameAvgEmoji = getEmoji("fameAvg")
    const decksRemainingEmoji = getEmoji("decksRemaining")
    const projectionEmoji = getEmoji("projection")

    clansCrossedFinishLine.forEach((c) => {
      const clan = race.clans.find((cl) => cl.tag === c.tag)
      const { name, badgeId, clanScore } = clan

      const badgeName = getClanBadge(badgeId, clanScore)
      const badgeEmoji = getEmoji(badgeName)

      if (c.tag === formatTag(tag))
        embed.description += `${badgeEmoji} **__${formatStr(name)}__**\n`
      else embed.description += `${badgeEmoji} **${formatStr(name)}**\n`
    })

    for (const c of clansStillWarring) {
      embed.description +=
        c.placement === Infinity ? "\n" : `\n**${c.placement}.**`

      const clan = race.clans.find((cl) => cl.tag === c.tag)
      const { name, badgeId, clanScore, participants } = clan

      const decksRemaining =
        200 - participants.reduce((a, b) => a + b.decksUsedToday, 0)

      const badgeName = getClanBadge(badgeId, clanScore)
      const badgeEmoji = getEmoji(badgeName)

      if (c.tag === formatTag(tag))
        embed.description += `${badgeEmoji} **__${formatStr(name)}__**\n`
      else embed.description += `${badgeEmoji} **${formatStr(name)}**\n`

      embed.description += `${fameEmoji} ${
        c.fame
      }\n${projectionEmoji} ${getProjFame(
        clan,
        isColosseum,
        dayOfWeek
      )}\n${decksRemainingEmoji} ${decksRemaining}\n${fameAvgEmoji} **${getAvgFame(
        clan,
        isColosseum,
        dayOfWeek
      ).toFixed(2)}**\n`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
