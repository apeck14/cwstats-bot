const fs = require("fs")
const registerSlashCommands = require("../util/slash")

module.exports = {
	event: "ready",
	once: true,
	run: async (client) => {
		const commandFiles = fs.readdirSync("./src/commands")

		client.user.setActivity(`Need help? | ${client.guilds.cache.size} servers`)

		let commandsArray = []

		for (const file of commandFiles) {
			const command = require(`../commands/${file}`)
			client.commands.set(command.data.name, command)

			commandsArray.push(command)
		}

		const commandsData = commandsArray.map((e) => e.data)
		registerSlashCommands(client.user.id, commandsData)
		console.log(`${client.user.tag} Started`)
	},
}
