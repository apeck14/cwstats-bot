const { getClan, getGuild, getRace } = require("../util/services")
const { pink } = require("../static/colors")
const { errorMsg, warningMsg } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    description: "View players with remaining attacks.",
    description_localizations: {
      de: "Spieler mit verbleibenden Angriffen anzeigen.",
      "es-ES": "Ver jugadores con ataques restantes.",
      fr: "Afficher les joueurs ayant encore des attaques.",
      it: "Visualizza i giocatori con attacchi rimanenti.",
      nl: "Bekijk spelers met resterende aanvallen.",
      tr: "Kalan saldırıları olan oyuncuları görüntüleyin.",
    },
    name: "attacks",
    name_localizations: {
      de: "angriffe",
      "es-ES": "ataques",
      fr: "attaques",
      it: "attacchi",
      nl: "aanvallen",
      tr: "saldırılar",
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
  run: async (i, client) => {
    const { data: guild, error: guildError } = await getGuild(i.guildId, true)

    if (guildError) return errorMsg(i, guildError)

    const { abbreviations, defaultClan } = guild

    let iTag = i.options.getString("tag")

    // default clan
    if (!iTag) {
      if (defaultClan?.tag) iTag = defaultClan.tag
      else
        return warningMsg(
          i,
          `**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me/servers/${i.guildId}).`,
        )
    } else {
      // abbreviation
      const UPPERCASE_ABBR = iTag.toUpperCase()
      const abbr = abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)

      if (abbr) iTag = abbr.tag
      else if (iTag.length < 3) return warningMsg(i, "**Abbreviation does not exist.**")
    }

    const [{ data: race, error: raceError }, { data: clan, error: clanError }] = await Promise.all([
      getRace(iTag),
      getClan(iTag),
    ])

    if (raceError || clanError) return errorMsg(i, raceError || clanError)
    if (race.state === "matchmaking") return warningMsg(i, ":mag: **Matchmaking is underway!**")
    if (!race.clans || race.clans.length <= 1) return warningMsg(i, "**Clan is not in a river race.**")

    const { memberList } = clan
    const { clanIndex, dayIndex, isTraining, sectionIndex } = race
    const { badge, decksUsed, fame, name, participants, slotsUsed, tag } = race.clans[clanIndex]

    const decksRemaining = 200 - decksUsed
    const slotsRemaining = 50 - slotsUsed
    const week = sectionIndex + 1
    const dayType = isTraining ? "Training" : "War"
    const dayNum = isTraining ? dayIndex + 1 : dayIndex - 2

    const memberTagSet = new Set(memberList.map((m) => m.tag))
    let showFooter = false

    // [4, 3, 2, 1]
    const attackBuckets = [[], [], [], []]

    // add all players to appropriate array
    for (const p of participants) {
      const inClan = memberTagSet.has(p.tag)
      const decksRemaining = 4 - p.decksUsedToday

      if (decksRemaining >= 4 && inClan) {
        attackBuckets[0].push(p)
      } else if (decksRemaining > 0 && decksRemaining < 4) {
        if (!inClan) {
          p.name += "*"
          showFooter = true
        }
        attackBuckets[4 - decksRemaining].push(p)
      }
    }

    // sort all buckets
    for (const bucket of attackBuckets) {
      bucket.sort((a, b) => a.name.localeCompare(b.name))
    }

    const embed = {
      author: {
        name: `Week ${week} | ${dayType} Day ${dayNum}`,
      },
      color: pink,
      description: "",
      footer: {
        text: showFooter ? `* = Not in clan` : ``,
      },
      title: `**__Remaining Attacks__**`,
      url: `https://cwstats.com/clan/${tag.substring(1)}/race`,
    }

    const badgeEmoji = client.cwEmojis.get(badge)
    const fameEmoji = client.cwEmojis.get("fame")
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")

    embed.description += `${badgeEmoji} **${formatStr(
      name,
    )}**\n${fameEmoji} **${fame}**\n${decksRemainingEmoji} **${decksRemaining}**\n${slotsRemainingEmoji} **${slotsRemaining}**\n`

    const labels = ["4 Attacks", "3 Attacks", "2 Attacks", "1 Attack"]

    for (let i = 0; i < attackBuckets.length; i++) {
      const group = attackBuckets[i]

      if (group.length > 0) {
        embed.description += `\n**__${labels[i]}__** (${group.length})\n`
        embed.description += group.map((p) => `• ${formatStr(p.name)}\n`).join("")
      }
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
