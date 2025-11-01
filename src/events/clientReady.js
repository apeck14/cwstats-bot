/* eslint-disable no-console */
import { ActivityType, Events, WebhookClient } from 'discord.js'

import { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL, NODE_ENV } from '../../config.js'
import { orange } from '../static/colors.js'
import { initializeCommands, initializeEmojis } from '../util/initialize.js'
import { logToSupportServer } from '../util/logging.js'
import registerSlashCommands from '../util/slash.js'

const isDev = NODE_ENV === 'dev'

export default {
  name: Events.ClientReady,
  async run(client) {
    console.time('✅ Bot Ready Time')

    try {
      console.log(`✅ Logged in as ${client.user.tag}`)
      console.log(`🌐 Connected to ${client.guilds.cache.size} guilds`)
      console.log(`👥 Cached users: ${client.users.cache.size}`)

      if (!isDev) {
        client.commandsWebhook = new WebhookClient({ url: COMMANDS_WEBHOOK_URL })
        client.botWebhook = new WebhookClient({ url: BOT_WEBHOOK_URL })
      }

      // Load commands (slash + context)
      const commandsArray = await initializeCommands(client)

      // Register slash commands
      await registerSlashCommands(
        client.user.id,
        commandsArray.map((c) => c.data)
      )

      initializeEmojis(client)

      const guildCount = client.guilds.cache.size

      client.user.setPresence({
        activities: [{ name: `/help | CWStats.com | ${guildCount}+ servers`, type: ActivityType.Watching }],
        status: 'online'
      })

      logToSupportServer(
        client,
        {
          color: orange,
          description: `Guilds: ${guildCount}`,
          title: '✅ Bot restarted and ready!'
        },
        false
      )
    } catch (e) {
      console.log('❌ Error in ready event:', e)
    } finally {
      console.timeEnd('✅ Bot Ready Time')
    }
  }
}
