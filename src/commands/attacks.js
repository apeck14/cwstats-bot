const { getRiverRace, getClan } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getClanBadge, errorMsg } = require("../util/functions")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "attacks",
    name_localizations: {
      de: "angriffe",
      fr: "attaques",
      "es-ES": "ataques",
      tr: "saldırılar",
      it: "attacchi",
      nl: "aanvallen",
    },
    description: "View players with remaining attacks.",
    description_localizations: {
      de: "Spieler mit verbleibenden Angriffen anzeigen.",
      fr: "Afficher les joueurs ayant encore des attaques.",
      "es-ES": "Ver jugadores con ataques restantes.",
      tr: "Kalan saldırıları olan oyuncuları görüntüleyin.",
      it: "Visualizza i giocatori con attacchi rimanenti.",
      nl: "Bekijk spelers met resterende aanvallen.",
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
    const { abbreviations, defaultClan } = await guilds.findOne({
      guildID: i.guildId,
    })

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

    const badgeEmoji = client.cwEmojis.get(badgeName)
    const fameEmoji = client.cwEmojis.get("fame")
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const slotsRemainingEmoji = client.cwEmojis.get("remainingSlots")
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
