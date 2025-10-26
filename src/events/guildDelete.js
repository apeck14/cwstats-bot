const { Events } = require('discord.js')
const { red } = require('../static/colors')
const { logToSupportServer } = require('../util/logging')
const { deleteGuild } = require('../util/services')

module.exports = {
  name: Events.GuildDelete,
  run: async (client, guild) => {
    if (guild.available && client.isReady()) {
      deleteGuild(guild.id)
    }

    logToSupportServer(
      client,
      {
        color: red,
        description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
        thumbnail: {
          url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        },
        title: '__Left Server!__'
      },
      false
    )
  }
}
