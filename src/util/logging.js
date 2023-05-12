const COMMANDS_CHANNEL_ID = "947608454456016896"
const JOIN_LEAVE_CHANNEL_ID = "1106688278448590848"

const logToSupportServer = (client, embed, isCommand = true) => {
  try {
    client.channels.cache
      .get(isCommand ? COMMANDS_CHANNEL_ID : JOIN_LEAVE_CHANNEL_ID)
      .send({
        embeds: [embed],
      })
  } catch (e) {
    console.log("Error sending embed to Support Server")
    console.log(e)
  }
}

module.exports = {
  logToSupportServer,
}
