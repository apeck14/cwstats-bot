const logToSupportServer = async (client, embed, isCommand = true) => {
  const webhook = isCommand ? client.commandsWebhook : client.botWebhook

  if (!webhook) return

  const res = await webhook.send({ embeds: [embed] }).catch((e) => {
    console.error("Error sending embed to Support Server:", e)
  })

  console.log({ res })
}

module.exports = {
  logToSupportServer,
}
