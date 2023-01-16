const { orange, red, pink } = require("../static/colors.js")
const { logToSupportServer } = require("../util/logging.js")
const { validate } = require("../util/validate.js")
const guildCreate = require("./guildCreate")
const { BLACKLIST_USERS } = require("../static/blacklist")

module.exports = {
	event: "interactionCreate",
	run: async (client, db, i) => {
		try {
			if (i?.type !== "APPLICATION_COMMAND") return
			if (!i.guild) {
				return await i.reply({
					embeds: [
						{
							description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=280576&scope=bot%20applications.commands) me to a server to use my commands!**`,
							color: orange,
						}
					],
				})
			}
			if (BLACKLIST_USERS.includes(i.user.id)) return

			const guilds = db.collection("Guilds")
			let guildExists = await guilds.findOne({
				guildID: i.guildId
			})

			if (!guildExists) {
				await guildCreate.run(client, db, i.member.guild)

				guildExists = await guilds.findOne({
					guildID: i.guildId
				})

				if (!guildExists) return console.log("Guild not in database, and could not be added.")

				console.log(`Guild not found, but updated! ${i.member.guild.id}`)
			}

			const { error, color, onlyShowToUser } = validate(i, guildExists.channels, client)

			if (error) {
				return await i.reply({
					embeds: [
						{
							description: error,
							color: color,
						}
					],
					ephemeral: onlyShowToUser,
				})
			}

			const { disabled, run } = i.client.commands.get(i.commandName)

			if (disabled) {
				return await i.reply({
					embeds: [
						{
							description: ":tools: **This command has been temporarily disabled**.",
							color: orange,
						}
					],
					ephemeral: onlyShowToUser,
				})
			}

			await i.deferReply()

			await run(i, db, client)

			const options = i.options._hoistedOptions.length > 0 ? `\n${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join("\n")}` : "*None*"

			logToSupportServer(client, {
				title: `__/${i.commandName}__`,
				description: `**User**: ${i.user.username}#${i.user.discriminator} (${i.user.id})\n**Guild**: ${i.member.guild.name} (${i.member.guild.id})\n\n**Options**: ${options}\n\n**Deferred**: ${i.deferred}\n**Replied**: ${i.replied}`,
				color: pink,
			})
		}
		catch (e) {
			console.log(e)
			console.log(i)

			logToSupportServer(client, {
				description: `**${e.name}**: ${e.message}`,
				color: red,
			})

			return
		}
	},
}