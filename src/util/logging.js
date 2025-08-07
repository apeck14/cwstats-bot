const logToSupportServer = (client, embed, isCommand = true) => {
  try {
    const webhook = isCommand ? client.commandsWebhook : client.botWebhook
    webhook.send({ embeds: [embed] }).then(console.log)
  } catch (e) {
    console.log("Error sending embed to Support Server")
    console.log(e)
  }
}

module.exports = {
  logToSupportServer,
}
