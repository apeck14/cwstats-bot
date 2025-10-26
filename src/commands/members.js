/* eslint-disable camelcase */
const { getClan, getGuild } = require('../util/services')
const { pink } = require('../static/colors')
const { errorMsg, warningMsg } = require('../util/functions')
const { formatRole, formatStr } = require('../util/formatting')

module.exports = {
  data: {
    description: 'View all members in a clan.',
    description_localizations: {
      de: 'Alle Mitglieder eines Clans anzeigen.',
      'es-ES': 'Ver todos los miembros de un clan.',
      fr: "Afficher tous les membres d'un clan.",
      it: 'Visualizza tutti i membri di un clan.',
      nl: 'Bekijk alle leden van een clan.',
      'pt-BR': 'Ver todos os membros de um clã.',
      tr: 'Bir klanın tüm üyelerini görüntüleyin.'
    },
    name: 'members',
    name_localizations: {
      de: 'mitglieder',
      'es-ES': 'miembros',
      fr: 'membres',
      it: 'membri',
      nl: 'leden',
      'pt-BR': 'membros',
      tr: 'üyeler'
    },
    options: [
      {
        description: 'Clan tag (#ABC123) or abbreviation',
        description_localizations: {
          de: 'Clan-Tag (#ABC123) oder Abkürzung',
          'es-ES': 'Etiqueta del clan (#ABC123) o abreviatura',
          fr: 'Tag du clan (#ABC123) ou abréviation',
          it: 'Tag del clan (#ABC123) o abbreviazione',
          nl: 'Clan tag (#ABC123) of afkorting',
          'pt-BR': 'Tag do clã (#ABC123) ou abreviação',
          tr: 'Klan etiketi (#ABC123) veya kısaltma'
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
        required: false,
        type: 3
      }
    ]
  },

  run: async (i, client) => {
    const { data: guild, error: guildError } = await getGuild(i.guildId, true)
    if (guildError) return errorMsg(i, guildError)

    const { abbreviations, defaultClan } = guild
    let iTag = i.options.getString('tag')

    // Default clan fallback
    if (!iTag) {
      if (defaultClan?.tag) iTag = defaultClan.tag
      else return warningMsg(i, `**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me/servers/${i.guildId}).`)
    } else {
      // Handle abbreviation
      const UPPERCASE_ABBR = iTag.toUpperCase()
      const abbr = abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)
      if (abbr) iTag = abbr.tag
      else if (iTag.length < 3) return warningMsg(i, '**Abbreviation does not exist.**')
    }

    // Fetch clan
    const { data: clan, error: clanError } = await getClan(iTag)
    if (clanError) return errorMsg(i, clanError)

    const { badge, memberList, name, tag } = clan
    const badgeEmoji = client.cwEmojis.get(badge)
    const socialEmoji = client.cwEmojis.get('social')

    // Sort members alphabetically
    memberList.sort((a, b) => a.name.localeCompare(b.name))

    // Group by role
    const roles = {
      coLeader: [],
      elder: [],
      leader: [],
      member: []
    }

    for (const m of memberList) {
      if (roles[m.role]) roles[m.role].push(m)
    }

    const embed = {
      color: pink,
      description: '',
      title: `**__${formatStr(name)}__**`,
      url: `https://cwstats.com/clan/${tag.substring(1)}`
    }

    embed.description += `${badgeEmoji} **${name}**\n${socialEmoji} **${memberList.length}**/50\n`

    // Build role sections in order
    const roleOrder = ['leader', 'coLeader', 'elder', 'member']

    for (const roleKey of roleOrder) {
      const group = roles[roleKey]
      if (group.length === 0) continue

      const isLeader = roleKey === 'leader'

      embed.description += `\n${isLeader ? '' : '\n'}**__${formatRole(roleKey)}__** ${isLeader ? '' : `(${group.length})`}\n`
      embed.description += group.map((m) => `• ${formatStr(m.name)}`).join('\n')
    }

    return i.editReply({ embeds: [embed] })
  }
}
