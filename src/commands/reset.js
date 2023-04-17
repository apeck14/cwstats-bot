const { green } = require("../static/colors")

module.exports = {
  data: {
    name: "reset",
    description: "Reset all bot settings to default.",
  },
  run: async (i, db) => {
    const guilds = db.collection("Guilds")

    await guilds.updateOne(
      {
        guildID: i.guildId,
      },
      {
        $set: {
          abbreviations: [],
          "channels.applyChannelID": null,
          "channels.applicationsChannelID": null,
          "channels.commandChannelID": null,
          "channels.reportChannelID": null,
        },
        $unset: {
          warReport: "",
        },
      }
    )

    return i.editReply({
      embeds: [
        {
          color: green,
          description: `✅ All bot settings successfully reset to **default**!`,
        },
      ],
    })
  },
}
