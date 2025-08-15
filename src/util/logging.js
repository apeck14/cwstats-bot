const logToSupportServer = (client, embed, isCommand = true) => {
  const webhook = isCommand ? client.commandsWebhook : client.botWebhook
  if (!webhook) return

  webhook.send({ embeds: [embed] }).catch((e) => {
    console.error("Error sending embed to Support Server:", e)
  })
}

module.exports = {
  logToSupportServer,
}
