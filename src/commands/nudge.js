const { getClan, getGuild, getRace } = require("../util/services")
const { errorMsg, warningMsg } = require("../util/functions")
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
      "pt-BR": "Notificar todos os jogadores vinculados com ataques restantes.",
      "pt-PT": "Notificar todos os jogadores vinculados com ataques restantes.",
      tr: "Kalan saldırıları olan tüm bağlantılı oyuncuları bilgilendirin.",
    },
    name: "nudge",
    name_localizations: {
      de: "anstupsen",
      "es-ES": "dar-un-toque",
      fr: "envoyer-notification",
      it: "avvisa",
      nl: "porren",
      "pt-BR": "cutucar",
      "pt-PT": "cutucar",
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
          "pt-BR": "Tag do clã (#ABC123) ou abreviação",
          "pt-PT": "Tag do clã (#ABC123) ou abreviação",
          tr: "Klan etiketi (#ABC123) veya kısaltma",
        },
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          "es-ES": "etiqueta",
          fr: "balise",
          it: "tag",
          nl: "tag",
          "pt-BR": "tag",
          "pt-PT": "tag",
          tr: "etiket",
        },
        required: false,
        type: 3,
      },
    ],
  },
  run: async (i, client) => {
    const { data: guild, error } = await getGuild(i.guildId)

    if (error) return errorMsg(i, error)

    const { abbreviations, defaultClan, nudges } = guild
    const { ignoreLeaders, links, message } = nudges || {}

    let tag = i.options.getString("tag")

    // default clan
    if (!tag) {
      if (defaultClan?.tag) tag = defaultClan?.tag
      else
        return warningMsg(
          i,
          `**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me/servers/${i.guildId}).`,
        )
    } else {
      // abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)

      if (abbr) tag = abbr.tag
      else if (tag.length < 3) return warningMsg(i, "**Abbreviation does not exist.**")
    }

    const [{ data: race, error: raceError }, { data: clan, error: clanError }] = await Promise.all([
      getRace(tag, true),
      getClan(tag),
    ])

    if (raceError || clanError) return errorMsg(i, raceError || clanError)

    const { clanIndex, clans, isTraining, state } = race
    const { participants } = clans[clanIndex]
    const { badge, memberList } = clan

    if (state === "matchmaking") return warningMsg(i, ":mag: **Matchmaking is underway!**")
    if (!clans || clans.length <= 1) return warningMsg(i, "**Clan is not in a river race.**")
    if (isTraining) return warningMsg(i, "**Cannot send nudges on training days!**")

    const linkedDiscordIDs = new Map()
    const alphabetizedParticipants = participants
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => {
        const { discordID } = links?.find((l) => l.tag === p.tag) || {}

        if (discordID) {
          p.discordID = discordID
          linkedDiscordIDs.set(discordID, (linkedDiscordIDs.get(discordID) || 0) + 1)
        }

        return p
      })

    let slotsRemaining = 50
    let attacksRemaining = 200

    const attackGroups = {
      1: [],
      2: [],
      3: [],
      4: [],
    }

    for (const p of alphabetizedParticipants) {
      const used = p.decksUsedToday ?? 0

      if (used) {
        slotsRemaining--
        attacksRemaining -= used
      }

      const inClan = memberList.find((m) => m.tag === p.tag)
      const isLeader = inClan?.role === "coLeader" || inClan?.role === "leader"

      const displayName = p.discordID
        ? `- <@${p.discordID}>${linkedDiscordIDs.get(p.discordID) > 1 ? ` (${p.name})` : ""}`
        : `- ${p.name}`

      const remainingAttacks = 4 - used
      if (attackGroups[remainingAttacks] && inClan) {
        attackGroups[remainingAttacks].push(ignoreLeaders && isLeader ? `- ${p.name}` : displayName)
      }
    }

    const badgeEmoji = client.cwEmojis.get(badge)
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")

    let nudgeMessage = `\u202A${badgeEmoji} **${formatStr(
      clan.name,
    )}**\n${decksRemainingEmoji} **${attacksRemaining}**\n${slotsRemainingEmoji} **${slotsRemaining}**`

    const labels = {
      1: "1 Attack",
      2: "2 Attacks",
      3: "3 Attacks",
      4: "4 Attacks",
    }

    for (const key of Object.keys(labels).reverse()) {
      const group = attackGroups[key]
      if (group.length > 0) {
        nudgeMessage += `\n\n**__${labels[key]}__**\n`
        if (key === 4 && slotsRemaining <= 0) {
          nudgeMessage += `No slots remaining! Ignoring **${group.length}** player(s).`
        } else {
          nudgeMessage += group.join("\n")
        }
      }
    }

    nudgeMessage += `\n\n${message || "**You have attacks remaining.** Please get them in before the deadline!"}`

    i.editReply(nudgeMessage)
  },
}
