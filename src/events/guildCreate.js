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

		console.log(`JOINED GUILD: ${guild.name} (${guild.id})`)
	},
}
