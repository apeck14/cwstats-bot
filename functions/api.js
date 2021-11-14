const axios = require("axios");
const API_KEY = require('../token');
const { formatTag } = require("./util");

module.exports = {
    ApiRequest: async (endpoint, tag, clansOrPlayers, tagsOnly = false) => {
        let url;
        tag = formatTag(tag);

        if (endpoint === '') {
            if (clansOrPlayers === 'players') {
                url = `https://proxy.royaleapi.dev/v1/players/%23${tag}`;
                let player = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + API_KEY.token() } });

                if (player) {
                    player = player.data;
                    const classicChallBadge = player.badges.filter(b => b.name === "Classic12Wins");
                    const grandChallBadge = player.badges.filter(b => b.name === "Grand12Wins");
                    const classicChallWins = classicChallBadge.length === 1 ? classicChallBadge[0].progress : 0;
                    const grandChallWins = grandChallBadge.length === 1 ? grandChallBadge[0].progress : 0;

                    return {
                        name: player.name,
                        tag: player.tag,
                        clan: {
                            name: player.clan?.name || null,
                            tag: player.clan?.tag || null
                        },
                        level: player.expLevel,
                        pb: player.bestTrophies,
                        warWins: player.warDayWins,
                        mostChallWins: player.challengeMaxWins,
                        challWins: classicChallWins,
                        grandChallWins: grandChallWins,
                        cards: player.cards.map(c => ({ name: c.name, level: c.level, maxLevel: c.maxLevel, count: c.count }))
                    }
                }
            }
            else if (clansOrPlayers === 'clans') url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}`;
        }
        else if (endpoint === 'currentriverrace') url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`;
        else if (endpoint === 'members') {
            url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/members`;
            let members = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + API_KEY.token() } });

            if (tagsOnly) return members.data.items.map(p => p.tag);
            return members.data.items;
        }
        else if (endpoint === 'riverracelog') url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/riverracelog`;
        else if (endpoint === 'upcomingchests') url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/upcomingchests`;

        const req = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + API_KEY.token() } });
        return req.data?.items || req.data || req;
    }
}