/* eslint-disable camelcase */
import { ApplicationCommandType } from 'discord.js'

import { createPlayerEmbed, errorMsg, safeEdit } from '../util/functions.js'
import { addPlayer, getClan, getPlayer } from '../util/services.js'

export default {
  data: {
    name: 'Get Player',
    name_localizations: {
      de: 'spieler',
      'es-ES': 'jugador',
      fr: 'joueur',
      it: 'giocatore',
      nl: 'speler',
      'pt-BR': 'jogador',
      tr: 'oyuncu'
    },
    type: ApplicationCommandType.Message
  },
  async run(i, client) {
    const iTag = i.targetMessage.content

    if (!iTag) {
      return errorMsg(i, '**This message has no text content.**')
    }

    const { data: player, error: playerError } = await getPlayer(iTag)

    if (playerError) {
      return errorMsg(i, playerError)
    }

    // add player for website searching
    addPlayer(iTag)

    const inClan = !!player.clan

    let clanBadge = 'no_clan'

    if (inClan) {
      const { data: clan, error: clanError } = await getClan(player.clan.tag, true)

      if (clanError) {
        return errorMsg(i, clanError)
      }

      clanBadge = clan.badge
    }

    const playerEmbedData = createPlayerEmbed(client, player, clanBadge)

    safeEdit(i, playerEmbedData)
  }
}
