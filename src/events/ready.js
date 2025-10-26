/* eslint-disable no-console */
const { ActivityType, Events, WebhookClient } = require('discord.js')
const registerSlashCommands = require('../util/slash')
const { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL, NODE_ENV } = require('../../config')
const { initializeCommands, initializeEmojis } = require('../util/initialize')
const { logToSupportServer } = require('../util/logging')
const { orange } = require('../static/colors')

const isDev = NODE_ENV === 'dev'

module.exports = {
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
      console.error('❌ Error in ready event:', e)
    } finally {
      console.timeEnd('✅ Bot Ready Time')
    }
  }
}
