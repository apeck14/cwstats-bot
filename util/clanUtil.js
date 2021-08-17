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
            if (tagsOnly === true && namesOnly === false) return mem.items.map(p => p.tag);
            //only player names
            else if (namesOnly === true && tagsOnly === false) return mem.items.map(p => p.name);
            //both names and tags
            return mem.items.map(p => ({ tag: p.tag, name: p.name }));
        } catch (e) {
            return [];
        }
    },
    /**
     * Get basic data of any player
     * @param {String} tag - Clash Royale tag of player
     * @returns {Object} - Info about player (name, tag, clan, level, cards, warWins, etc)
     */
    getPlayerData: async tag => {
        try {
            tag = tag[0] === "#" ? tag.substr(1) : tag;
            const player = await request(`https://proxy.royaleapi.dev/v1/players/%23${tag}`);

            const classicChallBadge = player.badges.filter(b => b.name === "Classic12Wins");
            const grandChallBadge = player.badges.filter(b => b.name === "Grand12Wins");
            const classicChallWins = classicChallBadge.length === 1 ? classicChallBadge[0].progress : 0;
            const grandChallWins = grandChallBadge.length === 1 ? grandChallBadge[0].progress : 0;

            return {
                name: player.name,
                tag: player.tag,
                clan: player.clan?.name || null,
                clanTag: player.clan?.tag || null,
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
        if (typeof tag !== 'string') return false;

        const { description } = await request(`https://proxy.royaleapi.dev/v1/clans/%23${(tag[0] === '#') ? tag.substr(1) : tag}`);

        return (description.toLowerCase().indexOf('top.gg/cw2stats') === -1) ? false : true;
    },
    /**
     * Get file name for any clan's badge
     * @param {Number} badgeId 
     * @param {Number} trophyCount 
     * @returns name of badge file
     */
    getClanBadge: (badgeId, trophyCount, returnEmojiPath = true) => {
        if (badgeId === -1) return 'no_clan'; //no clan

        const badges = [
            {
                "name": "Flame_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_01_01",
                "category": "01_Symbol",
                "id": 16000000
            },
            {
                "name": "Flame_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_01_02",
                "category": "01_Symbol",
                "id": 16000001
            },
            {
                "name": "Flame_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_01_03",
                "category": "01_Symbol",
                "id": 16000002
            },
            {
                "name": "Flame_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_01_04",
                "category": "01_Symbol",
                "id": 16000003
            },
            {
                "name": "Sword_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_02_01",
                "category": "01_Symbol",
                "id": 16000004
            },
            {
                "name": "Sword_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_02_02",
                "category": "01_Symbol",
                "id": 16000005
            },
            {
                "name": "Sword_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_02_03",
                "category": "01_Symbol",
                "id": 16000006
            },
            {
                "name": "Sword_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_02_04",
                "category": "01_Symbol",
                "id": 16000007
            },
            {
                "name": "Bolt_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_03_01",
                "category": "01_Symbol",
                "id": 16000008
            },
            {
                "name": "Bolt_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_03_02",
                "category": "01_Symbol",
                "id": 16000009
            },
            {
                "name": "Bolt_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_03_03",
                "category": "01_Symbol",
                "id": 16000010
            },
            {
                "name": "Bolt_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_03_04",
                "category": "01_Symbol",
                "id": 16000011
            },
            {
                "name": "Crown_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_04_01",
                "category": "01_Symbol",
                "id": 16000012
            },
            {
                "name": "Crown_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_04_02",
                "category": "01_Symbol",
                "id": 16000013
            },
            {
                "name": "Crown_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_04_03",
                "category": "01_Symbol",
                "id": 16000014
            },
            {
                "name": "Crown_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_04_04",
                "category": "01_Symbol",
                "id": 16000015
            },
            {
                "name": "Arrow_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_05_01",
                "category": "01_Symbol",
                "id": 16000016
            },
            {
                "name": "Arrow_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_05_02",
                "category": "01_Symbol",
                "id": 16000017
            },
            {
                "name": "Arrow_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_05_03",
                "category": "01_Symbol",
                "id": 16000018
            },
            {
                "name": "Arrow_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_05_04",
                "category": "01_Symbol",
                "id": 16000019
            },
            {
                "name": "Diamond_Star_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_06_01",
                "category": "01_Symbol",
                "id": 16000020
            },
            {
                "name": "Diamond_Star_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_06_02",
                "category": "01_Symbol",
                "id": 16000021
            },
            {
                "name": "Diamond_Star_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_06_03",
                "category": "01_Symbol",
                "id": 16000022
            },
            {
                "name": "Diamond_Star_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_06_04",
                "category": "01_Symbol",
                "id": 16000023
            },
            {
                "name": "Skull_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_01",
                "category": "01_Symbol",
                "id": 16000024
            },
            {
                "name": "Skull_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_02",
                "category": "01_Symbol",
                "id": 16000025
            },
            {
                "name": "Skull_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_03",
                "category": "01_Symbol",
                "id": 16000026
            },
            {
                "name": "Skull_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_04",
                "category": "01_Symbol",
                "id": 16000027
            },
            {
                "name": "Skull_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_05",
                "category": "01_Symbol",
                "id": 16000028
            },
            {
                "name": "Skull_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_07_06",
                "category": "01_Symbol",
                "id": 16000029
            },
            {
                "name": "Moon_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_08_01",
                "category": "01_Symbol",
                "id": 16000030
            },
            {
                "name": "Moon_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_08_02",
                "category": "01_Symbol",
                "id": 16000031
            },
            {
                "name": "Moon_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_08_03",
                "category": "01_Symbol",
                "id": 16000032
            },
            {
                "name": "Pine_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_09_01",
                "category": "01_Symbol",
                "id": 16000033
            },
            {
                "name": "Pine_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_09_02",
                "category": "01_Symbol",
                "id": 16000034
            },
            {
                "name": "Pine_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_09_03",
                "category": "01_Symbol",
                "id": 16000035
            },
            {
                "name": "Traditional_Star_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_01",
                "category": "01_Symbol",
                "id": 16000036
            },
            {
                "name": "Traditional_Star_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_02",
                "category": "01_Symbol",
                "id": 16000037
            },
            {
                "name": "Traditional_Star_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_03",
                "category": "01_Symbol",
                "id": 16000038
            },
            {
                "name": "Traditional_Star_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_04",
                "category": "01_Symbol",
                "id": 16000039
            },
            {
                "name": "Traditional_Star_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_05",
                "category": "01_Symbol",
                "id": 16000040
            },
            {
                "name": "Traditional_Star_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_10_06",
                "category": "01_Symbol",
                "id": 16000041
            },
            {
                "name": "Star_Shine_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_11_01",
                "category": "01_Symbol",
                "id": 16000042
            },
            {
                "name": "Star_Shine_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_11_02",
                "category": "01_Symbol",
                "id": 16000043
            },
            {
                "name": "Star_Shine_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_11_03",
                "category": "01_Symbol",
                "id": 16000044
            },
            {
                "name": "Diamond_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_12_01",
                "category": "01_Symbol",
                "id": 16000045
            },
            {
                "name": "Diamond_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_12_02",
                "category": "01_Symbol",
                "id": 16000046
            },
            {
                "name": "Diamond_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_12_03",
                "category": "01_Symbol",
                "id": 16000047
            },
            {
                "name": "flag_a_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_13_01",
                "category": "02_Flag",
                "id": 16000048
            },
            {
                "name": "flag_a_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_13_02",
                "category": "02_Flag",
                "id": 16000049
            },
            {
                "name": "flag_a_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_13_03",
                "category": "02_Flag",
                "id": 16000050
            },
            {
                "name": "flag_b_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_14_01",
                "category": "02_Flag",
                "id": 16000051
            },
            {
                "name": "flag_b_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_14_02",
                "category": "02_Flag",
                "id": 16000052
            },
            {
                "name": "flag_b_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_14_03",
                "category": "02_Flag",
                "id": 16000053
            },
            {
                "name": "flag_c_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_01",
                "category": "02_Flag",
                "id": 16000054
            },
            {
                "name": "flag_c_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_02",
                "category": "02_Flag",
                "id": 16000055
            },
            {
                "name": "flag_c_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_03",
                "category": "02_Flag",
                "id": 16000056
            },
            {
                "name": "flag_c_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_04",
                "category": "02_Flag",
                "id": 16000057
            },
            {
                "name": "flag_c_07",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_05",
                "category": "02_Flag",
                "id": 16000058
            },
            {
                "name": "flag_c_08",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_15_06",
                "category": "02_Flag",
                "id": 16000059
            },
            {
                "name": "flag_d_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_01",
                "category": "02_Flag",
                "id": 16000060
            },
            {
                "name": "flag_d_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_02",
                "category": "02_Flag",
                "id": 16000061
            },
            {
                "name": "flag_d_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_03",
                "category": "02_Flag",
                "id": 16000062
            },
            {
                "name": "flag_d_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_04",
                "category": "02_Flag",
                "id": 16000063
            },
            {
                "name": "flag_d_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_05",
                "category": "02_Flag",
                "id": 16000064
            },
            {
                "name": "flag_d_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_16_06",
                "category": "02_Flag",
                "id": 16000065
            },
            {
                "name": "flag_f_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_17_01",
                "category": "02_Flag",
                "id": 16000066
            },
            {
                "name": "flag_f_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_17_02",
                "category": "02_Flag",
                "id": 16000067
            },
            {
                "name": "flag_g_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_18_01",
                "category": "02_Flag",
                "id": 16000068
            },
            {
                "name": "flag_g_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_18_02",
                "category": "02_Flag",
                "id": 16000069
            },
            {
                "name": "flag_i_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_19_01",
                "category": "02_Flag",
                "id": 16000070
            },
            {
                "name": "flag_i_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_19_02",
                "category": "02_Flag",
                "id": 16000071
            },
            {
                "name": "flag_h_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_01",
                "category": "02_Flag",
                "id": 16000072
            },
            {
                "name": "flag_h_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_02",
                "category": "02_Flag",
                "id": 16000073
            },
            {
                "name": "flag_h_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_03",
                "category": "02_Flag",
                "id": 16000074
            },
            {
                "name": "flag_j_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_21_01",
                "category": "02_Flag",
                "id": 16000075
            },
            {
                "name": "flag_j_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_21_02",
                "category": "02_Flag",
                "id": 16000076
            },
            {
                "name": "flag_j_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_21_03",
                "category": "02_Flag",
                "id": 16000077
            },
            {
                "name": "flag_k_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_01",
                "category": "02_Flag",
                "id": 16000078
            },
            {
                "name": "flag_k_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_02",
                "category": "02_Flag",
                "id": 16000079
            },
            {
                "name": "flag_k_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_03",
                "category": "02_Flag",
                "id": 16000080
            },
            {
                "name": "flag_k_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_04",
                "category": "02_Flag",
                "id": 16000081
            },
            {
                "name": "flag_k_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_05",
                "category": "02_Flag",
                "id": 16000082
            },
            {
                "name": "flag_k_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_22_06",
                "category": "02_Flag",
                "id": 16000083
            },
            {
                "name": "flag_l_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_23_01",
                "category": "02_Flag",
                "id": 16000084
            },
            {
                "name": "flag_l_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_23_02",
                "category": "02_Flag",
                "id": 16000085
            },
            {
                "name": "flag_l_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_23_03",
                "category": "02_Flag",
                "id": 16000086
            },
            {
                "name": "flag_m_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_24_01",
                "category": "02_Flag",
                "id": 16000087
            },
            {
                "name": "flag_m_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_24_02",
                "category": "02_Flag",
                "id": 16000088
            },
            {
                "name": "flag_m_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_24_03",
                "category": "02_Flag",
                "id": 16000089
            },
            {
                "name": "flag_n_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_01",
                "category": "02_Flag",
                "id": 16000090
            },
            {
                "name": "flag_n_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_02",
                "category": "02_Flag",
                "id": 16000091
            },
            {
                "name": "flag_n_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_03",
                "category": "02_Flag",
                "id": 16000092
            },
            {
                "name": "flag_n_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_04",
                "category": "02_Flag",
                "id": 16000093
            },
            {
                "name": "flag_n_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_05",
                "category": "02_Flag",
                "id": 16000094
            },
            {
                "name": "flag_n_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_25_06",
                "category": "02_Flag",
                "id": 16000095
            },
            {
                "name": "Twin_Peaks_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_27_04",
                "category": "01_Symbol",
                "id": 16000096
            },
            {
                "name": "Twin_Peaks_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_27_03",
                "category": "01_Symbol",
                "id": 16000097
            },
            {
                "name": "Gem_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_31_01",
                "category": "03_Royale",
                "id": 16000098
            },
            {
                "name": "Gem_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_31_02",
                "category": "03_Royale",
                "id": 16000099
            },
            {
                "name": "Gem_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_31_03",
                "category": "03_Royale",
                "id": 16000100
            },
            {
                "name": "Gem_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_31_04",
                "category": "03_Royale",
                "id": 16000101
            },
            {
                "name": "Coin_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_32_01",
                "category": "03_Royale",
                "id": 16000102
            },
            {
                "name": "Coin_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_32_02",
                "category": "03_Royale",
                "id": 16000103
            },
            {
                "name": "Coin_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_32_03",
                "category": "03_Royale",
                "id": 16000104
            },
            {
                "name": "Coin_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_32_04",
                "category": "03_Royale",
                "id": 16000105
            },
            {
                "name": "Elixir_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_43_01",
                "category": "03_Royale",
                "id": 16000106
            },
            {
                "name": "Elixir_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_43_02",
                "category": "03_Royale",
                "id": 16000107
            },
            {
                "name": "Heart_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_30_01",
                "category": "01_Symbol",
                "id": 16000108
            },
            {
                "name": "Heart_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_30_02",
                "category": "01_Symbol",
                "id": 16000109
            },
            {
                "name": "Heart_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_30_04",
                "category": "01_Symbol",
                "id": 16000110
            },
            {
                "name": "Heart_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_30_03",
                "category": "01_Symbol",
                "id": 16000111
            },
            {
                "name": "Tower_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_44_01",
                "category": "03_Royale",
                "id": 16000112
            },
            {
                "name": "Tower_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_44_02",
                "category": "03_Royale",
                "id": 16000113
            },
            {
                "name": "Tower_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_44_03",
                "category": "03_Royale",
                "id": 16000114
            },
            {
                "name": "Tower_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_44_04",
                "category": "03_Royale",
                "id": 16000115
            },
            {
                "name": "Fan_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_36_01",
                "category": "01_Symbol",
                "id": 16000116
            },
            {
                "name": "Fan_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_36_02",
                "category": "01_Symbol",
                "id": 16000117
            },
            {
                "name": "Fan_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_36_03",
                "category": "01_Symbol",
                "id": 16000118
            },
            {
                "name": "Fan_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_36_04",
                "category": "01_Symbol",
                "id": 16000119
            },
            {
                "name": "Fugi_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_26_01",
                "category": "01_Symbol",
                "id": 16000120
            },
            {
                "name": "Fugi_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_26_02",
                "category": "01_Symbol",
                "id": 16000121
            },
            {
                "name": "Fugi_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_26_04",
                "category": "01_Symbol",
                "id": 16000122
            },
            {
                "name": "Fugi_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_26_03",
                "category": "01_Symbol",
                "id": 16000123
            },
            {
                "name": "YingYang_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_28_01",
                "category": "01_Symbol",
                "id": 16000124
            },
            {
                "name": "YingYang_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_28_02",
                "category": "01_Symbol",
                "id": 16000125
            },
            {
                "name": "flag_c_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_28_03",
                "category": "02_Flag",
                "id": 16000126
            },
            {
                "name": "flag_c_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_28_04",
                "category": "02_Flag",
                "id": 16000127
            },
            {
                "name": "Cherry_Blossom_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_34_01",
                "category": "01_Symbol",
                "id": 16000128
            },
            {
                "name": "Cherry_Blossom_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_34_02",
                "category": "01_Symbol",
                "id": 16000129
            },
            {
                "name": "Cherry_Blossom_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_34_03",
                "category": "01_Symbol",
                "id": 16000130
            },
            {
                "name": "Cherry_Blossom_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_34_04",
                "category": "01_Symbol",
                "id": 16000131
            },
            {
                "name": "Cherry_Blossom_06",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_35_03",
                "category": "01_Symbol",
                "id": 16000132
            },
            {
                "name": "Cherry_Blossom_05",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_35_04",
                "category": "01_Symbol",
                "id": 16000133
            },
            {
                "name": "Cherry_Blossom_07",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_35_01",
                "category": "01_Symbol",
                "id": 16000134
            },
            {
                "name": "Cherry_Blossom_08",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_35_02",
                "category": "01_Symbol",
                "id": 16000135
            },
            {
                "name": "Bamboo_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_29_01",
                "category": "01_Symbol",
                "id": 16000136
            },
            {
                "name": "Bamboo_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_29_02",
                "category": "01_Symbol",
                "id": 16000137
            },
            {
                "name": "Bamboo_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_29_03",
                "category": "01_Symbol",
                "id": 16000138
            },
            {
                "name": "Bamboo_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_29_04",
                "category": "01_Symbol",
                "id": 16000139
            },
            {
                "name": "Orange_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_37_01",
                "category": "01_Symbol",
                "id": 16000140
            },
            {
                "name": "Orange_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_37_04",
                "category": "01_Symbol",
                "id": 16000141
            },
            {
                "name": "Lotus_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_40_01",
                "category": "01_Symbol",
                "id": 16000142
            },
            {
                "name": "Lotus_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_40_02",
                "category": "01_Symbol",
                "id": 16000143
            },
            {
                "name": "A_Char_King_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_54_01",
                "category": "03_Royale",
                "id": 16000144
            },
            {
                "name": "A_Char_King_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_54_02",
                "category": "03_Royale",
                "id": 16000145
            },
            {
                "name": "A_Char_King_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_54_03",
                "category": "03_Royale",
                "id": 16000146
            },
            {
                "name": "A_Char_King_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_54_04",
                "category": "03_Royale",
                "id": 16000147
            },
            {
                "name": "A_Char_Barbarian_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_47_01",
                "category": "03_Royale",
                "id": 16000148
            },
            {
                "name": "A_Char_Barbarian_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_47_02",
                "category": "03_Royale",
                "id": 16000149
            },
            {
                "name": "A_Char_Prince_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_48_01",
                "category": "03_Royale",
                "id": 16000150
            },
            {
                "name": "A_Char_Prince_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_48_02",
                "category": "03_Royale",
                "id": 16000151
            },
            {
                "name": "A_Char_Knight_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_55_01",
                "category": "03_Royale",
                "id": 16000152
            },
            {
                "name": "A_Char_Knight_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_55_02",
                "category": "03_Royale",
                "id": 16000153
            },
            {
                "name": "A_Char_Goblin_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_53_01",
                "category": "03_Royale",
                "id": 16000154
            },
            {
                "name": "A_Char_Goblin_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_53_02",
                "category": "03_Royale",
                "id": 16000155
            },
            {
                "name": "A_Char_DarkPrince_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_49_01",
                "category": "03_Royale",
                "id": 16000156
            },
            {
                "name": "A_Char_DarkPrince_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_49_02",
                "category": "03_Royale",
                "id": 16000157
            },
            {
                "name": "A_Char_DarkPrince_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_49_03",
                "category": "03_Royale",
                "id": 16000158
            },
            {
                "name": "A_Char_DarkPrince_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_49_04",
                "category": "03_Royale",
                "id": 16000159
            },
            {
                "name": "A_Char_MiniPekka_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_51_01",
                "category": "03_Royale",
                "id": 16000160
            },
            {
                "name": "A_Char_MiniPekka_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_51_02",
                "category": "03_Royale",
                "id": 16000161
            },
            {
                "name": "A_Char_Pekka_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_38_03",
                "category": "03_Royale",
                "id": 16000162
            },
            {
                "name": "A_Char_Pekka_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_38_04",
                "category": "03_Royale",
                "id": 16000163
            },
            {
                "name": "A_Char_Hammer_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_45_01",
                "category": "03_Royale",
                "id": 16000164
            },
            {
                "name": "A_Char_Hammer_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_45_02",
                "category": "03_Royale",
                "id": 16000165
            },
            {
                "name": "A_Char_Rocket_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_42_01",
                "category": "03_Royale",
                "id": 16000166
            },
            {
                "name": "A_Char_Rocket_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_42_02",
                "category": "03_Royale",
                "id": 16000167
            },
            {
                "name": "Freeze_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_56_01",
                "category": "01_Symbol",
                "id": 16000168
            },
            {
                "name": "Freeze_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_56_02",
                "category": "01_Symbol",
                "id": 16000169
            },
            {
                "name": "Clover_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_57_01",
                "category": "01_Symbol",
                "id": 16000170
            },
            {
                "name": "Clover_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_57_02",
                "category": "01_Symbol",
                "id": 16000171
            },
            {
                "name": "flag_h_04",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_04",
                "category": "02_Flag",
                "id": 16000172
            },
            {
                "name": "flag_e_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_05",
                "category": "02_Flag",
                "id": 16000173
            },
            {
                "name": "flag_i_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_06",
                "category": "02_Flag",
                "id": 16000174
            },
            {
                "name": "flag_e_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_20_07",
                "category": "02_Flag",
                "id": 16000175
            },
            {
                "name": "A_Char_Barbarian_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_47_03",
                "category": "03_Royale",
                "id": 16000176
            },
            {
                "name": "A_Char_Prince_03",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_48_03",
                "category": "03_Royale",
                "id": 16000177
            },
            {
                "name": "A_Char_Bomb_01",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_58_01",
                "category": "03_Royale",
                "id": 16000178
            },
            {
                "name": "A_Char_Bomb_02",
                "icon_swf": "sc/ui.sc",
                "icon_export_name": "clan_badge_58_02",
                "category": "03_Royale",
                "id": 16000179
            }
        ]

        const badgeName = badges.find(b => b.id === badgeId).name;
        let league;

        if (returnEmojiPath) {
            if (trophyCount >= 5000) league = 'legendary3';
            else if (trophyCount >= 4000) league = 'legendary2';
            else if (trophyCount >= 3000) league = 'legendary1';
            else if (trophyCount >= 2500) league = 'gold3';
            else if (trophyCount >= 2000) league = 'gold2';
            else if (trophyCount >= 1500) league = 'gold1';
            else if (trophyCount >= 1200) league = 'silver3';
            else if (trophyCount >= 900) league = 'silver2';
            else if (trophyCount >= 600) league = 'silver1';
            else if (trophyCount >= 400) league = 'bronze3';
            else if (trophyCount >= 200) league = 'bronze2';
            else league = 'bronze1';
        }
        else { //file path
            if (trophyCount >= 5000) league = 'legendary-3';
            else if (trophyCount >= 4000) league = 'legendary-2';
            else if (trophyCount >= 3000) league = 'legendary-1';
            else if (trophyCount >= 2500) league = 'gold-3';
            else if (trophyCount >= 2000) league = 'gold-2';
            else if (trophyCount >= 1500) league = 'gold-1';
            else if (trophyCount >= 1200) league = 'silver-3';
            else if (trophyCount >= 900) league = 'silver-2';
            else if (trophyCount >= 600) league = 'silver-1';
            else if (trophyCount >= 400) league = 'bronze-3';
            else if (trophyCount >= 200) league = 'bronze-2';
            else league = 'bronze-1';
        }

        return `${badgeName}_${league}`
    },
    getArenaEmoji: pb => {
        if (pb >= 8000) return 'arena24';
        else if (pb >= 7600) return 'arena23';
        else if (pb >= 7300) return 'arena22';
        else if (pb >= 7000) return 'arena21';
        else if (pb >= 6600) return 'arena20';
        else if (pb >= 6300) return 'arena19';
        else if (pb >= 6000) return 'arena18';
        else if (pb >= 5600) return 'arena17';
        else if (pb >= 5300) return 'arena16';
        else if (pb >= 5000) return 'arena15';
        else if (pb >= 4600) return 'arena14';
        else if (pb >= 4200) return 'arena13';
        else if (pb >= 3800) return 'arena12';
        else if (pb >= 3400) return 'arena11';
        else if (pb >= 3000) return 'arena10';
        else if (pb >= 2600) return 'arena9';
        else if (pb >= 2300) return 'arena8';
        else if (pb >= 2000) return 'arena7';
        else if (pb >= 1600) return 'arena6';
        else if (pb >= 1300) return 'arena5';
        else if (pb >= 1000) return 'arena4';
        else if (pb >= 600) return 'arena3';
        else if (pb >= 300) return 'arena2';
        else return 'arena1';
    }
}

module.exports = clanUtil;