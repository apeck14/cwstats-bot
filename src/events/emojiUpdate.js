import { Events } from 'discord.js'

import { green } from '../static/colors.js'
import ownerIds from '../static/ownerIds.js'
import { logToSupportServer } from '../util/logging.js'

export default {
  name: Events.GuildEmojiUpdate,
  async run(client, oldEmoji, newEmoji) {
    if (!ownerIds.includes(newEmoji.guild.ownerId)) {
      return
    }

    client.cwEmojis.delete(oldEmoji.name)
    client.cwEmojis.set(newEmoji.name, `<:${newEmoji.name}:${newEmoji.id}>`)

    logToSupportServer(
      client,
      {
        color: green,
        description: `**Old Name**: ${oldEmoji.name}\n**New Name**: ${newEmoji.name}`,
        thumbnail: {
          url: newEmoji.imageURL()
        },
        title: '__Emoji Updated!__'
      },
      false
    )
  }
}
