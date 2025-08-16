const fs = require("fs")
const { Client, Collection, GatewayIntentBits } = require("discord.js")
const path = require("path")
const { CLIENT_TOKEN } = require("../../config")
const { bulkAddEmojis } = require("./services")
const ownerIds = require("../static/ownerIds")

const events = fs.readdirSync("src/events")

const initializeEvents = (client) => {
  for (const event of events) {
    const eventFile = require(`../events/${event}`)
    if (eventFile.once) client.once(eventFile.name, (...args) => eventFile.run(client, ...args))
    else client.on(eventFile.name, (...args) => eventFile.run(client, ...args))
  }

  console.log("DiscordJS Events Initalized!")

  return client
}

const initializeClient = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildExpressions,
    ],
    shards: "auto",
  })

  client.commands = new Collection()
  client.contextCommands = new Collection()
  client.cwEmojis = new Collection()

  await client.login(CLIENT_TOKEN)

  console.log("Client Initialized!")

  return client
}

async function initializeCommands(client) {
  const commandsArray = []

  const commandDir = path.join(__dirname, "../commands")
  const contextDir = path.join(__dirname, "../context-commands")

  const commandFiles = fs.readdirSync(commandDir).filter((f) => f.endsWith(".js"))
  const contextFiles = fs.readdirSync(contextDir).filter((f) => f.endsWith(".js"))

  for (const file of commandFiles) {
    const command = require(`${commandDir}/${file}`)
    client.commands.set(command.data.name, command)
    commandsArray.push(command)
  }

  for (const file of contextFiles) {
    const command = require(`${contextDir}/${file}`)
    client.contextCommands.set(command.data.name, command)

    command.contextCmd = true
    commandsArray.push(command)
  }

  console.log(`🔧 Loaded ${commandsArray.length} commands`)
  return commandsArray
}

function initializeEmojis(client) {
  console.time("🎨 Emoji Load Time")

  const emojis = []

  for (const emoji of client.emojis.cache.values()) {
    const { guild } = emoji
    if (!guild || !ownerIds.includes(guild.ownerId)) continue

    const emojiStr = `<:${emoji.name}:${emoji.id}>`
    client.cwEmojis.set(emoji.name, emojiStr)
    emojis.push({ emoji: emojiStr, name: emoji.name })
  }

  bulkAddEmojis(emojis)
  console.log(`🎨 Loaded ${emojis.length} emojis into memory`)
  console.timeEnd("🎨 Emoji Load Time")
}

module.exports = {
  initializeClient,
  initializeCommands,
  initializeEmojis,
  initializeEvents,
}
