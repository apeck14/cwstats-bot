const fs = require("fs")
const registerSlashCommands = require("../util/slash")
const { logToSupportServer } = require("../util/logging")
const { orange } = require("../static/colors")
const ownerIds = require("../static/ownerIds")

module.exports = {
  event: "ready",
  once: true,
  run: async (client) => {
    client.emojis.cache.each((e) => {
      if (ownerIds.includes(e.guild.ownerId)) {
        client.cwEmojis.set(e.name, `<:${e.name}:${e.id}>`)
      }
    })

    const commandFiles = fs.readdirSync("./src/commands")

    const commandsArray = []

    for (const file of commandFiles) {
      const command = require(`../commands/${file}`)
      client.commands.set(command.data.name, command)

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
