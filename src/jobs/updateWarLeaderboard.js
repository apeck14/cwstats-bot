const { getGlobalWarLeaderboard, getRiverRace } = require("../util/api");
const { getAvgFame } = require('../util/raceFunctions')

module.exports = {
    expression: '0 0 * * * *', //run every hour
    run: async (client, db) => {
        const dailyLb = db.collection('Daily Clan Leaderboard');

        //get average fame for top 100 global war clans
        //reduce total api requests by looking at all clans in race
        //if clan already has data found from a previous race, dont make an api request

        await dailyLb.deleteMany({});

        const top100ClanAverages = await getGlobalWarLeaderboard().catch(() => { });
        if (!top100ClanAverages) return;

        for (const c of top100ClanAverages) {
            if (c.fameAvg) continue; //if fame Avg already set

            const race = await getRiverRace(c.tag).catch(() => { });
            if (!race) continue;

            const isColosseum = race.periodType === "colosseum";
            const dayOfWeek = race.periodIndex % 7; // 0-6 (0,1,2 TRAINING, 3,4,5,6 BATTLE)

            for (const cl of race.clans) { //set fameAvg for all clans in race
                const clan = top100ClanAverages.find(cla => cla.tag === cl.tag);
                if (!clan || clan.fameAvg) continue;

                clan.fameAvg = getAvgFame(cl, isColosseum, dayOfWeek);
                clan.decksRemaining = 200 - cl.participants.reduce((a, b) => a + b.decksUsedToday, 0);
            }
        }

        dailyLb.insertMany(top100ClanAverages);

        console.log('Daily LB updated!')
    }
}