const fs = require("fs")
const ownerIds = require("../static/ownerIds")
const { updateEmojis } = require("../util/functions")
const { logToSupportServer } = require("../util/logging")
const { green } = require("../static/colors")

module.exports = {
  event: "emojiCreate",
  run: async (client, db, emoji) => {
    if (!ownerIds.includes(emoji.guild.ownerId)) return

    fs.readFile("allEmojis.json", "utf8", (err, data) => {
      if (err) console.error(err)
      else {
        const emojis = JSON.parse(data)
        emojis[emoji.name] = `<:${emoji.name}:${emoji.id}>`

        updateEmojis(emojis)

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
      }
    })
  },
}
