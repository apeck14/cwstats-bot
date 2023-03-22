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

		const trackedIDs = locations.filter((l) => l.isAdded || l.name === "Global").map((l) => l.id)

		const lbPromises = trackedIDs.map((id) => getWarLeaderboard(id === "global" ? 100 : 75, id))
		const allLbs = await Promise.all(lbPromises)

		const { data: allGlobalRankedClans, error: allGlobalRankedError } = await getWarLeaderboard(1000)

		if (allLbs.some((lb) => lb.error) || allGlobalRankedError) return console.log("Error while updating leaderboard!")

		const clansToCheckRaces = uniqBy(allLbs.map((lb) => lb.data).flat(), "tag").filter((c) => c.clanScore >= 4000)

		const clanAverages = []

		for (const c of clansToCheckRaces) {
			if (clanAverages.find(cl => cl.tag === c.tag)) continue

			const { data: race, error } = await getRiverRace(c.tag)

			if (error) continue

			const isColosseum = race.periodType === "colosseum"
			const dayOfWeek = race.periodIndex % 7 // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

			for (const cl of race.clans) {
				//set fameAvg for all clans in race
				if (cl.clanScore < 4000) continue

				const globalClanRank = allGlobalRankedClans.findIndex((cla) => cla.tag === cl.tag)

				if (cl.tag === c.tag) {
					clanAverages.push({
						...c,
						fameAvg: getAvgFame(cl, isColosseum, dayOfWeek),
						decksRemaining: 200 - cl.participants.reduce((a, b) => a + b.decksUsedToday, 0),
						rank: globalClanRank === -1 ? "N/A" : globalClanRank + 1
					})
					continue
				}

				if (globalClanRank === -1) continue

				const clan = clanAverages.find(c => c.tag === cl.tag)
				if (clan) continue

				clanAverages.push({
					...allGlobalRankedClans[globalClanRank],
					fameAvg: getAvgFame(cl, isColosseum, dayOfWeek),
					decksRemaining: 200 - cl.participants.reduce((a, b) => a + b.decksUsedToday, 0),
					rank: globalClanRank + 1
				})
			}
		}

		if (clanAverages.length > 0) {
			await dailyLb.deleteMany({})
			statistics.updateOne({}, {
				$set: {
					lbLastUpdated: Date.now()
				}
			})
			console.log("Current lb deleted!")
			dailyLb.insertMany(clanAverages)
			console.log("Daily LB updated!")
		}

		logToSupportServer(client, {
			description: "**Daily leaderboard updated!**",
			color: green,
		})
	},
}