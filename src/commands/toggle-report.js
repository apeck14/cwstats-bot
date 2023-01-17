const { green } = require("../static/colors")
const { errorMsg } = require("../util/functions")

module.exports = {
	data: {
		name: "toggle-report",
		description: "Turn on/off daily war report.",
		userPermissions: ["MANAGE_GUILD"],
	},
	run: async (i, db, client) => {
		const guilds = db.collection("Guilds")

		const guild = await guilds.findOne({
			guildID: i.guildId
		})

		if (!guild.warReport)
			return errorMsg(i, "❌ You must schedule a daily war report first. Use **/schedule-report**.")

		const { enabled } = guild.warReport

		guilds.updateOne(guild, {
			$set: {
				"warReport.enabled": !enabled,
			},
		})

		return i.editReply({
			embeds: [
				{
					description: `✅ Daily war report successfully **${!enabled ? "enabled" : "disabled"}**!`,
					color: green,
				}
			],
		})
	},
}