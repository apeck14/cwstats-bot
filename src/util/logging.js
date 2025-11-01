/* eslint-disable no-console */
import { pink } from '../static/colors.js'
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

// Build and send a command interaction log to the support server webhook.
// Safe, non-blocking, and resilient to invalid webhook tokens.
const logCommand = (client, i, color = pink) => {
  try {
    const { discriminator, id, username } = i.user || {}
    const guildObj = i.guild || i.member?.guild

    let desc = `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guildObj?.name} (${guildObj?.id})`

    const hasOptions = i?.options?._hoistedOptions?.length > 0
    const hasFields = i?.fields?.fields?.size > 0
    let data = '*None*'

    if (hasOptions) {
      data = `${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join('\n')}`
    } else if (hasFields) {
      data = `${i.fields.fields.map((o) => `• **${o.customId}**: ${o.value}`).join('\n')}`
    }

    desc += `\n\n**Fields**: \n${data}`

    logToSupportServer(client, {
      color,
      description: desc,
      title: `__/${i.commandName || i.customId}__`
    })
  } catch (e) {
    console.log('Error building/sending command log:', e)
  }
}

export { logCommand, logToSupportServer }
