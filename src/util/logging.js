const logToSupportServer = async (client, embed, isCommand = true) => {
  try {
    const webhook = isCommand ? client.commandsWebhook : client.botWebhook

    if (webhook) {
      await webhook.send({ embeds: [embed] })
    }
  } catch (e) {
    console.log("Error sending embed to Support Server")
    console.log(e)
  }
}

module.exports = {
  logToSupportServer,
}
