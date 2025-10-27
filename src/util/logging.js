/* eslint-disable no-console */
const logToSupportServer = async (client, embed, isCommand = true) => {
  try {
    // ignore dev environment
    const webhook = isCommand ? client.commandsWebhook : client.botWebhook

    if (!webhook) return

    await webhook.send({ embeds: [embed] })
  } catch (e) {
    console.error('Error sending embed to Support Server:', e)
  }
}

module.exports = {
  logToSupportServer
}
