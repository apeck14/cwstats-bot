module.exports = {
  data: {
    name: "donate",
    name_localizations: {
      de: "spenden",
      fr: "faire-un-don",
      "es-ES": "donar",
      tr: "bağış-yap",
      it: "dona",
      nl: "doneren",
    },
    description: "Donate to support CW2Stats.",
    description_localizations: {
      de: "Spenden Sie, um CWStats zu unterstützen.",
      fr: "Faites un don pour soutenir CWStats.",
      "es-ES": "Donar para apoyar a CWStats.",
      tr: "CWStats'i desteklemek için bağış yapın.",
      it: "Dona per sostenere CWStats.",
      nl: "Doneer om CWStats te ondersteunen.",
    },
  },
  run: async (i, db, client) => {
    const row = {
      components: [
        {
          label: "Donate",
          style: 5,
          type: 2,
          url: "https://paypal.me/cw2stats",
        },
      ],
      type: 1,
    }

    return i.editReply({
      embeds: [
        {
          title: "Donate with PayPal",
          description:
            "CW Stats strives to aid all competitive war clans with game-changing data & stats! All proceeds help expand the capabilities of the bot & website.",
          color: 0x3b7bbf,
          thumbnail: {
            url: "https://w7.pngwing.com/pngs/875/329/png-transparent-paypal-logo-e-commerce-payment-system-paypal-blue-angle-company.png",
          },
        },
      ],
      components: [row],
    })
  },
}
