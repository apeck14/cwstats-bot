const axios = require("axios");
const { formatTag } = require("./functions");

const apiToken = process.env.apiToken;

module.exports = {
    getPlayer: async tag => {
        tag = formatTag(tag);
        const url = `https://proxy.royaleapi.dev/v1/players/%23${tag.substr(1)}`;
        const req = await axios.get(url, { headers: { Authorization: 'Bearer ' + apiToken } });

        return req?.data || req;
    },
    getClan: async tag => {
        tag = formatTag(tag);
        const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag.substr(1)}`;
        const req = await axios.get(url, { headers: { Authorization: 'Bearer ' + apiToken } });

        return req?.data || req;
    },
    getRiverRaceLog: () => { },
    getRiverRace: async tag => {
        tag = formatTag(tag);
        const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag.substr(1)}/currentriverrace`;
        const req = await axios.get(url, { headers: { Authorization: 'Bearer ' + apiToken } });

        return req?.data || req;
    }
}