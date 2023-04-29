const { PermissionFlagsBits, AttachmentBuilder } = require("discord.js")
const { pink, red } = require("../static/colors")
const { getRiverRace, getClan } = require("../util/api")
const { formatStr } = require("../util/formatting")
const { getClanBadge, getEmoji } = require("../util/functions")
const { getAvgFame } = require("../util/raceFunctions")

module.exports = {
  expression: "* * * * 5,6,7,1", //every min Fri - Mon
  run: async (client, db) => {
    const guilds = db.collection("Guilds")

    const now = new Date()
    const currentHH =
      now.getUTCHours() < 10 ? `0${now.getUTCHours()}` : now.getUTCHours()
    const currentMM =
      now.getUTCMinutes() < 10 ? `0${now.getUTCMinutes()}` : now.getUTCMinutes()

    const guildsToSendReport = await guilds
      .find({
        "warReport.enabled": true,
        "warReport.scheduledReportTimeHHMM": `${currentHH}:${currentMM}`,
      })
      .toArray()

    const guildsPromises = guildsToSendReport.map((g) =>
      getRiverRace(g.warReport.clanTag)
    )
    const guildsRaceData = await Promise.all(guildsPromises)

    const guildsClanPromises = guildsToSendReport.map((g) =>
      getClan(g.warReport.clanTag)
    )
    const guildsClanData = await Promise.all(guildsClanPromises)

    for (const g of guildsToSendReport) {
      try {
        const { channels } = g
        const { reportChannelID } = channels

        const reportChannel = client.channels.cache.get(reportChannelID)

        if (!reportChannel) continue

        const reportChannelPermissions = reportChannel?.permissionsFor(
          client.user
        )
        const requiredFlags = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.UseExternalEmojis,
          PermissionFlagsBits.AttachFiles,
        ]

        if (!reportChannelPermissions.has(requiredFlags)) continue

        const raceRes = guildsRaceData.find(
          (res) => res.data?.clan?.tag === g.warReport.clanTag
        )
        const { data: race, error } = raceRes || {}

        const clanRes = guildsClanData.find(
          (res) => res.data?.tag === g.warReport.clanTag
        )
        const { data: clan, error: clanError } = clanRes || {}

        const thumbnail = {
          url: "https://i.imgur.com/VAPR8Jq.png",
        }

        const title = "__Daily War Report__"

        if (error || !race || clanError || !clan) {
          const errMsg =
            error?.error || clanError?.error || "**Unexpected error.**"
          const description = errMsg.slice(0, errMsg.lastIndexOf("*") + 1)

          reportChannel.send({
            embeds: [
              {
                color: red,
                title,
                thumbnail,
                description,
              },
            ],
          })

          continue
        }

        if (race.periodType === "training") {
          reportChannel.send({
            embeds: [
              {
                color: red,
                description: "**Cannot send war report on training days!**",
                title,
                thumbnail,
              },
            ],
          })
          continue
        }

        const isColosseum = race.periodType === "colosseum"
        const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

        const embed = {
          title,
          thumbnail,
          color: pink,
          author: {
            name: `Week ${race.sectionIndex + 1} Day ${
              dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2
            }`,
          },
          description: "",
        }

        const badgeName = getClanBadge(race.clan.badgeId, race.clan.clanScore)
        const badgeEmoji = getEmoji(badgeName)
        const fameEmoji = getEmoji("fame")
        const fameAvgEmoji = getEmoji("fameAvg")
        const decksRemainingEmoji = getEmoji("decksRemaining")

        const fameAccessor = isColosseum ? "fame" : "periodPoints"
        const decksRemaining =
          200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)

        embed.description += `${badgeEmoji} **${formatStr(race.clan.name)}**`
        embed.description += `\n${fameEmoji} ${race.clan[fameAccessor]}`
        embed.description += `\n${fameAvgEmoji} ${getAvgFame(
          race.clan,
          isColosseum,
          dayOfWeek
        ).toFixed(2)}`
        embed.description += `\n${decksRemainingEmoji} ${decksRemaining}\n`

        //remaining attacks
        const inClan = (p) => clan.memberList.find((m) => m.tag === p.tag)
        const inClanOrHasFame = (p) => {
          return inClan(p) || p.fame > 0
        }

        const alphabetizedParticipants = race.clan.participants.sort((a, b) => {
          if (b.fame === a.fame) return a.name.localeCompare(b.name)

          return b.fame - a.fame
        })

        const fourAttacks = []
        const threeAttacks = []
        const twoAttacks = []
        const oneAttack = []

        let showFooter = false

        for (const p of alphabetizedParticipants) {
          const inClan = clan.memberList.find((m) => m.tag === p.tag)

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

        if (fourAttacks.length > 0) {
          embed.description += `\n**__4 Attacks__**\n`

          for (const p of fourAttacks)
            embed.description += `• ${formatStr(p.name)}\n`
        }
        if (threeAttacks.length > 0) {
          embed.description += `\n**__3 Attacks__**\n`
          for (const p of threeAttacks)
            embed.description += `• ${formatStr(p.name)}\n`
        }
        if (twoAttacks.length > 0) {
          embed.description += `\n**__2 Attacks__**\n`
          for (const p of twoAttacks)
            embed.description += `• ${formatStr(p.name)}\n`
        }
        if (oneAttack.length > 0) {
          embed.description += `\n**__1 Attack__**\n`
          for (const p of oneAttack)
            embed.description += `• ${formatStr(p.name)}\n`
        }

        let reportStr = ""

        for (const p of alphabetizedParticipants.filter(inClanOrHasFame))
          reportStr += `${p.fame} (${p.decksUsed}) - ${p.name} (${p.tag})\n`

        const txtReport = new AttachmentBuilder(
          Buffer.from(reportStr, "utf-8"),
          {
            name: `${now.getUTCFullYear()}-${
              now.getUTCMonth() + 1
            }-${now.getUTCDate()}-${clan.tag}.txt`,
          }
        )

        if (showFooter) {
          embed.footer = {
            text: "* = Not in clan",
          }

          reportStr += "\n\n* = Not in clan"
        }

        await reportChannel.send({
          embeds: [embed],
        })

        reportChannel.send({
          files: [txtReport],
        })
      } catch (err) {
        console.log(err)
        console.log(g?.guildID)
      }
    }
  },
}
