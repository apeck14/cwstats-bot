const fs = require("fs")
const registerSlashCommands = require("../util/slash")
const { BLACKLIST_GUILDS } = require("../static/blacklist")

module.exports = {
	event: "ready",
	once: true,
	run: async (client) => {
		console.log(`${client.user.tag} Started`)

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
			"878396465817460757"
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

		//leave blacklisted servers
		for (const id of BLACKLIST_GUILDS) {
			const g = client.guilds.cache.get(id)

			if (g) g.leave()
		}

		console.log("allEmojis.json successfully written!")
	},
}