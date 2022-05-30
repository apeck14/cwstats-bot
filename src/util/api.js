const axios = require("axios")
const { CR_API_TOKEN, CR_API_JOB_TOKEN } = require("../../config")
const { formatTag } = require("./formatting")

const apiRequest = async (url, apiToken) => {
	const resp = await axios.get(url, { headers: { Authorization: "Bearer " + apiToken } }).catch((err) => err.response)
	const { status, data } = resp

	if (status === 200) return { status, data: data.items || data }
	if (status === 404) return { status, error: "**Not found.**" }
	if (status === 429) return { status, error: "**API limit exceeded.** Please try again later." }
	if (status === 503) return { status, error: ":tools: **Maintenence break.**" }

	return { status, error: "**Unexpected error.** Please try again." }
}

exports.getBattleLog = async (tag) => {
	tag = formatTag(tag).substring(1)
	const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/battlelog`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}

exports.getCardInfo = async () => {
	const url = `https://proxy.royaleapi.dev/v1/cards`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}
exports.getClan = async (tag) => {
	tag = formatTag(tag).substring(1)
	const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}

exports.getPlayer = async (tag) => {
	tag = formatTag(tag).substring(1)
	const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}

exports.getRiverRace = async (tag) => {
	tag = formatTag(tag).substring(1)
	const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`
	const req = await apiRequest(url, CR_API_JOB_TOKEN)
	return req
}

exports.getWarLeaderboard = async (limit = 100, locationId = "global") => {
	const url = `https://proxy.royaleapi.dev/v1/locations/${locationId}/rankings/clanwars/?limit=${limit}`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}

exports.getChests = async (tag) => {
	tag = formatTag(tag).substring(1)
	const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/upcomingchests`
	const req = await apiRequest(url, CR_API_TOKEN)
	return req
}
