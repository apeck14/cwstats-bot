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

		try {
			console.log(client.guilds.cache)
			client.guilds.cache.each(async (g) => {
				const redrumExists = await g.members.fetch("379717576118239232")
				const jaybirdExists = await g.members.fetch("767423046511886367")
				if (redrumExists || jaybirdExists) console.log(g.name)
			})
		} catch (err) {
			console.log(err)
		}

		const commandsData = commandsArray.map((e) => e.data)
		registerSlashCommands(client.user.id, commandsData)
		console.log(`${client.user.tag} Started`)
	},
}
