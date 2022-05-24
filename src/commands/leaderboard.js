const { pink, orange } = require("../static/colors")
const { formatStr } = require("../util/formatting")
const { getEmoji, getClanBadge } = require("../util/functions")
const locations = require("../static/locations")
const { isNumber } = require("lodash")

module.exports = {
	data: {
		name: "leaderboard",
		description: "View current avg. fame leaderboard from top war clans.",
		options: [
			{
				type: 3,
				name: "location",
				description: "Filter by location",
				required: false,
				choices: locations
					.filter((l) => l.isAdded)
					.map((l) => ({
						name: l.name,
						value: l.name,
					}))
					.sort((a, b) => b.name - a.name),
			},
			{
				type: 3,
				name: "league",
				description: "Filter by league",
				required: false,
				choices: [
					{ name: "4000+", value: "4000+" },
					{ name: "5000+", value: "5000+" },
				],
			},
		],
	},
	run: async (i, db, client) => {
		const dailyLb = db.collection("Daily Clan Leaderboard")
		const statistics = db.collection("Statistics")
		const iName = i.options.getString("location")
		const iLeague = i.options.getString("league")

		const location = locations.find((l) => l.name === iName)
		const maxTrophies = parseInt(iLeague?.slice(0, -1)) + 1000

		const query = {}
		if (iName) query["location.name"] = iName
		if (maxTrophies) query["clanScore"] = { $lt: maxTrophies, $gte: maxTrophies - 1000 }

		const leaderboard = await dailyLb.find(query).sort({ fameAvg: -1, rank: 1 }).limit(10).toArray()

		if (leaderboard.length === 0)
			return i.editReply({
				embeds: [
					{
						color: orange,
						description: "**No clans found!**",
					},
				],
			})

		const { lbLastUpdated } = (await statistics.find({}).toArray())[0]
		const now = Date.now()
		const diffInMins = Math.round((now - lbLastUpdated) / 1000 / 60)

		const embed = {
			title: `**__Daily War Leaderboard__**`,
			description: "",
			footer: {
				text: `Last Updated: ${diffInMins}m ago`,
			},
			thumbnail: {
				url: "https://i.imgur.com/VAPR8Jq.png",
			},
			color: pink,
		}

		const fameAvgEmoji = getEmoji("fameAvg")
		const decksRemainingEmoji = getEmoji("decksRemaining")

		embed.description += `**Location**: ${location?.key || "Global"} ${location?.flagEmoji || ":earth_americas:"}\n`
		embed.description += `**League**: ${maxTrophies ? `${(maxTrophies - 1000) / 1000}k` : "All"}\n\n`

		for (let i = 0; i < leaderboard.length; i++) {
			const clan = leaderboard[i]
			const url = `https://www.cwstats.com/clans/${clan.tag.substring(1)}/riverrace`
			const badgeName = getClanBadge(clan.badgeId, clan.clanScore)
			const badgeEmoji = getEmoji(badgeName)

			embed.description += `**${i + 1}. ${badgeEmoji} [${formatStr(clan.name)}](${url})**\n`
			embed.description += `${fameAvgEmoji} **${clan.fameAvg.toFixed(1)}** ${decksRemainingEmoji} ${clan.decksRemaining} :earth_americas: ${
				isNumber(clan.rank) ? `#${clan.rank}` : clan.rank
			}\n`
		}

		return i.editReply({ embeds: [embed] })
	},
}
