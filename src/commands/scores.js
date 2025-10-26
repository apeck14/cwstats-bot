/* eslint-disable camelcase */
const { getLinkedAccount, getPlayerScores } = require('../util/services')
const { errorMsg, warningMsg } = require('../util/functions')
const { pink } = require('../static/colors')
const { formatTag } = require('../util/formatting')

module.exports = {
  data: {
    description: 'View player war scores.',
    description_localizations: {
      de: 'Spieler-Kriegspunkte anzeigen.',
      'es-ES': 'Ver puntuaciones de guerra del jugador.',
      fr: 'Afficher les scores de guerre du joueur.',
      it: 'Visualizza i punteggi di guerra del giocatore.',
      nl: 'Bekijk de oorlogsscores van de speler.',
      'pt-BR': 'Ver pontuações de guerra do jogador.',
      tr: 'Oyuncunun savaş puanlarını görüntüleyin.'
    },
    name: 'scores',
    name_localizations: {
      de: 'spieler',
      'es-ES': 'jugador',
      fr: 'joueur',
      it: 'giocatore',
      nl: 'speler',
      'pt-BR': 'jogador',
      tr: 'oyuncu'
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
        required: false,
        type: 3
      },
      {
        description: 'Select a Discord user',
        description_localizations: {
          de: 'Wähle einen Discord-Benutzer',
          'es-ES': 'Seleccionar un usuario de Discord',
          fr: 'Sélectionnez un utilisateur Discord',
          it: 'Seleziona un utente Discord',
          nl: 'Selecteer een Discord-gebruiker',
          'pt-BR': 'Selecione um usuário do Discord',
          tr: 'Bir Discord kullanıcısı seçin'
        },
        name: 'user',
        name_localizations: {
          de: 'benutzer',
          'es-ES': 'usuario',
          fr: 'utilisateur',
          it: 'utente',
          nl: 'gebruiker',
          'pt-BR': 'usuário',
          tr: 'kullanıcı'
        },
        required: false,
        type: 6
      }
    ]
  },
  run: async (i) => {
    const iUser = i.options.getUser('user')
    const iTag = i.options.getString('tag')

    let tag

    if (!iUser && !iTag) {
      // linked account
      const { data: linkedAccount, error } = await getLinkedAccount(i.user.id)

      if (error) return errorMsg(i, error)

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else return warningMsg(i, `**No tag linked!** Use </link:960088363417882631> to link your tag.`)
    } else if (iTag) tag = iTag
    else {
      // user
      const { data: linkedAccount, error } = await getLinkedAccount(iUser.id)

      if (error) return errorMsg(i, error)

      if (linkedAccount?.tag) tag = linkedAccount.tag
      else return warningMsg(i, `<@!${iUser.id}> **does not have an account linked.**`)
    }

    const { data: scores, error } = await getPlayerScores(tag)

    if (error) return errorMsg(i, error)

    const keys = Object.keys(scores || {})

    if (!keys.length) return warningMsg(i, '**No scores found for this player.**')

    const name = scores[keys[0]][0]?.name || 'Unknown Player'

    const embed = {
      color: pink,
      description: ``,
      thumbnail: {
        url: 'https://i.imgur.com/VAPR8Jq.png'
      },
      title: name,
      url: `https://royaleapi.com/player/${formatTag(tag, false)}`
    }

    embed.description += '### __Stats__\n'

    let totalFame = 0
    let totalAttacks = 0
    const allAverages = []

    // Calculate stats and prepare averages
    for (const w of keys) {
      const weekScores = scores[w]
      let fame = 0
      let attacks = 0

      for (const entry of weekScores) {
        fame += entry.fame || 0
        attacks += entry.attacks || 0
      }

      const avg = attacks > 0 ? fame / attacks : 0
      allAverages.push(avg)

      totalFame += fame
      totalAttacks += attacks
    }

    // Final stats
    const totalAvg = totalAttacks > 0 ? totalFame / totalAttacks : 0
    const last4Avg = allAverages.slice(-4)
    const last4AvgVal = last4Avg.length ? last4Avg.reduce((a, b) => a + b, 0) / last4Avg.length : 0
    const maxAvg = allAverages.length ? Math.max(...allAverages) : 0
    const minAvg = allAverages.length ? Math.min(...allAverages) : 0

    embed.description += `Total Avg: **${totalAvg.toFixed(1)}**\n`
    embed.description += `Last 4 Avg: **${last4AvgVal.toFixed(1)}**\n`
    embed.description += `Max: **${maxAvg.toFixed(1)}**\n`
    embed.description += `Min: **${minAvg.toFixed(1)}**\n`

    // Scores per week
    embed.description += '### __Scores__\n'

    for (const w of keys) {
      const weekScores = scores[w]
      let fame = 0
      let attacks = 0

      for (const entry of weekScores) {
        fame += entry.fame || 0
        attacks += entry.attacks || 0
      }

      embed.description += `**${w}**: ${fame}/${attacks}\n`
    }

    i.editReply({ embeds: [embed] })
  }
}
