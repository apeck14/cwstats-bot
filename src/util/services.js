const axios = require('axios')
const { formatTag } = require('./formatting')
const { INTERNAL_API_KEY, NODE_ENV } = require('../../config')

const isDev = NODE_ENV === 'dev'
const BASE_URL = isDev ? 'http://localhost:5000' : 'https://api.cwstats.com'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${INTERNAL_API_KEY}` },
  timeout: 15000
})

const handleAPISuccess = (e) => e?.data

// Format error messages to make them more user friendly
const handleAPIFailure = (e, notFoundMessage = `**Not found.**`) => {
  const { code, response } = e || {}
  const { data, status } = response || {}

  let error = `**Unexpected error.** Please try again.`

  if (code === 'ECONNABORTED') error = '**Request timed out.** Please try again later.'
  else if (status === 404) error = notFoundMessage
  else if (status === 429) error = `**Rate limit exceeded.** Please try again later.`
  else if (status === 503) error = `:tools: **Maintenence break.**`
  else if (status && status !== 500 && data?.error) error = `**${data.error}**`

  return { error, status }
}

const getGuild = (id, limited = false) =>
  api
    .get(`/guild/${id}${limited ? '/limited' : ''}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Guild not found.**'))

const getGuildLinkedClans = (id) =>
  api
    .get(`/guild/${id}/clans`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Guild not found.**'))

const getPlayer = (tag, limited = false) =>
  api
    .get(`/player/${formatTag(tag, false)}${limited ? '/limited' : ''}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Player not found.**'))

const getPlayerScores = (tag) =>
  api
    .get(`/player/${formatTag(tag, false)}/scores`)
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const addPlayer = (tag) =>
  api
    .put('/player', { tag: formatTag(tag, false) })
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const linkPlayer = (tag, userId) => api.put('/player/link', { tag, userId }).then(handleAPISuccess).catch(handleAPIFailure)

const getClan = (tag, limited = false) =>
  api
    .get(`/clan/${formatTag(tag, false)}${limited ? '/limited' : ''}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Clan not found.**'))

const getRace = (tag, limited = false) =>
  api
    .get(`/clan/${formatTag(tag, false)}/race${limited ? '/limited' : ''}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Race not found.**'))

const getDailyLeaderboard = ({ key, limit, maxTrophies, minTrophies }) =>
  api.get('/leaderboard/daily', { params: { key, limit, maxTrophies, minTrophies } }).then(handleAPISuccess).catch(handleAPIFailure)

const getAllPlusClans = (tagsOnly = false) => api.get('/plus/clans', { params: { tagsOnly } }).then(handleAPISuccess).catch(handleAPIFailure)

const setCommandCooldown = (id, commandName, delay) =>
  api.patch(`/guild/${id}/command-cooldown`, { commandName, delay }).then(handleAPISuccess).catch(handleAPIFailure)

const getLinkedAccount = (userId) =>
  api
    .get(`/user/${userId}/linked-account`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Linked account not found.**'))

const getPlayerBattleLog = (tag) =>
  api
    .get(`/player/${formatTag(tag, false)}/log`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Player not found.**'))

const addNudgeLink = (id, tag, userId) =>
  api
    .put(`/guild/${id}/nudge-link`, { tag: formatTag(tag, false), userId })
    .then(handleAPISuccess)
    .catch(handleAPIFailure)

const deleteNudgeLink = (id, tag) =>
  api
    .delete(`/guild/${id}/nudge-link/${formatTag(tag, false)}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Tag is not linked.**'))

const createGuild = (id) => api.post(`/guild/${id}`).then(handleAPISuccess).catch(handleAPIFailure)

const deleteGuild = (id) =>
  api
    .delete(`/guild/${id}`)
    .then(handleAPISuccess)
    .catch((e) => handleAPIFailure(e, '**Guild not found.**'))

const bulkAddEmojis = (emojis) => api.post('/emoji/bulk-add', { emojis }).then(handleAPISuccess).catch(handleAPIFailure)

const getPlayerSearch = (name, limit = 10) => api.get('/player/search', { params: { limit, name } }).then(handleAPISuccess).catch(handleAPIFailure)

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
  getPlayerScores,
  getPlayerSearch,
  getRace,
  linkPlayer,
  setCommandCooldown
}
