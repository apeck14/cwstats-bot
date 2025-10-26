/* eslint-disable camelcase */
const { pink } = require('../static/colors')
const { formatStr } = require('../util/formatting')
const { errorMsg } = require('../util/functions')
const { getGuild } = require('../util/services')

module.exports = {
  data: {
    description: 'View all abbreviations for this server.',
    description_localizations: {
      de: 'Alle Abkürzungen für diesen Server anzeigen.',
      'es-ES': 'Ver todas las abreviaturas de este servidor.',
      fr: 'Voir toutes les abréviations pour ce serveur.',
      it: 'Visualizza tutte le abbreviazioni per questo server.',
      nl: 'Bekijk alle afkortingen voor deze server.',
      'pt-BR': 'Ver todas as abreviações deste servidor.',
      tr: 'Bu sunucudaki tüm kısaltmaları görüntüleyin.'
    },
    name: 'abbreviations',
    name_localizations: {
      de: 'abkürzungen',
      'es-ES': 'abreviaturas',
      fr: 'abréviations',
      it: 'abbreviazioni',
      nl: 'afkortingen',
      'pt-BR': 'abreviações',
      tr: 'kısaltmalar'
    }
  },
  async run(i) {
    const { data: guild, error } = await getGuild(i.guildId, true)
    const { abbreviations, defaultClan } = guild || {}

    if (error) {
      return errorMsg(i, error)
    }

    const embed = {
      color: pink,
      description: '**__Default Clan__**\n',
      thumbnail: {
        url: i.guild.iconURL() || 'https://i.imgur.com/VAPR8Jq.png'
      },
      title: '__**Server Abbreviations**__',
      url: `https://cwstats.com/me/servers/${i.guildId}`
    }

    embed.description += defaultClan ? `**${defaultClan.name}**` : '*None*'

    embed.description += '\n\n**__Abbreviations__**'

    if (abbreviations?.length > 0) {
      abbreviations.sort((a, b) => a.abbr.localeCompare(b.abbr))

      embed.description += `${abbreviations.map((a) => `\n\u202A• **${a.abbr.toLowerCase()}**: ${formatStr(a.name)}`).join('')}`
    } else {
      embed.description += '\n*None*'
    }

    return i.editReply({
      embeds: [embed]
    })
  }
}
