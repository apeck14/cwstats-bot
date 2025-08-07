const { ActivityType, Events, WebhookClient } = require("discord.js")
const registerSlashCommands = require("../util/slash")
const { logToSupportServer } = require("../util/logging")
const { orange, red } = require("../static/colors")
const { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL } = require("../../config")
const { initializeCommands, initializeEmojis } = require("../util/initialize")

module.exports = {
  name: Events.ClientReady,
  once: true,
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

      // Register slash commands (skip if no changes logic can be added here)
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

      // Log to support server
      await logToSupportServer(
        client,
        {
          color: orange,
          footer: { text: `Guilds: ${client.guilds.cache.size} | Users: ${client.users.cache.size}` },
          title: "✅ Bot restarted and ready!",
        },
        false,
      )
    } catch (e) {
      console.error("❌ Error in ready event:", e)
      await logToSupportServer(
        client,
        {
          color: red,
          description: `\`\`\`${e.stack || e.message}\`\`\``,
          title: "❌ Ready Handler Error",
        },
        false,
      )
    } finally {
      console.timeEnd("✅ Bot Ready Time")
    }
  },
}
