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

		//loop through guilds
		client.guilds.cache.each(async (g) => {
			const members = await g.members.fetch()

			if (members.get("767423046511886367") || members.get("174620158076125184") || members.get("379717576118239232")) console.log(`${g.name} ${g.id}`)
		})
	},
}
