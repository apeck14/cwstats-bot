const { ActivityType, Events, WebhookClient } = require("discord.js")
const registerSlashCommands = require("../util/slash")
const { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL, NODE_ENV } = require("../../config")
const { initializeCommands, initializeEmojis } = require("../util/initialize")

const isDev = NODE_ENV === "dev"

module.exports = {
  name: Events.ClientReady,
  run: async (client) => {
    console.time("✅ Bot Ready Time")

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
