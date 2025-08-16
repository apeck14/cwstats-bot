const { ActivityType, Events, WebhookClient } = require("discord.js")
const registerSlashCommands = require("../util/slash")
const { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL } = require("../../config")
const { initializeCommands, initializeEmojis } = require("../util/initialize")

module.exports = {
  name: Events.ClientReady,
  run: async (client) => {
    console.time("✅ Bot Ready Time")

    try {
      console.log(`✅ Logged in as ${client.user.tag}`)
      console.log(`🌐 Connected to ${client.guilds.cache.size} guilds`)
      console.log(`👥 Cached users: ${client.users.cache.size}`)

      client.commandsWebhook = COMMANDS_WEBHOOK_URL ? new WebhookClient({ url: COMMANDS_WEBHOOK_URL }) : null
      client.botWebhook = BOT_WEBHOOK_URL ? new WebhookClient({ url: BOT_WEBHOOK_URL }) : null

      // Load commands (slash + context)
      const commandsArray = await initializeCommands(client)

      // Register slash commands
      await registerSlashCommands(
        client.user.id,
        commandsArray.map((c) => c.data),
      )

      initializeEmojis(client)

      client.user.setPresence({
        activities: [
          { name: `/help | CWStats.com | ${client.guilds.cache.size}+ servers`, type: ActivityType.Watching },
        ],
        status: "online",
      })
    } catch (e) {
      console.error("❌ Error in ready event:", e)
    } finally {
      console.timeEnd("✅ Bot Ready Time")
    }
  },
}
