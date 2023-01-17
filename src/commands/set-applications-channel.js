const { green, orange } = require("../static/colors")

module.exports = {
	data: {
		name: "set-applications-channel",
		description: "Set applications channel.",
		options: [
			{
				type: 7,
				name: "channel",
				description: "Set channel where applications will be posted.",
				required: true,
				channel_types: [0], //text channels only
			}
		],
		userPermissions: ["MANAGE_GUILD"],
	},
	run: async (i, db) => {
		const guilds = db.collection("Guilds")

		const { channels } = await guilds.findOne({
			guildID: i.guildId
		})
		const { applicationsChannelID } = channels

		const channel = i.options.getChannel("channel")

		if (channel.id === applicationsChannelID) {
			return i.editReply({
				embeds: [
					{
						color: orange,
						description: `**This channel is already set!**`
					}
				]
			})
		}

		guilds.updateOne({
			guildID: i.guildId
		}, {
			$set: {
				"channels.applicationsChannelID": channel.id
			}
		})

		return i.editReply({
			embeds: [
				{
					color: green,
					description: `✅ **Applications** channel now set to <#${channel.id}>!`,
				}
			],
		})
	},
}