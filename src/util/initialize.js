const fs = require("fs")
const { ActivityType, Client, Collection, GatewayIntentBits } = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

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
    presence: {
      activities: [
        {
          name: `CWStats.com | 3000+ servers`,
          type: ActivityType.Watching,
        },
      ],
    },
    shards: "auto",
  })

  client.commands = new Collection()
  client.contextCommands = new Collection()
  client.cwEmojis = new Collection()

  await client.login(CLIENT_TOKEN)

  console.log("Client Initialized!")

  return client
}

module.exports = {
  initializeClient,
  initializeEvents,
}
