const { red } = require("../static/colors")

module.exports = {
	event: "guildDelete",
	run: async (client, db, guild) => {
		if (guild.available && client.isReady()) {
			const guilds = db.collection("Guilds")

			guilds.deleteOne({ guildID: guild.id })
		}

		try {
			//send log message to support server
			client.channels.cache.get("947608454456016896").send({
				embeds: [
					{
						title: "__Left Server!__",
						description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
						color: red,
						thumbnail: {
							url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`,
						},
					},
				],
			})
		} catch {
			console.log("Error sending leave embed to Support Server")
		}
	},
}
