const { getRiverRace } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getAvgFame, getProjFame, getRacePlacements } = require("../util/raceFunctions")
const { errorMsg, getClanBadge } = require("../util/functions")
const { formatStr, formatTag } = require("../util/formatting")

module.exports = {
  data: {
    description: "View current river race stats and projections.",
    description_localizations: {
      de: "Aktuelle Flussrennen-Statistiken und Prognosen anzeigen.",
      "es-ES": "Ver estadísticas y proyecciones de la carrera fluvial actual.",
      fr: "Afficher les statistiques et les projections de la course sur la rivière en cours.",
      it: "Visualizza le statistiche e le previsioni della gara fluviale in corso.",
      nl: "Bekijk de huidige rivier race statistieken en projecties.",
      tr: "Mevcut nehir yarışı istatistiklerini ve projeksiyonlarını görüntüleyin.",
    },
    name: "race",
    name_localizations: {
      de: "rennen",
      "es-ES": "carrera",
      fr: "course",
      it: "corsa",
      nl: "race",
      tr: "yarış",
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
              description: "**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me).",
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

    const { data: race, error } = await getRiverRace(tag)

    if (error) return errorMsg(i, error)

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
    if (!race.clans || !race.clans.length) {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**Clan is not in a river race.**",
          },
        ],
      })
    }

    const isColosseum = race.periodType === "colosseum"
    const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

    const embed = {
      author: {
        name: `Week ${race.sectionIndex + 1} | ${dayOfWeek < 3 ? "Training" : "War"} Day ${
          dayOfWeek < 3 ? dayOfWeek + 1 : dayOfWeek - 2
        }`,
      },
      color: pink,
      description: "",
      footer: {
        text: isColosseum ? "Missed attacks negatively affect fame/atk" : "",
      },
      thumbnail: {
        url: "https://i.imgur.com/VAPR8Jq.png",
      },
      title: isColosseum ? `**__Colosseum__**` : `**__River Race__**`,
      url: `https://www.cwstats.com/clan/${race.clan.tag.substring(1)}/race`,
    }

    const placements = getRacePlacements(race.clans, isColosseum)
    const clansStillWarring = placements.filter((c) => !c.crossedFinishLine)
    const clansCrossedFinishLine = placements.filter((c) => c.crossedFinishLine)

    const fameEmoji = client.cwEmojis.get("fame")
    const fameAvgEmoji = client.cwEmojis.get("fameAvg")
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")
    const projectionEmoji = client.cwEmojis.get("projection")

    clansCrossedFinishLine.forEach((c) => {
      const clan = race.clans.find((cl) => cl.tag === c.tag)
      const { badgeId, clanScore, name } = clan

      const badgeName = getClanBadge(badgeId, clanScore)
      const badgeEmoji = client.cwEmojis.get(badgeName)

      if (c.tag === formatTag(tag)) embed.description += `${badgeEmoji} **__${formatStr(name)}__**\n`
      else embed.description += `${badgeEmoji} **${formatStr(name)}**\n`
    })

    for (const c of clansStillWarring) {
      embed.description += c.placement === Infinity ? "\n" : `\n**${c.placement}.**`

      const clan = race.clans.find((cl) => cl.tag === c.tag)
      const { badgeId, clanScore, name, participants } = clan

      const decksRemaining = 200 - participants.reduce((a, b) => a + b.decksUsedToday, 0)

      const badgeName = getClanBadge(badgeId, clanScore)
      const badgeEmoji = client.cwEmojis.get(badgeName)

      if (c.tag === formatTag(tag)) embed.description += `${badgeEmoji} **__${formatStr(name)}__**\n`
      else embed.description += `${badgeEmoji} **${formatStr(name)}**\n`

      embed.description += `${fameEmoji} ${c.fame}\n${projectionEmoji} ${getProjFame(
        clan,
        isColosseum,
        dayOfWeek,
      )}\n${decksRemainingEmoji} ${decksRemaining}\n${fameAvgEmoji} **${getAvgFame(
        clan,
        isColosseum,
        dayOfWeek,
      ).toFixed(2)}**\n`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
