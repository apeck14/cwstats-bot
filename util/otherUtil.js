const axios = require('axios');
const API_KEY = require('./tokenUtil.js');
const fs = require('fs');

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
    jsonReader: (filePath, cb) => {
        fs.readFile(filePath, (err, fileData) => {
            if (err) return cb && cb(err);

            try {
                const obj = JSON.parse(fileData)
                return cb && cb(null, obj);
            } catch (err) {
                return cb && cb(err);
            }
        })
    }
}

module.exports = otherUtil;