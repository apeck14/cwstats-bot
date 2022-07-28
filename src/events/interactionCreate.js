const { orange } = require("../static/colors.js")
const validate = require("../util/validate.js")
const guildCreate = require("./guildCreate")

module.exports = {
	event: "interactionCreate",
	run: async (client, db, i) => {
		try {
			if (i?.type !== "APPLICATION_COMMAND") return
			if (!i.guild)
				return await i.reply({
					embeds: [
						{
							description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=280576&scope=bot%20applications.commands) me to a server to use my commands!**`,
							color: orange,
						},
					],
				})

			await i.deferReply()

			const guilds = db.collection("Guilds")
			let guildExists = await guilds.findOne({ guildID: i.guildId })

			if (!guildExists) {
				await guildCreate.run(client, db, i.member.guild)

				guildExists = await guilds.findOne({ guildID: i.guildId })

				if (!guildExists) return console.log("Guild not in database, and could not be added.")

				console.log(`Guild not found, but updated! ${i.member.guild.id}`)
			}

			const { error, color, onlyShowToUser } = validate(i, guildExists.channels, client)

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
			return
		}
	},
}
