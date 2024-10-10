const { Events } = require("discord.js")
const ownerIds = require("../static/ownerIds")
const { green } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")

module.exports = {
  name: Events.GuildEmojiUpdate,
  run: async (client, db, oldEmoji, newEmoji) => {
    if (!ownerIds.includes(newEmoji.guild.ownerId)) return

    client.cwEmojis.delete(oldEmoji.name)
    client.cwEmojis.set(newEmoji.name, `<:${newEmoji.name}:${newEmoji.id}>`)

    logToSupportServer(
      client,
      {
        color: green,
        description: `**Old Name**: ${oldEmoji.name}\n**New Name**: ${newEmoji.name}`,
        thumbnail: {
          url: newEmoji.imageURL(),
        },
        title: "__Emoji Updated!__",
      },
      false,
    )
  },
}
