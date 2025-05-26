const fs = require("fs")
const { Events, WebhookClient } = require("discord.js")
const registerSlashCommands = require("../util/slash")
const { logToSupportServer } = require("../util/logging")
const { orange } = require("../static/colors")
const ownerIds = require("../static/ownerIds")
const { bulkAddEmojis } = require("../util/services")
const { BOT_WEBHOOK_URL, COMMANDS_WEBHOOK_URL } = require("../../config")

module.exports = {
  name: Events.ClientReady,
  once: true,
  run: async (client) => {
    const emojis = []

    client.emojis.cache.each((e) => {
      if (ownerIds.includes(e.guild.ownerId)) {
        const emoji = `<:${e.name}:${e.id}>`
        client.cwEmojis.set(e.name, emoji)

        emojis.push({ emoji, name: e.name })
      }
    })

    bulkAddEmojis(emojis)

    client.commandsWebhook = new WebhookClient({ url: COMMANDS_WEBHOOK_URL })
    client.botWebhook = new WebhookClient({ url: BOT_WEBHOOK_URL })

    const commandFiles = fs.readdirSync("./src/commands")
    const contextCommandFiles = fs.readdirSync("./src/context-commands")

    const commandsArray = []

    // add slash commands
    for (const file of commandFiles) {
      const command = require(`../commands/${file}`)
      client.commands.set(command.data.name, command)

      commandsArray.push(command)
    }

    // add context menu commands
    for (const file of contextCommandFiles) {
      const command = require(`../context-commands/${file}`)
      client.contextCommands.set(command.data.name, command)

      commandsArray.push(command)
    }

    const commandsData = commandsArray.map((e) => e.data)

    registerSlashCommands(client.user.id, commandsData)

    console.log(`${client.user.tag} Started`)

    logToSupportServer(
      client,
      {
        color: orange,
        title: "Bot restarted!",
      },
      false,
    )
  },
}
