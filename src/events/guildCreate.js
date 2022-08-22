const { green } = require("../static/colors")

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

		try {
			//send log message to support server
			client.channels.cache.get("947608454456016896").send({
				embeds: [
					{
						title: "__Joined Server!__",
						description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
						color: green,
						thumbnail: {
							url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
						},
					},
				],
			})
		} catch {
			console.log("Error sending join embed to Support Server")
		}
	},
}
