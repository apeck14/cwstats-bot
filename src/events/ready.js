const fs = require("fs")
const { WebhookClient } = require("discord.js")
const registerSlashCommands = require("../util/slash")
const { logToSupportServer } = require("../util/logging")
const { orange } = require("../static/colors")
const ownerIds = require("../static/ownerIds")

module.exports = {
  event: "ready",
  once: true,
  run: async (client, db) => {
    const emojis = db.collection("Emojis")

    client.emojis.cache.each((e) => {
      if (ownerIds.includes(e.guild.ownerId)) {
        const emoji = `<:${e.name}:${e.id}>`
        client.cwEmojis.set(e.name, emoji)

        // upsert emoji in DB for Jobs repo to consume
        emojis.updateOne({ name: e.name }, { emoji, name: e.name }, { upsert: true })
      }
    })

    client.commandsWebhook = new WebhookClient({ url: process.env.COMMANDS_WEBHOOK_URL })
    client.botWebhook = new WebhookClient({ url: process.env.BOT_WEBHOOK_URL })

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
