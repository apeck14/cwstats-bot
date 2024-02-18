const { getClan, getRiverRace } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { errorMsg, getClanBadge } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    description: "Ping all linked players with attacks remaining.",
    description_localizations: {
      de: "Benachrichtigen Sie alle verknüpften Spieler mit verbleibenden Angriffen.",
      "es-ES": "Notificar a todos los jugadores vinculados con ataques restantes.",
      fr: "Notifiez tous les joueurs liés ayant des attaques restantes.",
      it: "Notificare tutti i giocatori collegati con attacchi rimanenti.",
      nl: "Informeer alle gekoppelde spelers met resterende aanvallen.",
      tr: "Kalan saldırıları olan tüm bağlantılı oyuncuları bilgilendirin.",
    },
    name: "nudge",
    name_localizations: {
      de: "anstupsen",
      "es-ES": "dar-un-toque",
      fr: "envoyer-notification",
      it: "avvisa",
      nl: "porren",
      tr: "dürt",
    },
    options: [
      {
        description: "Clan tag (#ABC123) or abbreviation",
        description_localizations: {
          de: "Clan-Tag (#ABC123) oder Abkürzung",
          "es-ES": "Etiqueta del clan (#ABC123) o abreviatura",
          fr: "Tag du clan (#ABC123) ou abréviation",
          it: "Tag del clan (#ABC123) o abbreviazione",
          nl: "Clan tag (#ABC123) of afkorting",
          tr: "Klan etiketi (#ABC123) veya kısaltma",
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
    ],
  },
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")
    const { abbreviations, defaultClan, nudges } = await guilds.findOne({
      guildID: i.guildId,
    })
    const { ignoreLeaders, links, message } = nudges || {}

    let tag = i.options.getString("tag")

    // default clan
    if (!tag) {
      if (defaultClan?.tag) tag = defaultClan?.tag
      else
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: `**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me/servers/${i.guildId}).`,
            },
          ],
        })
    } else {
      // abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)

      if (abbr) tag = abbr.tag
      else if (tag.length < 5) {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: "**Abbreviation does not exist.**",
            },
          ],
        })
      }
    }

    const { data: race, error: raceError } = await getRiverRace(tag)

    if (raceError) return errorMsg(i, raceError)

    if (race.state === "matchmaking") {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: ":mag: **Matchmaking is underway!**",
          },
        ],
      })
    }
    if (!race.clans || race.clans.length <= 1) {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**Clan is not in a river race.**",
          },
        ],
      })
    }
    if (race.periodType === "training") {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**Cannot send nudges on training days!**",
          },
        ],
      })
    }

    const { data: clan, error: clanError } = await getClan(tag)

    if (clanError) return errorMsg(i, clanError)

    const alphabetizedParticipants = race.clan.participants.sort((a, b) => a.name.localeCompare(b.name))

    const fourAttacks = []
    const threeAttacks = []
    const twoAttacks = []
    const oneAttack = []

    let nudgeMessage = ""
    let slotsUsed = 0

    for (const p of alphabetizedParticipants) {
      const inClan = clan.memberList.find((m) => m.tag === p.tag)

      const isLeader = inClan?.role === "coLeader" || inClan?.role === "leader"
      const linkedAccount = links?.find((l) => l.tag === p.tag)

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

    const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    const badgeEmoji = client.cwEmojis.get(badgeName)
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")

    const totalAttacksLeft = 200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)
    const slotsRemaining = 50 - race.clan.participants.filter((p) => p.decksUsedToday > 0).length

    const embed = {
      color: pink,
      description: `${badgeEmoji} **${formatStr(
        clan.name,
      )}**\n${decksRemainingEmoji} **${totalAttacksLeft}**\n${slotsRemainingEmoji} **${slotsRemaining}**\n\n${
        message || defaultMessage
      }`,
      title: "__Attacks Reminder__",
    }

    await i.editReply({ embeds: [embed] })

    try {
      await i.channel.send(nudgeMessage)
    } catch (e) {
      const msg =
        e?.code === 50001
          ? ":x: Missing permissions to send nudge message in this channel."
          : ":x: Unknown error while sending nudges, please try again."
      i.editReply({
        embeds: [{ ...embed, description: (embed.description += `\n\n**${msg}**`) }],
      })
    }
  },
}
