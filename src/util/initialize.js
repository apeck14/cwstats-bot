const { schedule } = require("node-cron")
const fs = require("fs")
const {
  Client,
  GatewayIntentBits,
  Collection,
  ActivityType,
} = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

const events = fs.readdirSync("src/events")
const jobs = fs.readdirSync("src/jobs")

const initializeEvents = (mongo, client) => {
  for (const event of events) {
    const eventFile = require(`../events/${event}`)
    if (eventFile.once)
      client.once(eventFile.event, (...args) =>
        eventFile.run(client, mongo.db, ...args)
      )
    else
      client.on(eventFile.event, (...args) =>
        eventFile.run(client, mongo.db, ...args)
      )
  }

  console.log("DiscordJS Events Initalized!")

  return client
}

const initializeCronJobs = (mongo, client) => {
  for (const job of jobs) {
    try {
      require.resolve(`../jobs/${job}`)
      const jobFile = require(`../jobs/${job}`)
      const newJob = schedule(jobFile.expression, () =>
        jobFile.run(client, mongo.db)
      )
      newJob.start()
    } catch (e) {
      console.log(e)
      continue
    }
  }

  console.log("Cron Jobs Initialized!")

  return client
}

const initializeClient = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageTyping,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildEmojisAndStickers,
    ],
    presence: {
      activities: [
        {
          name: `CWStats.com | 2500+ servers`,
          type: ActivityType.Watching,
        },
      ],
    },
  })

  client.commands = new Collection()
  await client.login(CLIENT_TOKEN)

  console.log("Client Initialized!")

  return client
}

module.exports = {
  initializeEvents,
  initializeCronJobs,
  initializeClient,
}
