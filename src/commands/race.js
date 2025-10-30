/* eslint-disable camelcase */
import { pink } from '../static/colors.js'
import { formatPlace, formatStr } from '../util/formatting.js'
import { errorMsg, warningMsg } from '../util/functions.js'
import { getGuild, getRace } from '../util/services.js'

export default {
  data: {
    description: 'View current river race stats and projections.',
    description_localizations: {
      de: 'Aktuelle Flussrennen-Statistiken und Prognosen anzeigen.',
      'es-ES': 'Ver estadísticas y proyecciones de la carrera fluvial actual.',
      fr: 'Afficher les statistiques et les projections de la course sur la rivière en cours.',
      it: 'Visualizza le statistiche e le previsioni della gara fluviale in corso.',
      nl: 'Bekijk de huidige rivier race statistieken en projecties.',
      'pt-BR': 'Ver estatísticas e projeções da corrida atual do rio.',
      tr: 'Mevcut nehir yarışı istatistiklerini ve projeksiyonlarını görüntüleyin.'
    },
    name: 'race',
    name_localizations: {
      de: 'rennen',
      'es-ES': 'carrera',
      fr: 'course',
      it: 'corsa',
      nl: 'race',
      'pt-BR': 'corrida',
      tr: 'yarış'
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
  async run(i, client) {
    const { data: guild, error: guildError } = await getGuild(i.guildId, true)

    if (guildError || !guild) {
      return errorMsg(i, guildError || '**Guild not found.**')
    }

    let tag = i.options.getString('tag')
    const { abbreviations, defaultClan } = guild

    // default clan
    if (!tag) {
      if (defaultClan?.tag) {
        tag = defaultClan.tag
      } else {
        return warningMsg(
          i,
          `**No default clan set.** Set the server default clan [here](https://www.cwstats.com/me/servers/${i.guildId}).`
        )
      }
    } else {
      // abbreviation
      const UPPERCASE_ABBR = tag.toUpperCase()
      const abbr = abbreviations?.find((a) => a.abbr.toUpperCase() === UPPERCASE_ABBR)

      if (abbr) {
        tag = abbr.tag
      } else if (tag.length < 3) {
        return warningMsg(i, '**Abbreviation does not exist.**')
      }
    }

    const { data: race, error: raceError } = await getRace(tag)

    if (raceError) {
      return errorMsg(i, raceError)
    }

    if (race.state === 'matchmaking') {
      return warningMsg(i, ':mag: **Matchmaking is underway!**')
    }

    if (!race.clans || !race.clans.length) {
      return warningMsg(i, '**Clan is not in a river race.**')
    }

    const { clanIndex, clans, dayIndex, isColosseum, isTraining, sectionIndex } = race
    const { tag: clanTag } = clans[clanIndex]

    const embed = {
      author: {
        name: `Week ${sectionIndex + 1} | ${isTraining ? 'Training' : 'War'} Day ${isTraining ? dayIndex + 1 : dayIndex - 2}`
      },
      color: pink,
      description: '',
      thumbnail: {
        url: 'https://i.imgur.com/VAPR8Jq.png'
      },
      title: isColosseum ? '**__Colosseum__**' : '**__River Race__**',
      url: `https://www.cwstats.com/clan/${clanTag.substring(1)}/race`
    }

    const fameEmoji = client.cwEmojis.get('fame')
    const fameAvgEmoji = client.cwEmojis.get('fameAvg')
    const decksRemainingEmoji = client.cwEmojis.get('decksRemaining')
    const projectionEmoji = client.cwEmojis.get('projection')
    const flagEmoji = client.cwEmojis.get('flag')

    let passedFinishLine = true

    for (const c of clans) {
      const { badge, crossedFinishLine, currentPlace, decksUsed, fame, fameAvg, name, projFame, projPlace, tag } = c

      const badgeEmoji = client.cwEmojis.get(badge)
      const isClan = tag === clanTag
      const formattedClanName = `${badgeEmoji} **${isClan ? '__' : ''}${formatStr(name)}${isClan ? '__' : ''}**\n`

      if (!crossedFinishLine && passedFinishLine) {
        embed.description += '\n'
        passedFinishLine = false
      }

      if (crossedFinishLine) {
        embed.description += `${flagEmoji} ${formattedClanName}`
      } else if (!isTraining && currentPlace > 0) {
        const formattedProjPlace = formatPlace(projPlace)
        const decksRemaining = 200 - decksUsed

        embed.description += `\u202A**${currentPlace}.**${formattedClanName}`
        embed.description += `${fameEmoji} ${fame}\n`
        embed.description += `${projectionEmoji} ${projFame} (${formattedProjPlace})\n`
        embed.description += `${decksRemainingEmoji} ${decksRemaining}\n`
        embed.description += `${fameAvgEmoji} **${fameAvg.toFixed(2)}**\n\n`
      } else {
        embed.description += `\u202A${formattedClanName}\n`
      }
    }

    i.editReply({
      embeds: [embed]
    })
  }
}
