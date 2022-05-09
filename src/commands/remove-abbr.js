const { red, green } = require("../static/colors")
const { formatStr } = require("../util/formatting")

module.exports = {
	data: {
		name: "remove-abbr",
		description: "Remove a clan abbreviation.",
		options: [
			{
				type: 3,
				name: "abbr",
				description: "Abbreviation to delete",
				required: true,
			},
		],
		userPermissions: ["MANAGE_GUILD"],
	},
	run: async (i, db) => {
		const guilds = db.collection("Guilds")
		const statistics = db.collection("Statistics")
		const { abbreviations } = await guilds.findOne({ guildID: i.channel.guild.id })

		const abbreviation = i.options.getString("abbr")
		const abbrExists = abbreviations.find((a) => a.abbr === abbreviation)

		if (!abbrExists)
			return i.editReply({
				embeds: [{ description: `\`${abbreviation}\` **is not a set abbreivation.**`, color: red }],
				ephemeral: true,
			})

		statistics.updateOne({}, { $inc: { totalAbbreviations: -1 } })
		await guilds.updateOne({ guildID: i.channel.guild.id }, { $pull: { abbreviations: { abbr: abbreviation } } })

		return i.editReply({
			embeds: [
				{
					title: "✅ Abbreviation Removed!",
					description: `**Clan**: ${formatStr(abbrExists.name)}\n**Tag**: ${
						abbrExists.tag
					}\n**Abbreviation**: \`${abbreviation}\``,
					color: green,
				},
			],
		})
	},
}
