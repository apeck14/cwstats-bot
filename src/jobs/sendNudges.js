const { hyperlink, PermissionFlagsBits } = require("discord.js")
const { getClan, getRiverRace } = require("../util/api")
const { getClanBadge } = require("../util/functions")
const { formatStr } = require("../util/formatting")
const { red } = require("../static/colors")

module.exports = {
  expression: "*/15 * * * 4,5,6,7,1", // every 15 mins Thurs-Mon
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

    console.log(hourQuery, guildsToSendNudge.length)

    const nudges = []

    // add all nudges in correct format
    for (const g of guildsToSendNudge) {
      const scheduledNudges = g.nudges.scheduled
        .filter((n) => n.scheduledHourUTC === hourQuery)
        .map((n) => ({
          ...n,
          guildID: g.guildID,
          ignoreLeaders: g.nudges?.ignoreLeaders || false,
          message: g.nudges?.message || "",
        }))

      nudges.push(...scheduledNudges)
    }

    for (const n of nudges) {
      try {
        const { channelID, clanTag, guildID, ignoreLeaders, message } = n

        const [{ data: clan, error: clanError }, { data: race, error: raceError }] = await Promise.all([
          getClan(n.clanTag),
          getRiverRace(n.clanTag),
        ])

        if (race?.periodType === "training") continue

        const nudgeChannel = client.channels.cache.get(channelID)

        if (!nudgeChannel) {
          // delete scheduled nudge
          console.log(`Nudge Channel Not Found: ${clanTag} ${guildID} ${channelID} (Deleting...)`)
          guilds.updateOne(
            {
              guildID,
            },
            {
              $pull: {
                "nudges.scheduled": {
                  $elemMatch: {
                    clanTag,
                    scheduledHourUTC: hourQuery,
                  },
                },
              },
            },
          )

          continue
        }

        if (clanError || raceError || !clan || !race) {
          const errMsg = !race
            ? `**River race not found. Scheduled nudge ignored.**`
            : `**Unexpected error while attempting to send scheduled nudge.** If this issue continues, please join the ${hyperlink(
                "Support Server",
                "https://discord.com/invite/fFY3cnMmnH",
              )}.`

          console.log(`Scheduled nudge error: ${clanTag}`)
          console.log(clanError || raceError)

          nudgeChannel.send({ embeds: [{ color: red, description: errMsg }] })

          continue
        }

        const nudgeChannelPermissions = nudgeChannel?.permissionsFor(client.user)

        const requiredFlags = [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.UseExternalEmojis,
        ]

        if (!nudgeChannelPermissions.has(requiredFlags)) {
          console.log(`Missing permissions: ${guildID} ${channelID}`)
          continue
        }

        let nudgeMessage = "## __Scheduled nudge!__\n"

        const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
        const badgeEmoji = client.cwEmojis.get(badgeName)

        nudgeMessage += `${badgeEmoji} **${formatStr(clan.name)}**`

        const alphabetizedParticipants = race.clan.participants.sort((a, b) => a.name.localeCompare(b.name))

        const fourAttacks = []
        const threeAttacks = []
        const twoAttacks = []
        const oneAttack = []

        const guild = guildsToSendNudge.find((g) => g.guildID === guildID)

        let slotsUsed = 0

        for (const p of alphabetizedParticipants) {
          const inClan = clan.memberList.find((m) => m.tag === p.tag)
          const isLeader = inClan?.role === "coLeader" || inClan?.role === "leader"
          const linkedAccount = guild.nudges?.links?.find((l) => l.tag === p.tag)

          if (p.decksUsedToday === 0 && inClan) {
            if (ignoreLeaders && isLeader) {
              fourAttacks.push(`- ${p.name}`)
            } else fourAttacks.push(linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`)
          } else if (p.decksUsedToday === 1) {
            if (ignoreLeaders && isLeader) {
              threeAttacks.push(`- ${p.name}`)
            } else threeAttacks.push(linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`)
            slotsUsed++
          } else if (p.decksUsedToday === 2) {
            if (ignoreLeaders && isLeader) {
              twoAttacks.push(`- ${p.name}`)
            } else twoAttacks.push(linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`)
            slotsUsed++
          } else if (p.decksUsedToday === 3) {
            if (ignoreLeaders && isLeader) {
              oneAttack.push(`- ${p.name}`)
            } else oneAttack.push(linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`)
            slotsUsed++
          }
        }

        if (fourAttacks.length > 0) {
          nudgeMessage += `\n\n**__4 Attacks__**\n`

          if (slotsUsed >= 50) nudgeMessage += `No slots remaining! Ignoring ${fourAttacks.length} player(s).`
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

        const defaultMessage = "**You have attacks remaining.** Please get them in before the deadline!"

        nudgeMessage += "\n\n"
        nudgeMessage += message || defaultMessage

        await nudgeChannel.send(nudgeMessage)
      } catch (err) {
        console.log(err?.message)
        console.log(n?.guildID)
      }
    }
  },
}
