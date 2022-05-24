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

		const emojis = {}
		const ownerIds = [
			"493245767448789023",
			"878013634851258428",
			"878025564538146816",
			"878031332817645681",
			"878030152691499028",
			"878395655121436682",
			"878394839950061630",
			"878397282461024287",
			"878396465817460757",
		]

		client.emojis.cache.each((e) => {
			if (ownerIds.includes(e.guild.ownerId)) emojis[e.name] = `<:${e.name}:${e.id}>`
		})

		fs.writeFileSync("allEmojis.json", JSON.stringify(emojis), (err) => {
			if (err) {
				console.log("There was an issue creating allEmojis.json")
				console.log(err)
			}
		})

		console.log("allEmojis.json successfully written!")

		//loop through guilds
		// client.guilds.cache.each(async (g) => {
		// 	const members = await g.members.fetch()

		// 	if (members.get("767423046511886367") || members.get("174620158076125184") || members.get("379717576118239232")) console.log(`${g.name} ${g.id}`)
		// })
	},
}
