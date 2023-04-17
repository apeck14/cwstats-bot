const { getPlayer } = require("../util/api")
const { green, orange } = require("../static/colors")
const { formatStr, formatTag } = require("../util/formatting")
const { errorMsg } = require("../util/functions")

module.exports = {
  data: {
    name: "link",
    description: "Link your CR account to Discord.",
    options: [
      {
        type: 3,
        name: "tag",
        description: "#PLAYERTAG",
        required: true,
      },
    ],
  },
  run: async (i, db) => {
    const linkedAccounts = db.collection("Linked Accounts")

    const tag = formatTag(i.options.getString("tag"))

    const { data: player, error } = await getPlayer(tag)

    if (error) return errorMsg(i, error)

    const linkedAccount = await linkedAccounts.findOne({
      discordID: i.user.id,
    })

    if (!linkedAccount) {
      await linkedAccounts.insertOne({
        discordID: i.user.id,
        tag,
        savedClans: [],
        savedPlayers: [
          {
            name: player.name,
            tag,
          },
        ],
      })

      return i.editReply({
        embeds: [
          {
            color: green,
            description: `✅ Account linked to **${formatStr(player.name)}**!`,
          },
        ],
      })
    } else if (!linkedAccount.tag) {
      await linkedAccounts.updateOne(
        {
          discordID: i.user.id,
        },
        {
          $set: {
            tag: tag,
          },
          $push: {
            savedPlayers: {
              name: player.name,
              tag,
            },
          },
        }
      )

      return i.editReply({
        embeds: [
          {
            color: green,
            description: `✅ Account linked to **${formatStr(player.name)}**!`,
          },
        ],
      })
    }
    //already linked to that tag
    else if (linkedAccount.tag === tag) {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**You have already linked that ID!**",
          },
        ],
      })
    }

    //already linked to antoher tag, send confirmation embed to update to new tag
    else {
      const row = {
        components: [
          {
            custom_id: "yes",
            label: "Yes",
            style: 3,
            type: 2,
          },
          {
            custom_id: "no",
            label: "No",
            style: 4,
            type: 2,
          },
        ],
        type: 1,
      }

      //send confirmatiom embed
      const confEmbed = await i.editReply({
        embeds: [
          {
            color: green,
            description: `Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linkedAccount.tag}\n**New ID:** ${tag}`,
          },
        ],
        components: [row],
      })

      const iFilter = (int) => {
        return int.user.id === i.user.id
      }

      const collector = confEmbed.createMessageComponentCollector({
        filter: iFilter,
        time: 10000,
      })

      collector.on("collect", async (int) => {
        if (int.customId === "yes") {
          await linkedAccounts.updateOne(
            {
              discordID: int.user.id,
            },
            {
              $set: {
                tag,
              },
              $push: {
                savedPlayers: {
                  name: player.name,
                  tag,
                },
              },
            }
          )

          return int.update({
            embeds: [
              {
                color: green,
                description: `✅ Updated! Account linked to **${formatStr(
                  player.name
                )}**.`,
              },
            ],
            components: [],
          })
        }

        i.deleteReply()
      })

      collector.on("end", (collected) => {
        if (!collected.size) i.deleteReply()
      })
    }
  },
}
