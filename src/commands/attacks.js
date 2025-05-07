const { getClan, getRiverRace } = require("../util/services")
const { orange, pink } = require("../static/colors")
const { errorMsg, getClanBadge } = require("../util/functions")
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
  run: async (i, db, client) => {
    const guilds = db.collection("Guilds")
    const { abbreviations, defaultClan } = await guilds.findOne({
      guildID: i.guildId,
    })

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
      else if (tag.length < 3) {
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

    const { data: clan, error: clanError } = await getClan(tag)

    if (clanError) return errorMsg(i, clanError)

    const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

    const isColosseum = race.periodType === "colosseum"
    const fame = isColosseum ? race.clan.fame : race.clan.periodPoints
    const totalAttacksLeft = 200 - race.clan.participants.reduce((a, b) => a + b.decksUsedToday, 0)

    const { participants } = race.clan
    const { badgeId, clanWarTrophies, memberList, name } = clan

    const fourAttacks = []
    const threeAttacks = []
    const twoAttacks = []
    const oneAttack = []

    let showFooter = false

    for (const p of participants) {
      // push all players to appropiate array
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
      author: {
        name: `Week ${race.sectionIndex + 1} | ${dayOfWeek < 3 ? "Training" : "War"} Day ${
          dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2
        }`,
      },
      color: pink,
      description: "",
      footer: {
        text: showFooter ? `* = Not in clan` : ``,
      },
      title: `**__Remaining Attacks__**`,
      url: `https://cwstats.com/clan/${clan.tag.slice(1)}/race`,
    }

    const badgeName = getClanBadge(badgeId, clanWarTrophies)

    const badgeEmoji = client.cwEmojis.get(badgeName)
    const fameEmoji = client.cwEmojis.get("fame")
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")
    const slotsRemaining = 50 - participants.filter((p) => p.decksUsedToday > 0).length

    embed.description += `${badgeEmoji} **${formatStr(
      name,
    )}**\n${fameEmoji} **${fame}**\n${decksRemainingEmoji} **${totalAttacksLeft}**\n${slotsRemainingEmoji} **${slotsRemaining}**\n`

    if (fourAttacks.length > 0) {
      embed.description += `\n**__4 Attacks__** (${fourAttacks.length})\n`
      embed.description += fourAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")
    }
    if (threeAttacks.length > 0) {
      embed.description += `\n**__3 Attacks__** (${threeAttacks.length})\n`
      embed.description += threeAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")
    }
    if (twoAttacks.length > 0) {
      embed.description += `\n**__2 Attacks__** (${twoAttacks.length})\n`
      embed.description += twoAttacks.map((p) => `• ${formatStr(p.name)}\n`).join("")
    }
    if (oneAttack.length > 0) {
      embed.description += `\n**__1 Attack__** (${oneAttack.length})\n`
      embed.description += oneAttack.map((p) => `• ${formatStr(p.name)}\n`).join("")
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
