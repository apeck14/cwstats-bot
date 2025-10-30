import { Events } from 'discord.js'

import { red } from '../static/colors.js'
import { logToSupportServer } from '../util/logging.js'
import { deleteGuild } from '../util/services.js'

export default {
  name: Events.GuildDelete,
  async run(client, guild) {
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
