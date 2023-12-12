module.exports = {
  data: {
    description: "Donate to support CW2Stats.",
    description_localizations: {
      de: "Spenden Sie, um CWStats zu unterstützen.",
      "es-ES": "Donar para apoyar a CWStats.",
      fr: "Faites un don pour soutenir CWStats.",
      it: "Dona per sostenere CWStats.",
      nl: "Doneer om CWStats te ondersteunen.",
      tr: "CWStats'i desteklemek için bağış yapın.",
    },
    name: "donate",
    name_localizations: {
      de: "spenden",
      "es-ES": "donar",
      fr: "faire-un-don",
      it: "dona",
      nl: "doneren",
      tr: "bağış-yap",
    },
  },
  run: async (i) => {
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
      components: [row],
      embeds: [
        {
          color: 0x3b7bbf,
          description:
            "CW Stats strives to aid all competitive war clans with game-changing data & stats! All proceeds help expand the capabilities of the bot & website.",
          thumbnail: {
            url: "https://w7.pngwing.com/pngs/875/329/png-transparent-paypal-logo-e-commerce-payment-system-paypal-blue-angle-company.png",
          },
          title: "Donate with PayPal",
        },
      ],
    })
  },
}
