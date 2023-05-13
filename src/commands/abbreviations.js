const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "abbreviations",
    name_localizations: {
      de: "abkürzungen",
      fr: "abréviations",
      "es-ES": "abreviaturas",
      tr: "kısaltmalar",
      it: "abbreviazioni",
      nl: "afkortingen",
    },
    description: "View all abbreviations for this server.",
    description_localizations: {
      de: "Alle Abkürzungen für diesen Server anzeigen.",
      fr: "Voir toutes les abréviations pour ce serveur.",
      "es-ES": "Ver todas las abreviaturas de este servidor.",
      tr: "Bu sunucudaki tüm kısaltmaları görüntüleyin.",
      it: "Visualizza tutte le abbreviazioni per questo server.",
      nl: "Bekijk alle afkortingen voor deze server.",
    },
  },
  run: async (i, db) => {
    const guilds = db.collection("Guilds")

    const { abbreviations } = await guilds.findOne({
      guildID: i.guildId,
    })

    const embed = {
      title: "__**Server Abbreviations**__",
      description: "*None*",
      color: pink,
      thumbnail: {
        url: i.guild.iconURL() || "https://i.imgur.com/VAPR8Jq.png",
      },
      footer: {
        text: "Manage abbreviations @ cwstats.com/me",
      },
    }

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description = `${abbreviations
        .map((a) => `\n• **${a.abbr}**: ${formatStr(a.name)}`)
        .join("")}`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
