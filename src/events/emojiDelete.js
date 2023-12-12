const ownerIds = require("../static/ownerIds")
const { green } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
  event: "emojiDelete",
  run: async (client, db, emoji) => {
    if (!ownerIds.includes(emoji.guild.ownerId)) return

    client.cwEmojis.delete(emoji.name)

    logToSupportServer(
      client,
      {
        title: "__Emoji Deleted!__",
        description: `**Name**: ${emoji.name}\n**ID**: ${emoji.id}`,
        color: green,
        thumbnail: {
          url: emoji.imageURL(),
        },
      },
      false
    )
  },
}
