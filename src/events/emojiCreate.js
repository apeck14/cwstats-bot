const { green } = require("../static/colors")
const ownerIds = require("../static/ownerIds")
const { logToSupportServer } = require("../util/logging")

module.exports = {
  event: "emojiCreate",
  run: async (client, db, emoji) => {
    if (!ownerIds.includes(emoji.guild.ownerId)) return

    client.cwEmojis.set(emoji.name, `<:${emoji.name}:${emoji.id}>`)

    logToSupportServer(
      client,
      {
        title: "__Emoji Created!__",
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
