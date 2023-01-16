const { pink } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
	data: {
		name: "info",
		description: "View server stats and abbreviations.",
	},
	run: async (i, db, client) => {
		const guilds = db.collection("Guilds")

		const { abbreviations, channels } = await guilds.findOne({
			guildID: i.channel.guild.id
		})
		const { commandChannelID, applyChannelID, applicationsChannelID } = channels
		const cmdChnl = commandChannelID ? `<#${commandChannelID}>` : "N/A"
		const applyChnl = applyChannelID ? `<#${applyChannelID}>` : "N/A"
		const appChnl = applicationsChannelID ? `<#${applicationsChannelID}>` : "N/A"

		const embed = {
			description: "",
			color: pink,
			footer: {
				text: "Developed By: Apehk\nLogo By: Garebear",
			},
		}

		embed.description += `**__Server Info__**\n**Command Channel**: ${cmdChnl}\n**Apply Channel**: ${applyChnl}\n**Applications Channel**: ${appChnl}`

		if (abbreviations?.length > 0) {
			embed.description += `\n**Abbreviations**: ${abbreviations
				.sort((a, b) => a.abbr.localeCompare(b.abbr))
				.map((a) => `\n• \`${a.abbr}\`: ${formatStr(a.name)}`)
				.join("")}`
		}

		return i.editReply({
			embeds: [embed]
		})
	},
}