const { Events } = require('discord.js')
const { green } = require('../static/colors')
const ownerIds = require('../static/ownerIds')
const { logToSupportServer } = require('../util/logging')

module.exports = {
  name: Events.GuildEmojiCreate,
  async run(client, emoji) {
    if (!ownerIds.includes(emoji.guild.ownerId)) {
      return
    }

    client.cwEmojis.set(emoji.name, `<:${emoji.name}:${emoji.id}>`)

    logToSupportServer(
      client,
      {
        color: green,
        description: `**Name**: ${emoji.name}\n**ID**: ${emoji.id}`,
        thumbnail: {
          url: emoji.imageURL()
        },
        title: '__Emoji Created!__'
      },
      false
    )
  }
}
