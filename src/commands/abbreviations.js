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

    const { abbreviations, defaultClan } = await guilds.findOne({
      guildID: i.guildId,
    })

    const embed = {
      color: pink,
      description: "**__Default Clan__**\n",
      thumbnail: {
        url: i.guild.iconURL() || "https://i.imgur.com/VAPR8Jq.png",
      },
      title: "__**Server Abbreviations**__",
      url: `https://cwstats.com/me/servers/${i.guildId}`,
    }

    if (defaultClan) {
      embed.description += `**${defaultClan.name}**`
    } else embed.description += "*None*"

    embed.description += "\n\n**__Abbreviations__**"

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description += `${abbreviations
        .map((a) => `\n• **${a.abbr.toLowerCase()}**: ${formatStr(a.name)}`)
        .join("")}`
    } else embed.description += "\n*None*"

    return i.editReply({
      embeds: [embed],
    })
  },
}
