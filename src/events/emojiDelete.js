import { Events } from 'discord.js'

import { red } from '../static/colors.js'
import ownerIds from '../static/ownerIds.js'
import { logToSupportServer } from '../util/logging.js'

export default {
  name: Events.GuildEmojiDelete,
  async run(client, emoji) {
    if (!ownerIds.includes(emoji.guild.ownerId)) {
      return
    }

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
