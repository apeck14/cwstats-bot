const { PermissionFlagsBits } = require("discord.js")
const { getRiverRace, getClan } = require("../util/api")
const { getClanBadge, getEmoji } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  expression: "*/15 * * * 4,5,6,7,1", //every 15 mins Thurs-Mon
  run: async (client, db) => {
    const guilds = db.collection("Guilds")

    const now = new Date()
    const hourUTC = now.getUTCHours()
    const decimal = () => {
      const minuteUTC = now.getUTCMinutes()

      if (minuteUTC < 15) return 0
      if (minuteUTC < 30) return 0.25
      if (minuteUTC < 45) return 0.5
      return 0.75
    }
    const hourQuery = hourUTC + decimal()

    const guildsToSendNudge = await guilds
      .find({
        "nudges.scheduled": {
          $elemMatch: {
            scheduledHourUTC: hourQuery,
          },
        },
      })
      .toArray()

    const nudges = []

    // add all nudges in correct format
    for (const g of guildsToSendNudge) {
      const scheduledNudges = g.nudges.scheduled
        .filter((n) => n.scheduledHourUTC === hourQuery)
        .map((n) => ({
          ...n,
          guildID: g.guildID,
          message: g.nudges?.message || "",
          ignoreLeaders: g.nudges?.ignoreLeaders || false,
        }))

      nudges.push(...scheduledNudges)
    }

    console.log(hourQuery, nudges.length)

    const nudgesRacePromises = nudges.map((n) => getRiverRace(n.clanTag))
    const nudgesRaces = await Promise.all(nudgesRacePromises)

    const nudgesClanPromises = nudges.map((n) => getClan(n.clanTag))
    const nudgesClans = await Promise.all(nudgesClanPromises)

    for (const n of nudges) {
      try {
        const { clanTag, channelID, guildID, message, ignoreLeaders } = n
        const race = nudgesRaces.find(
          (r) => r.data?.clan?.tag === clanTag
        )?.data
        const clan = nudgesClans.find((c) => c.data?.tag === clanTag)?.data

        const nudgeChannel = client.channels.cache.get(channelID)

        if (!nudgeChannel || !race || !clan || race.error || clan.error) {
          console.log(
            `Scheduled nudge error: ${clanTag} / ${channelID} ${clan.error} ${race.error}`
          )
          continue
        }

        if (race.periodType === "training") continue

        const nudgeChannelPermissions = nudgeChannel?.permissionsFor(
          client.user
        )

        const requiredFlags = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.UseExternalEmojis,
        ]

        if (!nudgeChannelPermissions.has(requiredFlags)) {
          console.log(`Missing permissions: ${channelID}`)
          continue
        }

        let nudgeMessage = "## __Scheduled nudge!__\n"

        const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
        const badgeEmoji = getEmoji(badgeName)

        nudgeMessage += `${badgeEmoji} **${formatStr(clan.name)}**`

        const alphabetizedParticipants = race.clan.participants.sort((a, b) =>
          a.name.localeCompare(b.name)
        )

        const fourAttacks = []
        const threeAttacks = []
        const twoAttacks = []
        const oneAttack = []

        const guild = guildsToSendNudge.find((g) => g.guildID === guildID)

        let slotsUsed = 0

        for (const p of alphabetizedParticipants) {
          const inClan = clan.memberList.find((m) => m.tag === p.tag)
          const isLeader =
            inClan?.role === "coLeader" || inClan?.role === "leader"
          const linkedAccount = guild.nudges?.links?.find(
            (l) => l.tag === p.tag
          )

          if (p.decksUsedToday === 0 && inClan) {
            if (ignoreLeaders && isLeader) {
              fourAttacks.push(`- ${p.name}`)
            } else
              fourAttacks.push(
                linkedAccount
                  ? `- <@${linkedAccount.discordID}>`
                  : `- ${p.name}`
              )
          } else if (p.decksUsedToday === 1) {
            if (ignoreLeaders && isLeader) {
              threeAttacks.push(`- ${p.name}`)
            } else
              threeAttacks.push(
                linkedAccount
                  ? `- <@${linkedAccount.discordID}>`
                  : `- ${p.name}`
              )
            slotsUsed++
          } else if (p.decksUsedToday === 2) {
            if (ignoreLeaders && isLeader) {
              twoAttacks.push(`- ${p.name}`)
            } else
              twoAttacks.push(
                linkedAccount
                  ? `- <@${linkedAccount.discordID}>`
                  : `- ${p.name}`
              )
            slotsUsed++
          } else if (p.decksUsedToday === 3) {
            if (ignoreLeaders && isLeader) {
              oneAttack.push(`- ${p.name}`)
            } else
              oneAttack.push(
                linkedAccount
                  ? `- <@${linkedAccount.discordID}>`
                  : `- ${p.name}`
              )
            slotsUsed++
          }
        }

        if (fourAttacks.length > 0) {
          nudgeMessage += `\n\n**__4 Attacks__**\n`

          if (slotsUsed >= 50)
            nudgeMessage += `No slots remaining! Ignoring ${fourAttacks.length} player(s).`
          else nudgeMessage += `${fourAttacks.join("\n")}`
        }

        if (threeAttacks.length > 0) {
          nudgeMessage += `\n\n**__3 Attacks__**\n${threeAttacks.join("\n")}`
        }

        if (twoAttacks.length > 0) {
          nudgeMessage += `\n\n**__2 Attacks__**\n${twoAttacks.join("\n")}`
        }

        if (oneAttack.length > 0) {
          nudgeMessage += `\n\n**__1 Attack__**\n${oneAttack.join("\n")}`
        }

        const defaultMessage =
          "**You have attacks remaining.** Please get them in before the deadline!"

        nudgeMessage += "\n\n"
        nudgeMessage += message || defaultMessage

        await nudgeChannel.send(nudgeMessage)
      } catch (err) {
        console.log(err)
        console.log(g?.guildID)
      }
    }
  },
}
