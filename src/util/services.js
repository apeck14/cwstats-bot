const axios = require("axios")
const { formatTag } = require("./formatting")
const { INTERNAL_API_KEY } = require("../../config")

const BASE_URL = "https://api.cwstats.com/api"

const handleAPISuccess = (e) => e?.data

// Format error messages to make them more user friendly
const handleAPIFailure = (e, notFoundMessage = `**Not found.**`) => {
  const { response, status } = e || {}
  const { data } = response || {}

  let error = `**Unexpected error.** Please try again.`

  if (status === 404) error = notFoundMessage
  else if (status === 429) error = `**Rate limit exceeded.** Please try again later.`
  else if (status === 503) error = `:tools: **Maintenence break.**`
  else if (status !== 500 && data?.error) error = `**${data.error}**`

  return { error, status }
}

const getGuild = (id, limited = false) =>
  axios
    .get(`${BASE_URL}/guild/${id}${limited ? "/limited" : ""}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Guild not found.**"))

const getGuildLinkedClans = (id) =>
  axios
    .get(`${BASE_URL}/guild/${id}/clans`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Guild not found.**"))

const getPlayer = (tag, limited = false) =>
  axios
    .get(`${BASE_URL}/player/${formatTag(tag, false)}${limited ? "/limited" : ""}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Player not found.**"))

const addPlayer = (tag) =>
  axios
    .put(
      `${BASE_URL}/player`,
      {
        tag: formatTag(tag, false),
      },
      {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
      },
    )
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const linkPlayer = (tag, userId) =>
  axios
    .put(
      `${BASE_URL}/player/link`,
      { tag, userId },
      {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
      },
    )
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const getClan = (tag, limited = false) =>
  axios
    .get(`${BASE_URL}/clan/${formatTag(tag, false)}${limited ? "/limited" : ""}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Clan not found.**"))

const getRace = (tag, limited = false) =>
  axios
    .get(`${BASE_URL}/clan/${formatTag(tag, false)}/race${limited ? "/limited" : ""}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Race not found.**"))

const getDailyLeaderboard = ({ key, limit, maxTrophies, minTrophies }) =>
  axios
    .get(`${BASE_URL}/leaderboard/daily`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
      params: {
        key,
        limit,
        maxTrophies,
        minTrophies,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e))

const getAllPlusClans = (tagsOnly = false) =>
  axios
    .get(`${BASE_URL}/plus/clans`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
      params: {
        tagsOnly,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e))

const setCommandCooldown = (id, commandName, delay) =>
  axios
    .patch(
      `${BASE_URL}/guild/${id}/command-cooldown`,
      {
        commandName,
        delay,
      },
      {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
      },
    )
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e))

const getLinkedAccount = (userId) =>
  axios
    .get(`${BASE_URL}/user/${userId}/linked-account`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Linked account not found.**"))

const getPlayerBattleLog = (tag) =>
  axios
    .get(`${BASE_URL}/player/${formatTag(tag, false)}/log`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Player not found.**"))

const searchClans = (name) =>
  axios
    .get(`${BASE_URL}/clan/search`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
      params: {
        name,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**No clans found.**"))

const addNudgeLink = (id, tag, userId) =>
  axios
    .put(
      `${BASE_URL}/guild/${id}/nudge-link`,
      {
        tag: formatTag(tag, false),
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
      },
    )
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const deleteNudgeLink = (id, tag) =>
  axios
    .delete(`${BASE_URL}/guild/${id}/nudge-link/${formatTag(tag, false)}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Tag is not linked.**"))

const createGuild = (id) =>
  axios
    .post(`${BASE_URL}/guild/${id}`, null, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const deleteGuild = (id) =>
  axios
    .delete(`${BASE_URL}/guild/${id}`, {
      headers: {
        Authorization: `Bearer ${INTERNAL_API_KEY}`,
      },
    })
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, "**Guild not found.**"))

const bulkAddEmojis = (emojis) =>
  axios
    .post(
      `${BASE_URL}/emoji/bulk-add`,
      {
        emojis,
      },
      {
        headers: {
          Authorization: `Bearer ${INTERNAL_API_KEY}`,
        },
      },
    )
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

module.exports = {
  addNudgeLink,
  addPlayer,
  bulkAddEmojis,
  createGuild,
  deleteGuild,
  deleteNudgeLink,
  getAllPlusClans,
  getClan,
  getDailyLeaderboard,
  getGuild,
  getGuildLinkedClans,
  getLinkedAccount,
  getPlayer,
  getPlayerBattleLog,
  getRace,
  linkPlayer,
  searchClans,
  setCommandCooldown,
}
