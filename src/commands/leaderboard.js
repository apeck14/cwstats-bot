const { pink, orange } = require("../static/colors")
const { formatStr } = require("../util/formatting")
const { getEmoji, getClanBadge } = require("../util/functions")
const locations = require("../static/locations")

module.exports = {
	data: {
		name: "leaderboard",
		description: "View current avg. fame leaderboard from top war clans.",
		options: [
			{
				type: 3,
				name: "location",
				description: "Select a local leaderboard",
				required: false,
				choices: locations
					.filter((l) => l.isAdded)
					.map((l) => ({
						name: l.name,
						value: l.name,
					})),
			},
		],
	},
	run: async (i, db, client) => {
		const dailyLb = db.collection("Daily Clan Leaderboard")
		const statistics = db.collection("Statistics")
		const iName = i.options.getString("location")
		const leaderboard = await dailyLb
			.find(iName ? { "location.name": iName } : {})
			.sort({ fameAvg: -1, rank: 1 })
			.limit(10)
			.toArray()

		if (leaderboard.length === 0)
			return i.editReply({
				embeds: [
					{
						color: orange,
						description: "**No data to show!** Try again when war has begun!",
					},
				],
			})

		const { lbLastUpdated } = (await statistics.find({}).toArray())[0]
		const now = Date.now()
		const diffInMins = Math.round((now - lbLastUpdated) / 1000 / 60)

		const embed = {
			title: `**__${iName ?? "Global"} War Leaderboard__**`,
			description: "",
			footer: {
				text: `Last Updated: ${diffInMins}m ago`,
			},
			thumbnail: {
				url: "https://i.imgur.com/VAPR8Jq.png",
			},
			color: pink,
		}

		const fameAvgEmoji = getEmoji(client, "fameAvg")
		const decksRemainingEmoji = getEmoji(client, "decksRemaining")

		for (let i = 0; i < leaderboard.length; i++) {
			const clan = leaderboard[i]
			const url = `https://www.cwstats.com/clans/${clan.tag.substring(1)}/riverrace`
			const badgeName = getClanBadge(clan.badgeId, clan.clanScore)
			const badgeEmoji = getEmoji(client, badgeName)

			embed.description += `**${i + 1}. ${badgeEmoji} [${formatStr(clan.name)}](${url})**\n`
			embed.description += `${fameAvgEmoji} **${clan.fameAvg.toFixed(1)}** ${decksRemainingEmoji} ${
				clan.decksRemaining
			} :earth_americas: #${clan.rank}\n`
		}

		return i.editReply({ embeds: [embed] })
	},
}
