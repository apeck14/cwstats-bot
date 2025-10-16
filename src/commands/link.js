const { addPlayer, linkPlayer } = require("../util/services")
const { formatStr, formatTag } = require("../util/formatting")
const { errorMsg, successMsg, warningMsg } = require("../util/functions")

module.exports = {
  data: {
    description: "Link your Clash Royale account to Discord.",
    description_localizations: {
      de: "Verknüpfe dein Clash Royale-Konto mit Discord.",
      "es-ES": "Vincula tu cuenta de Clash Royale con Discord.",
      fr: "Liez votre compte Clash Royale à Discord.",
      it: "Collega il tuo account Clash Royale a Discord.",
      nl: "Koppel uw Clash Royale-account aan Discord.",
      "pt-BR": "Vincule sua conta Clash Royale ao Discord.",
      tr: "Clash Royale hesabınızı Discord ile bağlayın.",
    },
    name: "link",
    name_localizations: {
      de: "verbinden",
      "es-ES": "enlazar",
      fr: "lier",
      it: "collega",
      nl: "koppelen",
      "pt-BR": "vincular",
      tr: "bağlantı",
    },
    options: [
      {
        description: "Player tag (#ABC123)",
        description_localizations: {
          de: "Spielertag (#ABC123)",
          "es-ES": "Etiqueta del jugador (#ABC123)",
          fr: "Tag du joueur (#ABC123)",
          it: "Tag del giocatore (#ABC123)",
          nl: "Spelertag (#ABC123)",
          "pt-BR": "Tag do jogador (#ABC123)",
          tr: "Oyuncu etiketi (#ABC123)",
        },
        name: "tag",
        name_localizations: {
          de: "kennzeichnung",
          "es-ES": "etiqueta",
          fr: "balise",
          it: "tag",
          nl: "tag",
          "pt-BR": "tag",
          tr: "etiket",
        },
        required: true,
        type: 3,
      },
    ],
  },
  run: async (i) => {
    const iTag = i.options.getString("tag")
    const formattedTag = formatTag(iTag, false)

    // add player for website searching
    addPlayer(formattedTag)

    const { error, name, result, success } = await linkPlayer(formattedTag, i.user.id)

    if (error) {
      return errorMsg(i, error)
    }

    // tag already linked
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
      return warningMsg(i, "**You have already linked that tag!**")
    }

    if (success) {
      return successMsg(i, `\u202A✅ Account linked to **${formatStr(name)}**!`)
    }

    return errorMsg(i, "**Unexpected error.** Please try again.")
  },
}
