import { Events } from 'discord.js'

import { green } from '../static/colors.js'
import ownerIds from '../static/ownerIds.js'
import { logToSupportServer } from '../util/logging.js'

export default {
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
