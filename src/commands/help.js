/* eslint-disable camelcase */
const { pink } = require('../static/colors')

module.exports = {
  data: {
    description: 'Need help? Get started here.',
    description_localizations: {
      de: 'Brauchen Sie Hilfe? Starten Sie hier.',
      'es-ES': '¿Necesitas ayuda? Comienza aquí.',
      fr: "Besoin d'aide ? Commencez ici.",
      it: 'Hai bisogno di aiuto? Inizia qui.',
      nl: 'Hulp nodig? Begin hier.',
      'pt-BR': 'Precisa de ajuda? Comece aqui.',
      tr: 'Yardıma mı ihtiyacınız var? Buradan başlayın.'
    },
    name: 'help',
    name_localizations: {
      de: 'hilfe',
      'es-ES': 'ayuda',
      fr: 'aide',
      it: 'aiuto',
      nl: 'help',
      'pt-BR': 'ajuda',
      tr: 'yardım'
    }
  },
  run: async (i) => {
    const embed = {
      color: pink,
      description: `### [**Getting Started**](https://www.cwstats.com/docs/getting-started)\nFollow simple setup instructions to help you get started using CWStats!\n### [**Support Server**](https://discord.com/invite/fFY3cnMmnH)\nHave questions, feature requests, or bug findings? Join the Support Server.`,
      thumbnail: {
        url: 'https://i.imgur.com/VAPR8Jq.png'
      },
      title: '__Need Help?__'
    }

    return i.editReply({
      embeds: [embed]
    })
  }
}
