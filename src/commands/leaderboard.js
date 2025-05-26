const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")
const { errorMsg, getClanBadge, warningMsg } = require("../util/functions")
const locations = require("../static/locations")
const { getAllPlusClans, getDailyLeaderboard } = require("../util/services")

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
          .sort((a, b) => a.name.localeCompare(b.name)),
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
            value: "L2",
          },
          {
            name: "L3 (5000+)",
            value: "L3",
          },
        ],
        description: "Filter by league",
        name: "league",
        required: false,
        type: 3,
      },
    ],
  },
  run: async (i, client) => {
    const iName = i.options.getString("location")
    const iLeague = i.options.getString("league")

    const location = locations.find((l) => l.name === iName)

    const minTrophies = iLeague === "L3" ? 5000 : 4000
    const maxTrophies = iLeague === "L2" ? 4999 : null

    const [{ data: dailyLb, error: lbError }, { data: plusTags, error: plusError }] = await Promise.all([
      getDailyLeaderboard({
        key: location?.key,
        limit: 10,
        maxTrophies,
        minTrophies,
      }),
      getAllPlusClans(true),
    ])

    if (lbError || plusError) {
      return errorMsg(i, lbError || plusError)
    }

    const { clans: leaderboard, lastUpdated } = dailyLb

    if (leaderboard.length === 0) {
      return warningMsg(i, "**No leaderboard clans match this criteria!**")
    }

    const now = Date.now()
    const diffInMins = Math.round((now - lastUpdated) / 1000 / 60)

    let embedUrl = `https://www.cwstats.com/leaderboard/daily/${location?.key || "global"}`

    if (minTrophies === 4000) embedUrl += `?league=4000`
    else if (minTrophies === 5000) embedUrl += `?league=5000`

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
    const cwstatsPlusEmoji = client.cwEmojis.get("cwstats_plus")
    const leagueEmoji = iLeague ? client.cwEmojis.get(`legendary${iLeague.slice(iLeague.length - 1)}`) : ""

    embed.description += `**Location**: ${location?.key?.replace("_", "") || "Global"} ${location?.flagEmoji || ":earth_americas:"}\n`
    embed.description += `**League**: ${iLeague || "All (L2+)"} ${leagueEmoji}\n\n`

    let showNRFooter = false

    for (let i = 0; i < leaderboard.length; i++) {
      const clan = leaderboard[i]
      const url = `https://www.cwstats.com/clan/${clan.tag.substring(1)}/race`
      const badgeName = getClanBadge(clan.badgeId, clan.clanScore)
      const badgeEmoji = client.cwEmojis.get(badgeName)
      const isPlus = plusTags.includes(clan.tag) ? cwstatsPlusEmoji : ""

      if (clan.notRanked) showNRFooter = true

      embed.description += `**${clan.notRanked ? "NR" : i + 1}.** ${badgeEmoji} [**${formatStr(clan.name)}**](${url})${isPlus}\n`
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
