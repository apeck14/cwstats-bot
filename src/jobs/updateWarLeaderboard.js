const { getWarLeaderboard, getRiverRace } = require("../util/api")
const { getAvgFame } = require("../util/raceFunctions")

module.exports = {
	expression: "0 0 * * * *", //run every hour at :30
	run: async (client, db) => {
		const dailyLb = db.collection("Daily Clan Leaderboard")
		const statistics = db.collection("Statistics")

		//get average fame for top 100 global war clans
		//reduce total api requests by looking at all clans in race
		//if clan already has data found from a previous race, dont make an api request

		const { data: top100ClanAverages, error: lbError } = await getWarLeaderboard()
		if (lbError) return

		for (const c of top100ClanAverages) {
			if (c.fameAvg) continue //if fame Avg already set

			const { data: race, error: raceError } = await getRiverRace(c.tag)
			if (raceError) continue

			const isColosseum = race.periodType === "colosseum"
			const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

			for (const cl of race.clans) {
				//set fameAvg for all clans in race
				const clan = top100ClanAverages.find((cla) => cla.tag === cl.tag)
				if (!clan || clan.fameAvg) continue

				clan.fameAvg = getAvgFame(cl, isColosseum, dayOfWeek)
				clan.decksRemaining = 200 - cl.participants.reduce((a, b) => a + b.decksUsedToday, 0)
			}

			statistics.updateOne({}, { $set: { lbLastUpdated: Date.now() } })
		}

		if (top100ClanAverages.length > 0) {
			await dailyLb.deleteMany({})
			dailyLb.insertMany(top100ClanAverages)
			console.log("Daily LB updated!")
		}
	},
}
