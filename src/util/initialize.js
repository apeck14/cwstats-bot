const { schedule } = require("node-cron")
const fs = require("fs")
const { Client, Intents, Collection } = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

const events = fs.readdirSync("src/events")
const jobs = fs.readdirSync("src/jobs")

const initializeEvents = (mongo, client) => {
	for (const event of events) {
		const eventFile = require(`../events/${event}`)
		if (eventFile.once)
			client.once(eventFile.event, (...args) => eventFile.run(client, mongo.db, ...args))

		else
			client.on(eventFile.event, (...args) => eventFile.run(client, mongo.db, ...args))

	}

	console.log("DiscordJS Events Initalized!")
}

const initializeCronJobs = (mongo, client) => {
	for (const job of jobs) {
		try {
			require.resolve(`../jobs/${job}`)
			const jobFile = require(`../jobs/${job}`)
			const newJob = schedule(jobFile.expression, () => jobFile.run(client, mongo.db))
			newJob.start()
		}
		catch (e) {
			console.log(e)
			continue
		}
	}

	console.log("Cron Jobs Initialized!")
}

const initializeClient = () => {
	const client = new Client({
		intents: [
			Intents.FLAGS.GUILDS,
			Intents.FLAGS.GUILD_MESSAGES,
			Intents.FLAGS.GUILD_MESSAGE_TYPING,
			Intents.FLAGS.GUILD_MESSAGE_REACTIONS
		],
	})

	console.log("Client Initialized!")

	client.commands = new Collection()
	client.login(CLIENT_TOKEN)

	return client
}

module.exports = {
	initializeEvents,
	initializeCronJobs,
	initializeClient
}