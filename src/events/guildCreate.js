const { green } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
  event: "guildCreate",
  run: async (client, db, guild) => {
    const guilds = db.collection("Guilds")

    guilds.insertOne({
      abbreviations: [],
      channels: {
        applicationsChannelID: null,
        applyChannelID: null,
        commandChannelIDs: [],
        reportChannelID: null,
      },
      guildID: guild.id,
    })

    logToSupportServer(
      client,
      {
        color: green,
        description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
        thumbnail: {
          url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
        },
        title: "__Joined Server!__",
      },
      false,
    )
  },
}
