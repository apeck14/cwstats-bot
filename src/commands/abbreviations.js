const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    description: "View all abbreviations for this server.",
    description_localizations: {
      de: "Alle Abkürzungen für diesen Server anzeigen.",
      "es-ES": "Ver todas las abreviaturas de este servidor.",
      fr: "Voir toutes les abréviations pour ce serveur.",
      it: "Visualizza tutte le abbreviazioni per questo server.",
      nl: "Bekijk alle afkortingen voor deze server.",
      tr: "Bu sunucudaki tüm kısaltmaları görüntüleyin.",
    },
    name: "abbreviations",
    name_localizations: {
      de: "abkürzungen",
      "es-ES": "abreviaturas",
      fr: "abréviations",
      it: "abbreviazioni",
      nl: "afkortingen",
      tr: "kısaltmalar",
    },
  },
  run: async (i, db) => {
    const guilds = db.collection("Guilds")

    const { abbreviations } = await guilds.findOne({
      guildID: i.guildId,
    })

    const embed = {
      color: pink,
      description: "*None*",
      footer: {
        text: "Manage abbreviations @ cwstats.com/me",
      },
      thumbnail: {
        url: i.guild.iconURL() || "https://i.imgur.com/VAPR8Jq.png",
      },
      title: "__**Server Abbreviations**__",
    }

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description = `${abbreviations.map((a) => `\n• **${a.abbr}**: ${formatStr(a.name)}`).join("")}`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
