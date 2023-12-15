const { orange, pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")
const { getClanBadge } = require("../util/functions")
const locations = require("../static/locations")

module.exports = {
  data: {
    description: "View the current daily war leaderboard.",
    description_localizations: {
      de: "Die aktuelle tägliche Kriegs-Bestenliste anzeigen.",
      "es-ES": "Ver la clasificación diaria de guerra actual.",
      fr: "Afficher le classement quotidien des guerres en cours.",
      it: "Visualizza la classifica giornaliera delle guerre in corso.",
      nl: "Bekijk het huidige dagelijkse oorlogsleiderbord.",
      tr: "Güncel günlük savaş liderlik tablosunu görüntüleyin.",
    },
    name: "leaderboard",
    name_localizations: {
      de: "bestenliste",
      "es-ES": "clasificación",
      fr: "classement",
      it: "classifica",
      nl: "klassement",
      tr: "lider-tablosu",
    },
    options: [
      {
        choices: locations
          .filter((l) => l.isAdded)
          .map((l) => ({
            name: l.name,
            value: l.name,
          }))
          .sort((a, b) => b.name - a.name),
        description: "Filter by location",
        description_localizations: {
          de: "Nach Standort filtern",
          "es-ES": "Filtrar por ubicación",
          fr: "Filtrer par emplacement",
          it: "Filtra per posizione",
          nl: "Filteren op locatie",
          tr: "Konuma göre filtrele",
        },
        name: "location",
        name_localizations: {
          de: "standort",
          "es-ES": "ubicación",
          fr: "emplacement",
          it: "posizione",
          nl: "locatie",
          tr: "konum",
        },
        required: false,
        type: 3,
      },
      {
        choices: [
          {
            name: "L2 (4000-4999)",
            value: "4000+",
          },
          {
            name: "L3 (5000+)",
            value: "5000+",
          },
        ],
        description: "Filter by league",
        name: "league",
        required: false,
        type: 3,
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
      query.clanScore = {
        $gte: trophies,
        $lt: maxTrophies,
      }
    }

    const leaderboard = await dailyLb
      .find(query)
      .sort({
        notRanked: 1,
        // eslint-disable-next-line perfectionist/sort-objects
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

    let embedUrl = `https://www.cwstats.com/leaderboard/daily/${location?.key || "global"}`

    if (trophies === 4000) embedUrl += `?league=4000`
    else if (trophies === 5000) embedUrl += `?league=5000`

    const embed = {
      color: pink,
      description: "",
      footer: {
        text: `Last Updated: ${diffInMins}m ago`,
      },
      thumbnail: {
        url: "https://i.imgur.com/VAPR8Jq.png",
      },
      title: `**__Daily War Leaderboard__**`,
      url: embedUrl,
    }

    const fameAvgEmoji = client.cwEmojis.get("fameAvg")
    const decksRemainingEmoji = client.cwEmojis.get("decksRemaining")

    embed.description += `**Location**: ${location?.key || "Global"} ${location?.flagEmoji || ":earth_americas:"}\n`
    embed.description += `**League**: ${trophies === 4000 ? "4k" : trophies === 5000 ? "5k+" : "All (4k+)"}\n\n`

    let showNRFooter = false

    for (let i = 0; i < leaderboard.length; i++) {
      const clan = leaderboard[i]
      const url = `https://www.cwstats.com/clan/${clan.tag.substring(1)}/race`
      const badgeName = getClanBadge(clan.badgeId, clan.clanScore)
      const badgeEmoji = client.cwEmojis.get(badgeName)

      if (clan.notRanked) showNRFooter = true

      embed.description += `**${clan.notRanked ? "NR" : i + 1}.** ${badgeEmoji} [**${formatStr(clan.name)}**](${url})\n`
      embed.description += `${fameAvgEmoji} **${clan.fameAvg.toFixed(2)}** ${decksRemainingEmoji} ${
        clan.decksRemaining
      } :earth_americas: `
      embed.description += Number.isInteger(clan.rank) ? `#${clan.rank}\n` : `${clan.rank}\n`
    }

    if (showNRFooter) embed.footer.text += " | NR = Not Ranked"

    return i.editReply({
      embeds: [embed],
    })
  },
}
