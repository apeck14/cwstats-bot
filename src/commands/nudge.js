const { getRiverRace, getClan } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getClanBadge, errorMsg } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "nudge",
    name_localizations: {
      de: "anstupsen",
      fr: "envoyer-notification",
      "es-ES": "dar-un-toque",
      tr: "dürt",
      it: "avvisa",
      nl: "porren",
    },
    description: "Ping all linked players with attacks remaining.",
    description_localizations: {
      de: "Benachrichtigen Sie alle verknüpften Spieler mit verbleibenden Angriffen.",
      fr: "Notifiez tous les joueurs liés ayant des attaques restantes.",
      "es-ES":
        "Notificar a todos los jugadores vinculados con ataques restantes.",
      tr: "Kalan saldırıları olan tüm bağlantılı oyuncuları bilgilendirin.",
      it: "Notificare tutti i giocatori collegati con attacchi rimanenti.",
      nl: "Informeer alle gekoppelde spelers met resterende aanvallen.",
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
        description: "Clan tag (#ABC123) or abbreviation",
        description_localizations: {
          de: "Clan-Tag (#ABC123) oder Abkürzung",
          fr: "Tag du clan (#ABC123) ou abréviation",
          "es-ES": "Etiqueta del clan (#ABC123) o abreviatura",
          tr: "Klan etiketi (#ABC123) veya kısaltma",
          it: "Tag del clan (#ABC123) o abbreviazione",
          nl: "Clan tag (#ABC123) of afkorting",
        },
        required: false,
      },
    ],
  },
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")
    const { abbreviations, defaultClan, nudges } = await guilds.findOne({
      guildID: i.guildId,
    })
    const { message, links, ignoreLeaders } = nudges || {}

    let tag = i.options.getString("tag")

    //default clan
    if (!tag) {
      if (defaultClan?.tag) tag = defaultClan?.tag
      else
        return i.editReply({
          embeds: [
            {
              description:
                "**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me).",
              color: orange,
            },
          ],
        })
    } else {
      //abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = abbreviations?.find(
        (a) => a.abbr.toUpperCase() === UPPERCASE_ABBR
      )

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
    if (race.periodType === "training") {
      return i.editReply({
        embeds: [
          {
            description: "**Cannot send nudges on training days!**",
            color: orange,
          },
        ],
      })
    }

    const { data: clan, error: clanError } = await getClan(tag)

    if (clanError) return errorMsg(i, clanError)

    const alphabetizedParticipants = race.clan.participants.sort((a, b) =>
      a.name.localeCompare(b.name)
    )

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
        } else
          fourAttacks.push(
            linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`
          )
      } else if (p.decksUsedToday === 1) {
        if (ignoreLeaders && isLeader) {
          threeAttacks.push(`- ${p.name}`)
        } else
          threeAttacks.push(
            linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`
          )
        slotsUsed++
      } else if (p.decksUsedToday === 2) {
        if (ignoreLeaders && isLeader) {
          twoAttacks.push(`- ${p.name}`)
        } else
          twoAttacks.push(
            linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`
          )
        slotsUsed++
      } else if (p.decksUsedToday === 3) {
        if (ignoreLeaders && isLeader) {
          oneAttack.push(`- ${p.name}`)
        } else
          oneAttack.push(
            linkedAccount ? `- <@${linkedAccount.discordID}>` : `- ${p.name}`
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

    const badgeName = getClanBadge(clan.badgeId, clan.clanWarTrophies)
    const badgeEmoji = client.cwEmojis.get(badgeName)
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")

    const totalAttacksLeft =
      200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)
    const slotsRemaining =
      50 - race.clan.participants.filter((p) => p.decksUsedToday > 0).length

    const embed = {
      title: "__Attacks Reminder__",
      color: pink,
      description: `${badgeEmoji} **${formatStr(
        clan.name
      )}**\n${decksRemainingEmoji} **${totalAttacksLeft}**\n${slotsRemainingEmoji} **${slotsRemaining}**\n\n${
        message || defaultMessage
      }`,
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
        embeds: [
          { ...embed, description: (embed.description += `\n\n**${msg}**`) },
        ],
      })
    }
  },
}
