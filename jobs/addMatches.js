const axios = require('axios');
const mongo = require('../mongo');

(async () => {
    await mongo.init();

    const db = mongo.db;
    const warLog = db.collection('War Log');

    const API_KEY = process.env.job_token;

    const locations = [
        { name: 'France', id: 57000087 },
        { name: 'Turkey', id: 57000239 },
        { name: 'Spain', id: 57000218 },
        { name: 'Italy', id: 57000120 },
        { name: 'China', id: 57000056 },
        { name: 'Japan', id: 57000122 },
        { name: 'Germany', id: 57000094 },
        { name: 'Romania', id: 57000192 },
        { name: 'Mexico', id: 57000153 },
        { name: 'Denmark', id: 57000071 },
        { name: 'Hong Kong', id: 57000110 },
        { name: 'Portugal', id: 57000188 },
        { name: 'United States', id: 57000249 },
        { name: 'International', id: 57000006 },
        { name: 'Argentina', id: 57000017 },
        { name: 'Brazil', id: 57000038 },
        { name: 'Russia', id: 57000193 },
        { name: 'Peru', id: 57000184 },
        { name: 'Netherlands', id: 57000166 },
        { name: 'United Kingdom', id: 57000248 },
        { name: 'Iran', id: 57000115 },
        { name: 'Guatemala', id: 57000102 },
        { name: 'Saudi Arabia', id: 57000204 },
        { name: 'Colombia', id: 57000059 },
        { name: 'Canada', id: 57000047 },
        { name: 'India', id: 57000113 },
        { name: 'Australia', id: 57000021 },
        { name: 'North America', id: 57000001 }
    ]
    const locationId = locations[Math.floor(Math.random() * locations.length)].id;

    const warLeaderboardByLocation = (await axios.get(`https://proxy.royaleapi.dev/v1/locations/${locationId}/rankings/clanwars`, { headers: { 'Authorization': 'Bearer ' + API_KEY } })).data.items;
    const legendary2Clans = warLeaderboardByLocation.filter(c => c.clanScore >= 4000 && c.clanScore < 5000).length;
    const clanTag = warLeaderboardByLocation[Math.floor(Math.random() * legendary2Clans)].tag;

    const clan = (await axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}`, { headers: { 'Authorization': 'Bearer ' + API_KEY } })).data;

    let matchesAdded = 0;

    for (const p of clan.memberList) {
        let [player, playerLog] = await Promise.all([
            axios.get(`https://proxy.royaleapi.dev/v1/players/%23${p.tag.substr(1)}`, { headers: { 'Authorization': 'Bearer ' + API_KEY } }),
            axios.get(`https://proxy.royaleapi.dev/v1/players/%23${p.tag.substr(1)}/battlelog`, { headers: { 'Authorization': 'Bearer ' + API_KEY } })
        ]);

        player = player.data;
        playerLog = playerLog.data;

        for (const m of playerLog) {
            if (m.type !== 'riverRacePvP' && m.type !== 'riverRaceDuel') continue;

            let [opponent, opponentClan] = await Promise.all([
                axios.get(`https://proxy.royaleapi.dev/v1/players/%23${m.opponent[0].tag.substr(1)}`, { headers: { 'Authorization': 'Bearer ' + API_KEY } }),
                axios.get(`https://proxy.royaleapi.dev/v1/clans/%23${m.opponent[0].clan.tag.substr(1)}`, { headers: { 'Authorization': 'Bearer ' + API_KEY } })
            ]);

            opponent = opponent.data;
            opponentClan = opponentClan.data;

            const avgCardLevel = (cards) => {
                let sum = 0;

                for (const c of cards) sum += 14 - (c.maxLevel - c.level);

                return sum / cards.length;
            }

            const match = {
                timestamp: m.battleTime,
                player1: {
                    name: player.name,
                    tag: player.tag,
                    level: player.expLevel,
                    trophies: player.trophies,
                    pb: player.bestTrophies,
                    avgCardLevel: avgCardLevel(player.cards),
                    cw1Wins: player.warDayWins,
                    clan: {
                        name: clan.name,
                        tag: clan.tag,
                        warTrophies: clan.clanWarTrophies,
                        score: clan.clanScore
                    }
                },
                player2: {
                    name: opponent.name,
                    tag: opponent.tag,
                    level: opponent.expLevel,
                    trophies: opponent.trophies,
                    pb: opponent.bestTrophies,
                    avgCardLevel: avgCardLevel(opponent.cards),
                    cw1Wins: opponent.warDayWins,
                    clan: {
                        name: opponentClan.name,
                        tag: opponentClan.tag,
                        warTrophies: opponentClan.clanWarTrophies,
                        score: opponentClan.clanScore
                    }
                }
            }

            warLog.insertOne(match)
            matchesAdded++;
        }
    }

    console.log(`${matchesAdded} matches added!`)

})();