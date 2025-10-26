/* eslint-disable camelcase */
const { ActionRowBuilder, ApplicationCommandType, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js')
const { formatStr, formatTag } = require('../util/formatting')
const { green, orange, red } = require('../static/colors')
const { addNudgeLink } = require('../util/services')

module.exports = {
  data: {
    name: 'Link Player (ADMIN)',
    name_localizations: {
      de: 'Spieler verknüpfen (ADMIN)',
      'es-ES': 'Vincular jugador (ADMIN)',
      fr: 'Lier joueur (ADMIN)',
      it: 'Collega giocatore (AMMIN)',
      nl: 'Speler koppelen (BEHEERDER)',
      'pt-BR': 'Vincular jogador (ADMIN)',
      tr: 'Oyuncu bağla (Yönetici)'
    },
    type: ApplicationCommandType.User
  },
  handleModalSubmit: async (i) => {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral })

      const input = i.fields.fields.entries().next().value
      const { customId: targetId, value: inputTag } = input[1]

      const formattedTag = formatTag(inputTag)

      const { error, name } = await addNudgeLink(i.guildId, formattedTag, targetId)

      if (error) {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: `**${error}**`
            }
          ],
          flags: MessageFlags.Ephemeral
        })
      }

      i.editReply({
        embeds: [
          {
            color: green,
            description: `:white_check_mark: **${formatStr(name)}** successfully linked to user!`
          }
        ],
        flags: MessageFlags.Ephemeral
      })
    } catch (e) {
      i.editReply({
        embeds: [
          {
            color: red,
            description: '**Unexpected error.** Please try again.'
          }
        ],
        flags: MessageFlags.Ephemeral
      })
    }
  },
  run: async (i) => {
    const { targetUser } = i

    const modal = new ModalBuilder().setCustomId(`link-player`).setTitle(`Link Player: ${targetUser.tag}`)

    // Create input fields for the modal
    const input = new TextInputBuilder()
      .setCustomId(targetUser.id)
      .setLabel('PLAYER TAG (#ABC123):')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(10)

    const actionRow = new ActionRowBuilder().addComponents(input)

    modal.addComponents(actionRow)

    // Show the modal
    i.showModal(modal)
  }
}
