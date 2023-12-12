const fs = require("fs")
const ownerIds = require("../static/ownerIds")
const { updateEmojis } = require("../util/functions")
const { green } = require("../static/colors")

module.exports = {
  event: "emojiDelete",
  run: async (client, db, emoji) => {
    if (!ownerIds.includes(emoji.guild.ownerId)) return

    fs.readFile("allEmojis.json", "utf8", (err, data) => {
      if (err) console.error(err)
      else {
        const emojis = JSON.parse(data)
        delete emojis[emoji.name]

        updateEmojis(emojis)

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
      }
    })
  },
}
