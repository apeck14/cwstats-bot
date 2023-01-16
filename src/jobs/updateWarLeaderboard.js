const { uniqBy } = require("lodash")
const { getWarLeaderboard, getRiverRace } = require("../util/api")
const { getAvgFame } = require("../util/raceFunctions")
const locations = require("../static/locations")
const { logToSupportServer } = require("../util/logging")
const { green } = require("../static/colors")

module.exports = {
	expression: "*/30 * * * *", //every 30 mins
	run: async (client, db) => {
		const dailyLb = db.collection("Daily Clan Leaderboard")
		const statistics = db.collection("Statistics")

		//top 100 global
		//top 50 local

		//get average fame for top 100 global war clans
		//reduce total api requests by looking at all clans in race
		//if clan already has data found from a previous race, dont make an api request

		const lbIDs = locations.filter((l) => l.isAdded || l.name === "Global").map((l) => l.id)

		const lbPromises = lbIDs.map((id) => getWarLeaderboard(id === "global" ? 100 : 50, id))
		const allLbs = await Promise.all(lbPromises)

		const { data: allGlobalRankedClans, error: allGlobalRankedError } = await getWarLeaderboard(1000)

		if (allLbs.some((lb) => lb.error) || allGlobalRankedError) return console.log("Error while updating leaderboard!")

		const allClans = uniqBy(allLbs.map((lb) => lb.data).flat(), "tag").filter((c) => c.clanScore >= 4000)

		for (const c of allClans) {
			if (c.fameAvg) continue //if fame Avg already set

			const { data: race, error } = await getRiverRace(c.tag)

			if (error) continue

			const isColosseum = race.periodType === "colosseum"
			const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

			for (const cl of race.clans) {
				//set fameAvg for all clans in race
				if (cl.clanScore < 4000) continue

				const clan = allClans.find((cla) => cla.tag === cl.tag)
				if (!clan || clan.fameAvg) continue

				clan.fameAvg = getAvgFame(cl, isColosseum, dayOfWeek)
				clan.decksRemaining = 200 - cl.participants.reduce((a, b) => a + b.decksUsedToday, 0)
				clan.rank = allGlobalRankedClans.find((cla) => cla.tag === cl.tag)?.rank || "N/A"
			}
		}

		if (allClans.length > 0) {
			await dailyLb.deleteMany({})
			statistics.updateOne({}, {
				$set: {
					lbLastUpdated: Date.now()
				}
			})
			console.log("Current lb deleted!")
			dailyLb.insertMany(allClans)
			console.log("Daily LB updated!")
		}

		logToSupportServer(client, {
			description: "**Daily leaderboard updated!**",
			color: green,
		})
	},
}