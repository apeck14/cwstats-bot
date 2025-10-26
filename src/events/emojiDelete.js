const { Events } = require('discord.js')
const ownerIds = require('../static/ownerIds')
const { red } = require('../static/colors')
const { logToSupportServer } = require('../util/logging')

module.exports = {
  name: Events.GuildEmojiDelete,
  run: async (client, emoji) => {
    if (!ownerIds.includes(emoji.guild.ownerId)) return

    client.cwEmojis.delete(emoji.name)

    logToSupportServer(
      client,
      {
        color: red,
        description: `**Name**: ${emoji.name}\n**ID**: ${emoji.id}`,
        thumbnail: {
          url: emoji.imageURL()
        },
        title: '__Emoji Deleted!__'
      },
      false
    )
  }
}
