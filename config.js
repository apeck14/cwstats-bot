const {
  BOT_WEBHOOK_URL,
  CLIENT_ID,
  CLIENT_TOKEN,
  COMMANDS_WEBHOOK_URL,
  INTERNAL_API_KEY,
  NODE_ENV,
  TEST_CLIENT_TOKEN,
  TEST_GUILD_ID,
  TOPGG_TOKEN
} = process.env

// Default request timeout (ms) for outbound API calls. Industry common default ≈ 10s.
// Can be overridden via environment variable REQUEST_TIMEOUT_MS.
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 10000)

export {
  BOT_WEBHOOK_URL,
  CLIENT_ID,
  CLIENT_TOKEN,
  COMMANDS_WEBHOOK_URL,
  INTERNAL_API_KEY,
  NODE_ENV,
  REQUEST_TIMEOUT_MS,
  TEST_CLIENT_TOKEN,
  TEST_GUILD_ID,
  TOPGG_TOKEN
}
