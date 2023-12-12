const axios = require("axios")
const { CR_API_JOB_TOKEN, CR_API_TOKEN } = require("../../config")
const { formatTag } = require("./formatting")

const apiRequest = async (url, apiToken) => {
  const resp = await axios
    .get(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })
    .catch((err) => err.response)
  const { data, status } = resp

  if (status === 200) {
    return {
      data: data.items || data,
      status,
    }
  }
  if (status === 404) {
    return {
      error: "**Not found.**",
      status,
    }
  }
  if (status === 429) {
    return {
      error: "**API limit exceeded.** Please try again later.",
      status,
    }
  }
  if (status === 503) {
    return {
      error: ":tools: **Maintenence break.**",
      status,
    }
  }

  return {
    error: "**Unexpected error.** Please try again.",
    status,
  }
}

exports.getBattleLog = (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/battlelog`

  return apiRequest(url, CR_API_TOKEN)
}

exports.getCardInfo = () => {
  const url = `https://proxy.royaleapi.dev/v1/cards`

  return apiRequest(url, CR_API_TOKEN)
}
exports.getClan = (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}`

  return apiRequest(url, CR_API_TOKEN)
}

exports.searchClans = (query) => {
  const url = `https://proxy.royaleapi.dev/v1/clans?name=${encodeURIComponent(query)}`

  return apiRequest(url, CR_API_TOKEN)
}

exports.getPlayer = (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}`

  return apiRequest(url, CR_API_TOKEN)
}

exports.getRiverRace = (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/clans/%23${tag}/currentriverrace`

  return apiRequest(url, CR_API_JOB_TOKEN)
}

exports.getWarLeaderboard = (limit = 100, locationId = "global") => {
  const url = `https://proxy.royaleapi.dev/v1/locations/${locationId}/rankings/clanwars/?limit=${limit}`

  return apiRequest(url, CR_API_TOKEN)
}

exports.getChests = (tag) => {
  tag = formatTag(tag).substring(1)
  const url = `https://proxy.royaleapi.dev/v1/players/%23${tag}/upcomingchests`

  return apiRequest(url, CR_API_TOKEN)
}

exports.addPlayer = async (db, { clanName, name, tag }) => {
  try {
    const players = db.collection("Players")

    const query = { tag }
    const update = { $set: { clanName, name, tag } }
    const options = { upsert: true }

    players.updateOne(query, update, options)
  } catch (err) {
    console.log("Error adding player to db...")
    console.log(err)
  }
}
