const { Events } = require("discord.js")
const { red } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
  name: Events.GuildDelete,
  run: async (client, db, guild) => {
    if (guild.available && client.isReady()) {
      const guilds = db.collection("Guilds")
      const linkedClans = db.collection("Linked Clans")

      guilds.deleteOne({
        guildID: guild.id,
      })

      linkedClans.deleteMany({ guildID: guild.id })
    }

    logToSupportServer(
      client,
      {
        color: red,
        description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
        thumbnail: {
          url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
        },
        title: "__Left Server!__",
      },
      false,
    )
  },
}
