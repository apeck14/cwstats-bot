const axios = require("axios")
const { formatTag } = require("./functions")

const API_TOKEN = process.env.API_TOKEN
const API_JOB_TOKEN = process.env.API_JOB_TOKEN

module.exports = {
	getPlayer: async (tag) => {
		tag = formatTag(tag)
		const url = `https://proxy.royaleapi.dev/v1/players/%23${tag.substr(1)}`
		const req = await axios.get(url, { headers: { Authorization: "Bearer " + API_TOKEN } })

		return req?.data || req
	},
	getClan: async (tag) => {
		tag = formatTag(tag)
		const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag.substr(1)}`
		const req = await axios.get(url, { headers: { Authorization: "Bearer " + API_TOKEN } })

		return req?.data || req
	},
	getRiverRaceLog: () => {},
	getRiverRace: async (tag) => {
		tag = formatTag(tag)
		const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag.substr(1)}/currentriverrace`
		const req = await axios.get(url, { headers: { Authorization: "Bearer " + API_JOB_TOKEN } })

		return req?.data || req
	},
	getGlobalWarLeaderboard: async (limit = 100) => {
		const url = `https://proxy.royaleapi.dev/v1/locations/global/rankings/clanwars/?limit=${limit}`
		const req = await axios.get(url, { headers: { Authorization: "Bearer " + API_TOKEN } })

		return req?.data?.items || req
	},
	getPlayerRanking: async (tag, locationId = "global") => {
		const url = `https://proxy.royaleapi.dev/v1/locations/${locationId}/rankings/players`
		const req = await axios.get(url, { headers: { Authorization: "Bearer " + API_TOKEN } })

		if (req?.data?.items) {
			const player = req.data.items.find((p) => p.tag === tag)

			return player ? player.rank : false
		}

		return req
	},
}
