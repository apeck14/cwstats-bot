const { addPlayer, getPlayer } = require("../util/api")
const { green, orange } = require("../static/colors")
const { formatStr, formatTag } = require("../util/formatting")
const { errorMsg } = require("../util/functions")

module.exports = {
  data: {
    description: "Link your Clash Royale account to Discord.",
    description_localizations: {
      de: "Verknüpfe dein Clash Royale-Konto mit Discord.",
      "es-ES": "Vincula tu cuenta de Clash Royale con Discord.",
      fr: "Liez votre compte Clash Royale à Discord.",
      it: "Collega il tuo account Clash Royale a Discord.",
      nl: "Koppel uw Clash Royale-account aan Discord.",
      tr: "Clash Royale hesabınızı Discord ile bağlayın.",
    },
    name: "link",
    name_localizations: {
      de: "verbinden",
      "es-ES": "enlazar",
      fr: "lier",
      it: "collega",
      nl: "koppelen",
      tr: "bağlantı",
    },
    options: [
      {
        description: "Player tag (#ABC123)",
        description_localizations: {
          de: "Spielertag (#ABC123)",
          "es-ES": "Etiqueta del jugador (#ABC123)",
          fr: "Tag du joueur (#ABC123)",
          it: "Tag del giocatore (#ABC123)",
          nl: "Spelertag (#ABC123)",
          tr: "Oyuncu etiketi (#ABC123)",
        },
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          "es-ES": "etiqueta",
          fr: "balise",
          it: "tag",
          nl: "tag",
          tr: "etiket",
        },
        required: true,
        type: 3,
      },
    ],
  },
  run: async (i, db) => {
    const linkedAccounts = db.collection("Linked Accounts")

    const tag = formatTag(i.options.getString("tag"))

    const { data: player, error } = await getPlayer(tag)

    if (error) return errorMsg(i, error)

    // add player for website searching
    addPlayer(db, {
      clanName: player?.clan?.name || "",
      name: player.name,
      tag: player.tag,
    })

    const linkedAccount = await linkedAccounts.findOne({
      discordID: i.user.id,
    })

    if (!linkedAccount) {
      await linkedAccounts.insertOne({
        discordID: i.user.id,
        savedClans: [],
        savedPlayers: [
          {
            name: player.name,
            tag,
          },
        ],
        tag,
      })

      return i.editReply({
        embeds: [
          {
            color: green,
            description: `✅ Account linked to **${formatStr(player.name)}**!`,
          },
        ],
      })
    }
    if (!linkedAccount.tag) {
      await linkedAccounts.updateOne(
        {
          discordID: i.user.id,
        },
        {
          $push: {
            savedPlayers: {
              name: player.name,
              tag,
            },
          },
          $set: {
            tag,
          },
        },
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
    // already linked to that tag
    if (linkedAccount.tag === tag) {
      return i.editReply({
        embeds: [
          {
            color: orange,
            description: "**You have already linked that ID!**",
          },
        ],
      })
    }

    // already linked to antoher tag, send confirmation embed to update to new tag

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

    // send confirmatiom embed
    const confEmbed = await i.editReply({
      components: [row],
      embeds: [
        {
          color: green,
          description: `Are you sure you want to link your account to a new ID?\n\n**Old ID:** ${linkedAccount.tag}\n**New ID:** ${tag}`,
        },
      ],
    })

    const iFilter = (int) => int.user.id === i.user.id

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
            $push: {
              savedPlayers: {
                name: player.name,
                tag,
              },
            },
            $set: {
              tag,
            },
          },
        )

        return int.update({
          components: [],
          embeds: [
            {
              color: green,
              description: `✅ Updated! Account linked to **${formatStr(player.name)}**.`,
            },
          ],
        })
      }

      i.deleteReply()
    })

    collector.on("end", (collected) => {
      if (!collected.size) i.deleteReply()
    })
  },
}
