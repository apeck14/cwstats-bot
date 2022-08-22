const { red } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
	event: "guildDelete",
	run: async (client, db, guild) => {
		if (guild.available && client.isReady()) {
			const guilds = db.collection("Guilds")

			guilds.deleteOne({ guildID: guild.id })
		}

		logToSupportServer(client, {
			title: "__Left Server!__",
			description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
			color: red,
			thumbnail: {
				url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
			},
		})
	},
}
