const { orange } = require("../static/colors.js")
const validate = require("../util/validate.js")

module.exports = {
	event: "interactionCreate",
	run: async (client, db, i) => {
		if (i?.type !== "APPLICATION_COMMAND") return
		if (!i.guild)
			return i.reply({
				embeds: [
					{
						description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=280576&scope=bot%20applications.commands) me to a server to use my commands!**`,
						color: orange,
					},
				],
			})

		try {
			await i.deferReply()

			const guilds = db.collection("Guilds")
			const { channels } = await guilds.findOne({ guildID: i.guildId })
			const { error, color, onlyShowToUser } = validate(i, channels, client)

			if (error) {
				return await i.editReply({
					embeds: [
						{
							description: error,
							color: color,
						},
					],
					ephemeral: onlyShowToUser,
				})
			}

			const { disabled, run } = i.client.commands.get(i.commandName)

			if (disabled) {
				return await i.editReply({
					embeds: [
						{
							description: ":tools: **This command has been temporarily disabled**.",
							color: orange,
						},
					],
					ephemeral: onlyShowToUser,
				})
			}

			await run(i, db, client)
		} catch (e) {
			console.log(e)
		}
	},
}
