const {
  ActionRowBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js")
const { formatTag } = require("../util/formatting")
const { green, red } = require("../static/colors")

module.exports = {
  data: {
    name: "Unlink Player (ADMIN)",
    name_localizations: {
      de: "Spieler trennen (ADMIN)",
      "es-ES": "Desvincular jugador (ADMIN)",
      fr: "Délier joueur (ADMIN)",
      it: "Scollega giocatore (AMMIN)",
      nl: "Speler ontkoppelen (BEHEERDER)",
      tr: "Oyuncu bağlantısını kaldır (Yönetici)",
    },
    type: ApplicationCommandType.User,
  },
  handleModalSubmit: async (i, db) => {
    try {
      const guilds = db.collection("Guilds")

      const input = i.fields.fields.entries().next().value
      const { customId: targetId, value: inputTag } = input[1]

      const guild = await guilds.findOne({
        guildID: i.guildId,
      })

      const { nudges } = guild
      const { links } = nudges || {}
      const formattedTag = formatTag(inputTag)

      if (!links || !links.length || !links.find((l) => l.discordID === targetId && l.tag === formattedTag)) {
        return i.reply({
          embeds: [
            {
              color: red,
              description: `This user is **not linked** to player tag: **${formattedTag}**.`,
            },
          ],
          ephemeral: true,
        })
      }

      guilds.updateOne(
        {
          guildID: i.guildId,
        },
        {
          $pull: {
            "nudges.links": {
              discordID: targetId,
              tag: formattedTag,
            },
          },
        },
      )

      return i.reply({
        embeds: [
          {
            color: green,
            description: `:white_check_mark: User was **successfully unlinked** from player tag: **${formattedTag}**!`,
          },
        ],
        ephemeral: true,
      })
    } catch (e) {
      console.log("unlink-player", e)
      return i.reply({
        embeds: [
          {
            color: red,
            description: "**Unexpected error.**",
          },
        ],
        ephemeral: true,
      })
    }
  },
  run: async (i) => {
    const { targetUser } = i

    const modal = new ModalBuilder().setCustomId(`unlink-player`).setTitle(`Unlink Player: ${targetUser.tag}`)

    // Create input fields for the modal
    const input = new TextInputBuilder()
      .setCustomId(targetUser.id)
      .setLabel("PLAYER TAG (#ABC123):")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(10)

    const actionRow = new ActionRowBuilder().addComponents(input)

    modal.addComponents(actionRow)

    // Show the modal
    await i.showModal(modal)
  },
}
