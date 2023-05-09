const { pink, orange } = require("../static/colors")
const { formatStr } = require("../util/formatting")
const { getEmoji, getClanBadge } = require("../util/functions")
const locations = require("../static/locations")

module.exports = {
  data: {
    name: "leaderboard",
    name_localizations: {
      de: "bestenliste",
      fr: "classement",
      "es-ES": "clasificación",
      tr: "lider-tablosu",
      it: "classifica",
      nl: "klassement",
    },
    description: "View the current daily war leaderboard.",
    description_localizations: {
      de: "Die aktuelle tägliche Kriegs-Bestenliste anzeigen.",
      fr: "Afficher le classement quotidien des guerres en cours.",
      "es-ES": "Ver la clasificación diaria de guerra actual.",
      tr: "Güncel günlük savaş liderlik tablosunu görüntüleyin.",
      it: "Visualizza la classifica giornaliera delle guerre in corso.",
      nl: "Bekijk het huidige dagelijkse oorlogsleiderbord.",
    },
    options: [
      {
        type: 3,
        name: "location",
        name_localizations: {
          de: "standort",
          fr: "emplacement",
          "es-ES": "ubicación",
          tr: "konum",
          it: "posizione",
          nl: "locatie",
        },
        description: "Filter by location",
        description_localizations: {
          de: "Nach Standort filtern",
          fr: "Filtrer par emplacement",
          "es-ES": "Filtrar por ubicación",
          tr: "Konuma göre filtrele",
          it: "Filtra per posizione",
          nl: "Filteren op locatie",
        },
        required: false,
        choices: locations
          .filter((l) => l.isAdded)
          .map((l) => ({
            name: l.name,
            value: l.name,
          }))
          .sort((a, b) => b.name - a.name),
      },
      {
        type: 3,
        name: "league",
        description: "Filter by league",
        required: false,
        choices: [
          {
            name: "4000+",
            value: "4000+",
          },
          {
            name: "5000+",
            value: "5000+",
          },
        ],
      },
    ],
  },
  run: async (i, db, client) => {
    const dailyLb = db.collection("Daily Clan Leaderboard")
    const statistics = db.collection("Statistics")
    const iName = i.options.getString("location")
    const iLeague = i.options.getString("league")

    const location = locations.find((l) => l.name === iName)
    const trophies = parseInt(iLeague?.slice(0, -1))
    const maxTrophies = trophies === 5000 ? 10000 : trophies + 1000

    const query = {}
    if (iName) query["location.name"] = iName
    if (maxTrophies) {
      query["clanScore"] = {
        $lt: maxTrophies,
        $gte: trophies,
      }
    }

    const leaderboard = await dailyLb
      .find(query)
      .sort({
        fameAvg: -1,
        rank: 1,
      })
      .limit(10)
      .toArray()

    if (leaderboard.length === 0) {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**No clans found!**",
          },
        ],
      })
    }

    const { lbLastUpdated } = (await statistics.find({}).toArray())[0]
    const now = Date.now()
    const diffInMins = Math.round((now - lbLastUpdated) / 1000 / 60)

    let embedUrl = `https://www.cwstats.com/leaderboard/daily/${
      location?.key || "global"
    }`

    if (trophies === 4000) embedUrl += `?league=4000`
    else if (trophies === 5000) embedUrl += `?league=5000`

    const embed = {
      title: `**__Daily War Leaderboard__**`,
      url: embedUrl,
      description: "",
      footer: {
        text: `Last Updated: ${diffInMins}m ago`,
      },
      thumbnail: {
        url: "https://i.imgur.com/VAPR8Jq.png",
      },
      color: pink,
    }

    const fameAvgEmoji = getEmoji("fameAvg")
    const decksRemainingEmoji = getEmoji("decksRemaining")

    embed.description += `**Location**: ${location?.key || "Global"} ${
      location?.flagEmoji || ":earth_americas:"
    }\n`
    embed.description += `**League**: ${
      trophies === 4000 ? "4k" : trophies === 5000 ? "5k+" : "All (4k+)"
    }\n\n`

    for (let i = 0; i < leaderboard.length; i++) {
      const clan = leaderboard[i]
      const url = `https://www.cwstats.com/clan/${clan.tag.substring(1)}/race`
      const badgeName = getClanBadge(clan.badgeId, clan.clanScore)
      const badgeEmoji = getEmoji(badgeName)

      embed.description += `**${i + 1}. ${badgeEmoji} [${formatStr(
        clan.name
      )}](${url})**\n`
      embed.description += `${fameAvgEmoji} **${clan.fameAvg.toFixed(
        2
      )}** ${decksRemainingEmoji} ${clan.decksRemaining} :earth_americas: `
      embed.description += Number.isInteger(clan.rank)
        ? `#${clan.rank}\n`
        : `${clan.rank}\n`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
