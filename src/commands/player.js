const { addPlayer, getClan, getLinkedAccount, getPlayer } = require("../util/services")
const { createPlayerEmbed, errorMsg, warningMsg } = require("../util/functions")

module.exports = {
  data: {
    description: "View player profile stats.",
    description_localizations: {
      de: "Spielerstatistiken anzeigen.",
      "es-ES": "Ver estadísticas del jugador.",
      fr: "Afficher les statistiques du joueur.",
      it: "Visualizza le statistiche del giocatore.",
      nl: "Bekijk spelersstatistieken.",
      "pt-BR": "Ver estatísticas do perfil do jogador.",
      "pt-PT": "Ver estatísticas do perfil do jogador.",
      tr: "Oyuncu istatistiklerini görüntüleyin.",
    },
    name: "player",
    name_localizations: {
      de: "spieler",
      "es-ES": "jugador",
      fr: "joueur",
      it: "giocatore",
      nl: "speler",
      "pt-BR": "jogador",
      "pt-PT": "jogador",
      tr: "oyuncu",
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
          "pt-PT": "Tag do jogador (#ABC123)",
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
          "pt-PT": "tag",
          tr: "etiket",
        },
        required: false,
        type: 3,
      },
      {
        description: "Select a Discord user",
        description_localizations: {
          de: "Wähle einen Discord-Benutzer",
          "es-ES": "Seleccionar un usuario de Discord",
          fr: "Sélectionnez un utilisateur Discord",
          it: "Seleziona un utente Discord",
          nl: "Selecteer een Discord-gebruiker",
          "pt-BR": "Selecione um usuário do Discord",
          "pt-PT": "Selecione um usuário do Discord",
          tr: "Bir Discord kullanıcısı seçin",
        },
        name: "user",
        name_localizations: {
          de: "benutzer",
          "es-ES": "usuario",
          fr: "utilisateur",
          it: "utente",
          nl: "gebruiker",
          "pt-BR": "usuário",
          "pt-PT": "usuário",
          tr: "kullanıcı",
        },
        required: false,
        type: 6,
      },
    ],
  },
  run: async (i, client) => {
    const iUser = i.options.getUser("user")
    const iTag = i.options.getString("tag")

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

    const { data: player, error: playerError } = await getPlayer(tag)

    if (playerError || !player) return errorMsg(i, playerError || "**Player not found.**")

    // add player for website searching
    addPlayer(player.tag)

    const inClan = !!player.clan

    let clanBadge = "no_clan"

    if (inClan) {
      const { data: clan, error: clanError } = await getClan(player.clan.tag, true)

      if (clanError) return errorMsg(i, clanError)

      clanBadge = clan.badge
    }

    const playerEmbedData = createPlayerEmbed(client, player, clanBadge)

    await i.editReply(playerEmbedData)
  },
}
