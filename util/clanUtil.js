const { request } = require('./otherUtil');

const clanUtil = {
    /**
     * Get array of members from a clan
     * @param {String} tag - clan tag
     * @param {*} tagsOnly - return array of player tags only
     * @param {*} namesOnly - return array of player names only
     * @returns {Array} - array of player tags/names of members
     */
    getMembers: async (tag, tagsOnly = false, namesOnly = false) => {
        try {
            tag = (tag[0] === `#`) ? tag.substr(1) : tag;
            const mem = await request(`https://proxy.royaleapi.dev/v1/clans/%23${tag}/members`);
    
            //only player tags
            if(tagsOnly === true && namesOnly === false) return mem.items.map(p => p.tag);
            //only player names
            else if(namesOnly === true && tagsOnly === false) return mem.items.map(p => p.name);
            //both names and tags
            return mem.items.map(p => ({ tag: p.tag, name: p.name }));
        } catch(e) {
            return [];
        }
    },
    /**
     * Get basic data of any player
     * @param {String} tag - Clash Royale tag of player
     * @returns {Object} - Info about player (name, tag, clan, level, cards, warWins, etc)
     */
    getPlayerData: async tag => {
        try{
            tag = tag[0] === "#" ? tag.substr(1) : tag;
            const player = await request(`https://proxy.royaleapi.dev/v1/players/%23${tag}`);

            const classicChallBadge = player.badges.filter(b => b.name === "Classic12Wins");
            const grandChallBadge = player.badges.filter(b => b.name === "Grand12Wins");
            const classicChallWins = classicChallBadge.length === 1 ? classicChallBadge[0].progress : 0;
            const grandChallWins = grandChallBadge.length === 1 ? grandChallBadge[0].progress : 0;

            return {
                name: player.name,
                tag: player.tag,
                clan: player.clan ? player.clan.name : 'None',
                level: player.expLevel,
                pb: player.bestTrophies,
                cards: player.cards,
                warWins: player.warDayWins,
                mostChallWins: player.challengeMaxWins,
                challWins: classicChallWins,
                grandChallWins: grandChallWins
            }

        } catch (e) {
            return false;
        }
    },
    /**
     * Check if clan bio contains 'top.gg/CW2Stats'
     * @param {String} tag - Clan tag
     * @returns {Boolean}
     */
    verifyClanBio: async tag => {
        if(typeof tag !== 'string') return false;
        
        const {description} = await request(`https://proxy.royaleapi.dev/v1/clans/%23${(tag[0] === '#') ? tag.substr(1) : tag}`);
        
        return (description.toLowerCase().indexOf('top.gg/cw2stats') === -1) ? false : true;
    }
}

module.exports = clanUtil;