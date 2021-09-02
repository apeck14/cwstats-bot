const axios = require('axios');
const API_KEY = require('./tokenUtil.js');

const otherUtil = {
    green: '#00FF00',
    red: '#ff0f0f',
    orange: '#FFA500',
    parseDate: date => {
        if (date instanceof Date) return date;
        try {
            return new Date(Date.UTC(
                date.substr(0, 4),
                date.substr(4, 2) - 1,
                date.substr(6, 2),
                date.substr(9, 2),
                date.substr(11, 2),
                date.substr(13, 2),
            ));
        } catch (e) {
            console.log(`Error (parseDate): ${date}`);
        }
    },
    /**
     * Make a Clash Royale API request
     * @param {*} url - API URL to request date from
     * @param {*} incrementToken - increment API token in API_KEY class
     * @param {*} voidConsoleOutput - void console.log if certain error response from API
     * @returns {Object} - data from API
     */
    request: async (url, incrementToken = false) => {
        try {
            const req = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + API_KEY.token(incrementToken) } });
            return req.data || req;
        } catch (e) {
            console.error(e.response?.statusText || e.response || e);
        }
    },
    average: arr => {
        let sum = 0;

        try {
            for (const n of arr) {
                sum += parseInt(n);
            }
            return sum / arr.length;
        } catch (e) {
            console.log(e);
            return 0;
        }
    },
    //convert hex to transparent rgba value
    hexToRgbA: (hex) => {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.25)';
        }
        return 'rgba(255, 255, 255, 0.25)'; //transparent white
    },
    getEmoji: (bot, emojiName) => {
        const ownerIds = ['493245767448789023', '878013634851258428', '878025564538146816', '878031332817645681', '878030152691499028', '878395655121436682', '878394839950061630', '878397282461024287', '878396465817460757'];
        const emoji = bot.emojis.cache.find(e => ownerIds.includes(e.guild.ownerID) && e.name === emojiName);

        return `<:${emoji.name}:${emoji.id}>`;
    }
}

module.exports = otherUtil;