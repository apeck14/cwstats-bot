/* eslint-disable no-console */
const INVALID_WEBHOOK_CODES = new Set([10015, 50027]) // Unknown Webhook, Invalid Webhook Token

const logToSupportServer = (client, embed, isCommand = true) => {
  try {
    const key = isCommand ? 'commandsWebhook' : 'botWebhook'
    const webhook = client[key]
    if (!webhook) return

    // Fire-and-forget to avoid blocking interaction flow
    webhook.send({ embeds: [embed] }).catch((e) => {
      const code = e?.code
      if (INVALID_WEBHOOK_CODES.has(code)) {
        // Disable the broken webhook to prevent repeated failures
        client[key] = null
        console.log(`Support webhook disabled due to invalid token/code (${code}).`)
      } else {
        console.log('Error sending embed to Support Server:', e)
      }
    })
  } catch (e) {
    console.log('Error scheduling embed to Support Server:', e)
  }
}

export { logToSupportServer }
