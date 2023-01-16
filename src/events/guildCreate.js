const { green } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")
const { BLACKLIST_GUILDS } = require("../static/blacklist")

module.exports = {
	event: "guildCreate",
	run: async (client, db, guild) => {
		if (BLACKLIST_GUILDS.includes(guild.id)) {
			guild.leave()

			return
		}

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

		logToSupportServer(client, {
			title: "__Joined Server!__",
			description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
			color: green,
			thumbnail: {
				url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
			},
		})
	},
}