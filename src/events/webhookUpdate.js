const { Events } = require("discord.js")

module.exports = {
  name: Events.WebhooksUpdate,
  run: async (client, db, channel) => {
    console.log("TESTTTTT", channel)
  },
}
