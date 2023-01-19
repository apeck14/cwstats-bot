const { BLACKLIST_USERS } = require("../static/blacklist.js")
const { orange, pink } = require("../static/colors.js")
const { logToSupportServer } = require("../util/logging.js")
const { validate } = require("../util/validate.js")
const guildCreate = require("./guildCreate")

module.exports = {
	event: "interactionCreate",
	run: async (client, db, i) => {
		try {
			if (!i || !i.isCommand()) return

			if (BLACKLIST_USERS.includes(i.user.id)) return

			if (!i.guild) {
				return i.reply({
					embeds: [
						{
							description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=280576&scope=bot%20applications.commands) me to a server to use my commands!**`,
							color: orange,
						}
					],
				})
			}

			await i.deferReply()

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
				return i.editReply({
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
				return i.editReply({
					embeds: [
						{
							description: ":tools: **This command has been temporarily disabled**.",
							color: orange,
						}
					],
					ephemeral: onlyShowToUser,
				})
			}

			//if a user @'s themselves
			if (i.options._hoistedOptions.find((o) => o.type === "USER")?.value === i.user.id)
				await i.followUp(`:white_check_mark: **No need to @ yourself since you have a tag linked!**`)

			run(i, db, client)

			const hasOptions = i.options._hoistedOptions.length > 0
			let options = "*None*"

			if (hasOptions)
				options = "\n" + i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join("\n")

			const { username, discriminator, id } = i.user
			const { guild } = i.member

			logToSupportServer(client, {
				title: `__/${i.commandName}__`,
				description: `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guild.name} (${guild.id})\n\n**Options**: ${options}\n\n**Deferred**: ${i.deferred}\n**Replied**: ${i.replied}`,
				color: pink,
			})
		}
		catch (e) {
			console.log(e)
			console.log(e?.requestBody?.json)

			return
		}
	},
}