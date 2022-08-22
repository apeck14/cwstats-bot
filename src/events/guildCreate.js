const { green } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
	event: "guildCreate",
	run: async (client, db, guild) => {
		const guilds = db.collection("Guilds")

		guilds.insertOne({
			guildID: guild.id,
			channels: {
				applyChannelID: null,
				applicationsChannelID: null,
				commandChannelID: null,
			},
			abbreviations: [],
		})

		logToSupportServer({
			title: "__Joined Server!__",
			description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
			color: green,
			thumbnail: {
				url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
			},
		})
	},
}
