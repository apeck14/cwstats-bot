const fs = require("fs")
const ownerIds = require("../static/ownerIds")
const { updateEmojis } = require("../util/functions")
const { green } = require("../static/colors")

module.exports = {
  event: "emojiUpdate",
  run: async (client, db, oldEmoji, newEmoji) => {
    if (!ownerIds.includes(newEmoji.guild.ownerId)) return

    fs.readFile("allEmojis.json", "utf8", (err, data) => {
      if (err) console.error(err)
      else {
        const emojis = JSON.parse(data)
        delete emojis[oldEmoji.name]
        emojis[newEmoji.name] = `<:${newEmoji.name}:${newEmoji.id}>`

        updateEmojis(emojis)

        logToSupportServer(
          client,
          {
            title: "__Emoji Updated!__",
            description: `**Old Name**: ${oldEmoji.name}\n**New Name**: ${newEmoji.name}`,
            color: green,
            thumbnail: {
              url: newEmoji.imageURL(),
            },
          },
          false
        )
      }
    })
  },
}
