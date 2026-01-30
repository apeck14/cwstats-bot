/* eslint-disable camelcase */
import { formatStr } from '../util/formatting.js'
import { createPlayerEmbed, errorMsg, successMsg, warningMsg } from '../util/functions.js'
import { getClan, getGuild, getPlayer } from '../util/services.js'

export default {
  data: {
    description: 'Apply to join the clan.',
    description_localizations: {
      de: 'Bewerben Sie sich, um dem Clan beizutreten.',
      'es-ES': 'Solicita unirte al clan.',
      fr: 'Postulez pour rejoindre le clan.',
      it: 'Richiedi di unirti al clan.',
      nl: 'Solliciteer om lid te worden van de clan.',
      'pt-BR': 'Candidate-se para entrar no clã.',
      tr: 'Klana katılmak için başvurun.'
    },
    name: 'apply',
    name_localizations: {
      de: 'bewerben',
      'es-ES': 'solicitar',
      fr: 'postuler',
      it: 'applica',
      nl: 'solliciteren',
      'pt-BR': 'candidatar',
      tr: 'başvur'
    },
    options: [
      {
        description: 'Player tag (#ABC123)',
        description_localizations: {
          de: 'Spielertag (#ABC123)',
          'es-ES': 'Etiqueta del jugador (#ABC123)',
          fr: 'Tag du joueur (#ABC123)',
          it: 'Tag del giocatore (#ABC123)',
          nl: 'Spelertag (#ABC123)',
          'pt-BR': 'Tag do jogador (#ABC123)',
          tr: 'Oyuncu etiketi (#ABC123)'
        },
        name: 'tag',
        name_localizations: {
          de: 'kennzeichnung',
          'es-ES': 'etiqueta',
          fr: 'balise',
          it: 'tag',
          nl: 'tag',
          'pt-BR': 'tag',
          tr: 'etiket'
        },
        required: true,
        type: 3
      }
    ]
  },
  async run(i, client) {
    const { data: guild, error: guildError } = await getGuild(i.guildId, true)

    if (guildError) {
      return errorMsg(i, guildError)
    }

    const { applicationsChannelID } = guild.channels || {}

    const APPLICATIONS_CHANNEL = applicationsChannelID && client.channels.cache.get(applicationsChannelID)

    if (!APPLICATIONS_CHANNEL) {
      const msg = `The set **applications** channel has been deleted. Please set the new channel [here](https://www.cwstats.com/me/servers/${i.guildId}/channels).`
      return warningMsg(i, msg)
    }

    const iTag = i.options.getString('tag')

    const { data: player, error: playerError } = await getPlayer(iTag)

    if (playerError) {
      return errorMsg(i, playerError)
    }

    const inClan = !!player.clan

    let clanBadge = 'no_clan'

    if (inClan) {
      const { data: clan, error: clanError } = await getClan(player.clan.tag)

      if (clanError) {
        return errorMsg(i, clanError)
      }

      clanBadge = clan.badge
    }

    const playerEmbedData = createPlayerEmbed(client, player, clanBadge)

    playerEmbedData.embeds[0].description += `\n\n**Request By**: <@!${i.user.id}>`

    successMsg(i, `✅ Request sent for **${formatStr(player.name)}**! A Co-Leader will contact you shortly.`)

    return APPLICATIONS_CHANNEL.send(playerEmbedData)
  }
}
