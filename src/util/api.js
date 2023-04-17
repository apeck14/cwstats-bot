const axios = require("axios")
const { CR_API_TOKEN, CR_API_JOB_TOKEN } = require("../../config")
const { formatTag } = require("./formatting")

const apiRequest = async (url, apiToken) => {
  const resp = await axios
    .get(url, {
      headers: {
        Authorization: "Bearer " + apiToken,
      },
    })
    .catch((err) => err.response)
  const { status, data } = resp

  if (status === 200) {
    return {
      status,
      data: data.items || data,
    }
  }
  if (status === 404) {
    return {
      status,
      error: "**Not found.**",
    }
  }
  if (status === 429) {
    return {
      status,
      error: "**API limit exceeded.** Please try again later.",
    }
  }
  if (status === 503) {
    return {
      status,
      error: ":tools: **Maintenence break.**",
    }
  }

  return {
    status,
    error: "**Unexpected error.** Please try again.",
  }
}

exports.getBattleLog = async (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/battlelog`

  return await apiRequest(url, CR_API_TOKEN)
}

exports.getCardInfo = async () => {
  const url = `https://proxy.royaleapi.dev/v1/cards`

  return await apiRequest(url, CR_API_TOKEN)
}
exports.getClan = async (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}`

  return await apiRequest(url, CR_API_TOKEN)
}

exports.getPlayer = async (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}`

  return await apiRequest(url, CR_API_TOKEN)
}

exports.getRiverRace = async (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`

  return await apiRequest(url, CR_API_JOB_TOKEN)
}

exports.getWarLeaderboard = async (limit = 100, locationId = "global") => {
  const url = `https://proxy.royaleapi.dev/v1/locations/${locationId}/rankings/clanwars/?limit=${limit}`

  return await apiRequest(url, CR_API_TOKEN)
}

exports.getChests = async (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/upcomingchests`

  return await apiRequest(url, CR_API_TOKEN)
}
