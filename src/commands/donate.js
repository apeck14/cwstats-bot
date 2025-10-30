/* eslint-disable camelcase */
import { pink } from '../static/colors.js'

export default {
  data: {
    description: 'Donate to support CW2Stats.',
    description_localizations: {
      de: 'Spenden Sie, um CWStats zu unterstützen.',
      'es-ES': 'Donar para apoyar a CWStats.',
      fr: 'Faites un don pour soutenir CWStats.',
      it: 'Dona per sostenere CWStats.',
      nl: 'Doneer om CWStats te ondersteunen.',
      'pt-BR': 'Doe para apoiar o CW2Stats.',
      tr: "CWStats'i desteklemek için bağış yapın."
    },
    name: 'donate',
    name_localizations: {
      de: 'spenden',
      'es-ES': 'donar',
      fr: 'faire-un-don',
      it: 'dona',
      nl: 'doneren',
      'pt-BR': 'doar',
      tr: 'bağış-yap'
    }
  },
  async run(i) {
    const row = {
      components: [
        {
          label: 'PayPal',
          style: 5,
          type: 2,
          url: 'https://paypal.me/cw2stats'
        },
        {
          label: 'BuyMeACoffee',
          style: 5,
          type: 2,
          url: 'https://buymeacoffee.com/cwstats'
        },
        {
          label: 'Patreon',
          style: 5,
          type: 2,
          url: 'https://www.patreon.com/CWStats'
        }
      ],
      type: 1
    }

    return i.editReply({
      components: [row],
      embeds: [
        {
          color: pink,
          description:
            'CWStats strives to aid all competitive war clans with game-changing data & stats! All proceeds help expand the capabilities of the bot & website.',
          thumbnail: {
            url: 'https://i.imgur.com/VAPR8Jq.png'
          },
          title: 'Support CWStats!'
        }
      ]
    })
  }
}
