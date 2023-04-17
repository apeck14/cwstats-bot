const { getRiverRace, getClan } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getClanBadge, getEmoji, errorMsg } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "attacks",
    description: "View remaining attacks.",
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

    const { data: race, error: raceError } = await getRiverRace(tag)

    if (raceError) return errorMsg(i, raceError)

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
    if (!race.clans || race.clans.length <= 1) {
      return i.editReply({
        embeds: [
          {
            description: "**Clan is not in a river race.**",
            color: orange,
          },
        ],
      })
    }

    const { data: clan, error: clanError } = await getClan(tag)

    if (clanError) return errorMsg(i, clanError)

    const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

    const isColosseum = race.periodType === "colosseum"
    const fame = isColosseum ? race.clan.fame : race.clan.periodPoints
    const totalAttacksLeft =
      200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)

    const { participants } = race.clan
    const { memberList, badgeId, clanWarTrophies, name } = clan

    const fourAttacks = []
    const threeAttacks = []
    const twoAttacks = []
    const oneAttack = []

    let showFooter = false

    for (const p of participants) {
      //push all players to appropiate array
      const inClan = memberList.find((m) => m.tag === p.tag)

      if (p.decksUsedToday === 0 && inClan) fourAttacks.push(p)
      else if (p.decksUsedToday === 1) {
        if (!inClan) {
          p.name += "*"
          showFooter = true
        }
        threeAttacks.push(p)
      } else if (p.decksUsedToday === 2) {
        if (!inClan) {
          p.name += "*"
          showFooter = true
        }
        twoAttacks.push(p)
      } else if (p.decksUsedToday === 3) {
        if (!inClan) {
          p.name += "*"
          showFooter = true
        }
        oneAttack.push(p)
      }
    }

    fourAttacks.sort((a, b) => a.name.localeCompare(b.name))
    threeAttacks.sort((a, b) => a.name.localeCompare(b.name))
    twoAttacks.sort((a, b) => a.name.localeCompare(b.name))
    oneAttack.sort((a, b) => a.name.localeCompare(b.name))

    const embed = {
      color: pink,
      title: `**__Remaining Attacks__**`,
      description: "",
      author: {
        name: `Week ${race.sectionIndex + 1} | ${
          dayOfWeek < 3 ? "Training" : "War"
        } Day ${dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2}`,
      },
      footer: {
        text: showFooter ? `* = Not in clan` : ``,
      },
    }

    const badgeName = getClanBadge(badgeId, clanWarTrophies)
    const badgeEmoji = getEmoji(badgeName)
    const fameEmoji = getEmoji("fame")
    const decksRemainingEmoji = getEmoji("decksRemaining")
    const slotsRemainingEmoji = getEmoji("remainingSlots")
    const slotsRemaining =
      50 - participants.filter((p) => p.decksUsedToday > 0).length

    embed.description += `${badgeEmoji} **${formatStr(
      name
    )}**\n${fameEmoji} **${fame}**\n${decksRemainingEmoji} **${totalAttacksLeft}**\n${slotsRemainingEmoji} **${slotsRemaining}**\n`

    if (fourAttacks.length > 0) {
      embed.description += `\n**__4 Attacks__**\n`
      embed.description += fourAttacks
        .map((p) => `• ${formatStr(p.name)}\n`)
        .join("")
    }
    if (threeAttacks.length > 0) {
      embed.description += `\n**__3 Attacks__**\n`
      embed.description += threeAttacks
        .map((p) => `• ${formatStr(p.name)}\n`)
        .join("")
    }
    if (twoAttacks.length > 0) {
      embed.description += `\n**__2 Attacks__**\n`
      embed.description += twoAttacks
        .map((p) => `• ${formatStr(p.name)}\n`)
        .join("")
    }
    if (oneAttack.length > 0) {
      embed.description += `\n**__1 Attack__**\n`
      embed.description += oneAttack
        .map((p) => `• ${formatStr(p.name)}\n`)
        .join("")
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
