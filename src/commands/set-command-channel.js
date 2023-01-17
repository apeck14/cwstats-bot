const { green, orange } = require("../static/colors")

module.exports = {
	data: {
		name: "set-command-channel",
		description: "Set command channel.",
		options: [
			{
				type: 7,
				name: "channel",
				description: "Set channel where commands will be restricted to.",
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
		const { commandChannelID } = channels

		const channel = i.options.getChannel("channel")

		if (channel.id === commandChannelID) {
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
				"channels.commandChannelID": channel.id
			}
		})

		return i.editReply({
			embeds: [
				{
					color: green,
					description: `✅ **Command** channel now set to <#${channel.id}>!`,
				}
			],
		})
	},
}