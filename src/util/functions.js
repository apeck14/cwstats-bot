const allCards = require('../static/cardInfo');
const badges = require('../static/badges.js');

module.exports = {
    formatTag: (tag) => {
        if (typeof tag !== 'string') return;

        return `#${tag.toUpperCase().replace(/[^0-9a-z]/gi, '').replace(/O/g, '0').replace(/o/g, '0')}`;
    },
    getClanBadge: (badgeId, trophyCount, returnEmojiPath = true) => {
        if (badgeId === -1 || badgeId === null) return 'no_clan'; //no clan

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
    getEmoji: (client, emojiName) => {
        const ownerIds = ['493245767448789023', '878013634851258428', '878025564538146816', '878031332817645681', '878030152691499028', '878395655121436682', '878394839950061630', '878397282461024287', '878396465817460757'];
        const emoji = client.emojis.cache.find(e => ownerIds.includes(e.guild.ownerId) && e.name === emojiName);

        return `<:${emoji.name}:${emoji.id}>`;
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
    },
    getLeague: pb => {
        if (pb >= 8000) return 'league-10';
        else if (pb >= 7600) return 'league-9';
        else if (pb >= 7300) return 'league-8';
        else if (pb >= 7000) return 'league-7';
        else if (pb >= 6600) return 'league-6';
        else if (pb >= 6300) return 'league-5';
        else if (pb >= 6000) return 'league-4';
        else if (pb >= 5600) return 'league-3';
        else if (pb >= 5300) return 'league-2';
        else if (pb >= 5000) return 'league-1';
        else return null;
    },
    average: arr => {
        let sum = 0;

        try {
            for (const n of arr) {
                sum += parseFloat(n);
            }
            return sum / arr.length;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },
    getDeckUrl: cards => {
        let url = 'https://link.clashroyale.com/deck/en?deck=';

        for (const c of cards) {
            url += `${allCards.find(ca => ca.name === c).id};`;
        }

        return url.substring(0, url.length - 1);
    },
    //convert hex to transparent rgba value
    hexToRgbA: hex => {
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1).split('');

            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }

            c = '0x' + c.join('');

            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.25)';
        }
        return 'rgba(255, 255, 255, 0.25)'; //transparent white
    },
    sortArrOfBadges: arr => {
        arr.sort((a, b) => {
            const sortOrder = [
                'cc', 'cc-10', 'cc-100',
                'gc', 'gc-10', 'gc-100',
                'wins-1000',
                'years-1', 'years-2', 'years-3', 'years-4', 'years-5',
                'ladder',
                'league-1', 'league-2', 'league-3', 'league-4', 'league-5', 'league-6', 'league-7', 'league-8', 'league-9', 'league-10',
                'gt',
                'cw1', 'cw1-10', 'cw1-100',
                'crl', 'crl-2021'
            ];
            const bIndex = sortOrder.indexOf(b.name || b);
            const aIndex = sortOrder.indexOf(a.name || a);

            return aIndex - bIndex;
        })
    }
}