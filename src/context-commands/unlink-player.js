/* eslint-disable camelcase */
const {
  ActionRowBuilder,
  ApplicationCommandType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js')
const { green, orange, red } = require('../static/colors')
const { deleteNudgeLink } = require('../util/services')

module.exports = {
  data: {
    name: 'Unlink Player (ADMIN)',
    name_localizations: {
      de: 'Spieler trennen (ADMIN)',
      'es-ES': 'Desvincular jugador (ADMIN)',
      fr: 'Délier joueur (ADMIN)',
      it: 'Scollega giocatore (AMMIN)',
      nl: 'Speler ontkoppelen (BEHEERDER)',
      'pt-BR': 'Desvincular jogador (ADMIN)',
      tr: 'Oyuncu çıkar (Yönetici)'
    },
    type: ApplicationCommandType.User
  },
  async handleModalSubmit(i) {
    try {
      await i.deferReply({ flags: MessageFlags.Ephemeral })

      const input = i.fields.fields.entries().next().value
      const { value: inputTag } = input[1]

      const { error, tag } = await deleteNudgeLink(i.guildId, inputTag)

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
            description: `:white_check_mark: **${tag}** was successfully unlinked!`
          }
        ],
        flags: MessageFlags.Ephemeral
      })
    } catch (e) {
      console.log('unlink-player', e)
      return i.editReply({
        embeds: [
          {
            color: red,
            description: '**Unexpected error.**'
          }
        ],
        flags: MessageFlags.Ephemeral
      })
    }
  },
  async run(i) {
    const { targetUser } = i

    const modal = new ModalBuilder().setCustomId('unlink-player').setTitle(`Unlink Player: ${targetUser.tag}`)

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
