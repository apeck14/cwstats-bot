const { orange, red } = require("../static/colors.js")
const validate = require("../util/validate.js")

module.exports = {
	event: "interactionCreate",
	run: async (client, db, i) => {
		console.time()
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
			const guilds = db.collection("Guilds")
			const { channels } = await guilds.findOne({ guildID: i.guildId })
			const { error, color, onlyShowToUser } = validate(i, channels, client)

			await i.deferReply()

			console.timeEnd()

			if (error) {
				return i.editReply({
					embeds: [
						{
							description: error,
							color: color,
						},
					],
					ephemeral: onlyShowToUser,
				})
			}

			await i.client.commands.get(i.commandName).run(i, db, client)
		} catch (e) {
			if (e instanceof Error && client.isReady()) {
				console.log("---UNEXPECTED INTERACTION ERROR---")
				console.log("Command:", i?.commandName)
				console.log("User:", `${i?.user.username}#${i?.user.discriminator}`)
				console.log("Guild:", `${i?.guild.name} (${i?.guild.id})`)
				console.log("Options:", i?.options?._hoistedOptions.map((o) => `\n${o.name}: ${o.value}`).join(""))
				console.log(e)
			}

			const errEmbed = {
				description: typeof e === "string" ? e : `**Unexpected error.**`,
				color: red,
				footer: {
					text: typeof e === "string" ? "" : "If this problem persists, join the Support Server.",
				},
			}

			if (i?.replied || i?.deferred) return i.editReply({ embeds: [errEmbed], ephemeral: true })

			return i.reply({ embeds: [errEmbed], ephemeral: true })
		}
	},
}
