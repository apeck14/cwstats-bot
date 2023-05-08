const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
  data: {
    name: "abbreviations",
    description: "View all abbreviations for this server.",
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
        url: "https://i.imgur.com/VAPR8Jq.png",
      },
    }

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description = `${abbreviations
        .map((a) => `\n• \`${a.abbr}\`: **${formatStr(a.name)}**`)
        .join("")}`
    }

    const abbreviationsRemaining = 15 - abbreviations.length

    if (abbreviationsRemaining > 0) {
      embed.description += `\n\nYou have **${abbreviationsRemaining}** abbreviations remaining.`
    }

    return i.editReply({
      embeds: [embed],
    })
  },
}
