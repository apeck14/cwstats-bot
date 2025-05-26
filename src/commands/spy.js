const { getClan, getPlayer, getPlayerBattleLog, searchClans } = require("../util/services")
const { pink } = require("../static/colors")
const { errorMsg, findBestMatch } = require("../util/functions")
const { formatStr, formatTag } = require("../util/formatting")

const specialGamemodes = require("../static/specialGamemodes")

function sharesCards(deck1, deck2) {
  const set2 = new Set(deck2)
  return deck1.some((card) => set2.has(card))
}

function addDeck(deck, duelDecks, singleDecks, type = "duel", emoji = "duel", duelSet = false) {
  const alreadyExists = [...duelDecks, ...singleDecks].some((d) => sharesCards(d.cards, deck))
  if (alreadyExists) return

  if (type === "duel" && !duelSet) {
    // Remove overlapping decks from singles
    for (let i = 0; i < singleDecks.length; i++) {
      if (sharesCards(singleDecks[i].cards, deck)) {
        singleDecks.splice(i, 1)
        i--
      }
    }
    duelDecks.push({ cards: deck, emoji })
  } else {
    singleDecks.push({ cards: deck, emoji })
  }
}

function getCardEmoji(cardName, emojis) {
  const normalized = cardName.toLowerCase().replace(/\s+/g, "_").replace(/\./g, "").replace(/-/g, "_")
  return emojis.get(normalized) || emojis.get("unknown")
}

function formatDeck(cards) {
  return cards.map((c) => `${c.name}${c.evolutionLevel ? " Evo" : ""}`)
}

module.exports = {
  data: {
    description: "View your opponent's war decks.",
    description_localizations: {
      de: "Die Kriegsdecks deines Gegners anzeigen.",
      "es-ES": "Ver los mazos de guerra de tu oponente.",
      fr: "Afficher les decks de guerre de votre adversaire.",
      it: "Visualizza i mazzi di guerra del tuo avversario.",
      nl: "Bekijk de oorlogsdecks van je tegenstander.",
      tr: "Rakibinizin savaş destelerini görüntüleyin.",
    },
    name: "spy",
    name_localizations: {
      de: "spion",
      "es-ES": "espía",
      fr: "espion",
      it: "spia",
      nl: "spion",
      tr: "casus",
    },
    options: [
      {
        description: "Search by player tag",
        description_localizations: {
          de: "Suche nach Spielertag",
          "es-ES": "Búsqueda por etiqueta de jugador",
          fr: "Recherche par tag de joueur",
          it: "Ricerca per tag del giocatore",
          nl: "Zoeken op spelertag",
          tr: "Oyuncu etiketine göre arama",
        },
        name: "-tag",
        name_localizations: {
          de: "-kennzeichnung",
          "es-ES": "-etiqueta",
          fr: "-balise",
          it: "-tag",
          nl: "-tag",
          tr: "-etiket",
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
              tr: "Oyuncu etiketi (#ABC123)",
            },
            name: "tag",
            name_localizations: {
              de: "kennzeichnung",
              "es-ES": "etiqueta",
              fr: "balise",
              it: "tag",
              nl: "tag",
              tr: "etiket",
            },
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
      {
        description: "Search by player + clan name",
        description_localizations: {
          de: "Suche nach Spieler- und Clanname",
          "es-ES": "Buscar por jugador y nombre del clan",
          fr: "Rechercher par nom de joueur et de clan",
          it: "Cerca per nome giocatore e nome clan",
          nl: "Zoek op speler- en clannaam",
          tr: "Oyuncu ve klan adına göre ara",
        },
        name: "-search",
        name_localizations: {
          de: "-suche",
          "es-ES": "-búsqueda",
          fr: "-recherche",
          it: "-ricerca",
          nl: "-zoeken",
          tr: "-arama",
        },
        options: [
          {
            description: "Player name",
            description_localizations: {
              de: "Spielername",
              "es-ES": "Nombre del jugador",
              fr: "Nom du joueur",
              it: "Nome del giocatore",
              nl: "Spelersnaam",
              tr: "Oyuncu adı",
            },
            name: "player",
            name_localizations: {
              de: "spieler",
              "es-ES": "jugador",
              fr: "joueur",
              it: "giocatore",
              nl: "speler",
              tr: "oyuncu",
            },
            required: true,
            type: 3,
          },
          {
            description: "Clan name",
            description_localizations: {
              de: "Clanname",
              "es-ES": "Nombre del clan",
              fr: "Nom du clan",
              it: "Nome del clan",
              nl: "Clannaam",
              tr: "Klan adı",
            },
            name: "clan",
            name_localizations: {
              de: "klan",
              "es-ES": "clan",
              fr: "clan",
              it: "clan",
              nl: "clan",
              tr: "klan",
            },
            required: true,
            type: 3,
          },
        ],
        type: 1,
      },
    ],
  },
  run: async (i, client) => {
    try {
      const iTag = i.options.getString("tag")
      const iClanSearch = i.options.getString("clan")
      const iPlayerSearch = i.options.getString("player")

      let log = []
      const opponent = {
        clan: {
          badge: "no_clan",
          name: "",
          tag: "",
        },
        name: "Not Found",
        tag: "#",
      }

      if (iTag) {
        const { data, error } = await getPlayerBattleLog(iTag)

        if (error || data?.length === 0) {
          const msg = data?.length === 0 ? "**Invalid tag, or no recent battles found for this player.**" : error

          return errorMsg(i, msg)
        }

        const formattedTag = formatTag(iTag)

        opponent.tag = formattedTag

        const lastMatch = data[0].team.find((p) => p.tag === formattedTag)

        if (lastMatch.clan) {
          opponent.name = lastMatch.name
          opponent.clan.name = lastMatch.clan.name
          opponent.clan.tag = lastMatch.clan.tag
        } else {
          // loop through log to find clan data
          for (const m of data) {
            if (opponent.clan.name) break

            const opp = m.team.find((p) => p.tag === formattedTag)

            if (opp.clan) {
              opponent.name = opp.name
              opponent.clan.name = opp.clan.name
              opponent.clan.tag = opp.clan.tag
            }
          }

          if (!opponent.clan.name) {
            const { data: player, error: playerError } = await getPlayer(formattedTag)

            if (playerError) return errorMsg(i, "Error while retrieving player data.")

            opponent.name = player.name
            opponent.clan.name = player.clan.name
            opponent.clan.tag = player.clan.tag
          }
        }

        const { data: clan, error: clanError } = await getClan(opponent.clan.tag, true)
        if (clanError) return errorMsg(i, clanError)

        opponent.clan.badge = clan.badge
        log = data
      } else {
        const { data: clans, error: clanSearchError } = await searchClans(iClanSearch)
        if (clanSearchError) return errorMsg(i, clanSearchError)
        if (!clans || clans.length === 0) return errorMsg(i, "**No clans found.**")

        // * keep slice for limiting to closely named clans from query, then sort
        const topClans = clans
          .slice(0, Math.min(clans.length, 10))
          .sort((a, b) => b.clanWarTrophies - a.clanWarTrophies)

        const topClanTag = topClans[0]?.tag
        const { data: clan, error: clanError } = await getClan(topClanTag)
        if (clanError || !clan) return errorMsg(i, clanError || "**Unable to fetch clan data.**")

        opponent.clan = {
          badge: clan.badge,
          name: clan.name,
          tag: clan.tag,
        }

        const playerNames = clan.memberList.map((p) => p.name)
        const bestMatch = findBestMatch(iPlayerSearch.trim(), playerNames)

        if (bestMatch.rating === 0) {
          return errorMsg(i, "**No player in this clan has a similar name. Please try again.**")
        }

        const player = clan.memberList.find((p) => p.name === bestMatch.str)
        if (!player) {
          return errorMsg(i, "**Matched player not found in member list.**")
        }

        opponent.name = player.name
        opponent.tag = player.tag

        const { data: battleLog, error: battleLogError } = await getPlayerBattleLog(player.tag)
        if (!battleLog || battleLog.length === 0 || battleLogError) {
          const msg =
            !battleLog || battleLog.length === 0 ? "**No recent battles found for this player.**" : battleLogError
          return errorMsg(i, msg)
        }

        log = battleLog
      }

      const duelDecks = [] // { emoji: "", cards: [] }
      const singleDecks = [] // { emoji: "", cards: [] }
      let duelSet = false // if most recent duel has already been set direct other duel decks to singleDecks
      let index = 0

      while (duelDecks.length + singleDecks.length < 4 && index < log.length) {
        const m = log[index]

        if (m.type === "riverRacePvP") {
          let emoji = "normal"

          if (m.gameMode.name !== "CW_Battle_1v1") {
            const modeExists = specialGamemodes.find((gm) => gm.name === m.gameMode.name)
            if (modeExists) emoji = modeExists.emoji
          }

          const deck = formatDeck(m.team[0].cards)

          addDeck(deck, duelDecks, singleDecks, "single", emoji, duelSet)
        } else if (m.type === "riverRaceDuel" || m.type === "riverRaceDuelColosseum") {
          const { rounds } = m.team[0]

          for (const r of rounds) {
            const deck = formatDeck(r.cards)

            addDeck(deck, duelDecks, singleDecks, "duel", "duel", duelSet)
          }

          duelSet = true
        }

        index++
      }

      const badgeEmoji = client.cwEmojis.get(opponent.clan.badge)
      const duelEmoji = client.cwEmojis.get("duel")

      const embed = {
        color: pink,
        title: opponent.name,
        url: `https://cwstats.com/player/${opponent.tag.slice(1)}`,
      }

      let description = `${badgeEmoji} [**${formatStr(
        opponent.clan.name,
      )}**](https://cwstats.com/clan/${opponent.clan.tag.slice(1)})\n`

      if (duelDecks.length > 0) {
        description += `\n**__Duel__** ${duelEmoji}\n`

        for (let i = 0; i < duelDecks.length; i++) {
          let duelStr = `**${i + 1}.** `

          for (const c of duelDecks[i].cards) {
            duelStr += getCardEmoji(c, client.cwEmojis)
          }

          duelStr += "\n"
          description += duelStr
        }
      }

      if (singleDecks.length > 0) {
        description += `\n__**Singles**__\n`

        for (let i = 0; i < singleDecks.length; i++) {
          const matchEmoji = client.cwEmojis.get(singleDecks[i].emoji)

          let str = `**${matchEmoji}:** `

          for (const c of singleDecks[i].cards) {
            str += getCardEmoji(c, client.cwEmojis)
          }

          str += `\n`
          description += str
        }
      }

      if (duelDecks.length + singleDecks.length < 4) {
        description += `\n**${4 - duelDecks.length - singleDecks.length}** deck(s) not found.`

        embed.footer = {
          text: "Battle logs only contain last 25 matches.",
        }
      }

      embed.description = description

      i.editReply({
        embeds: [embed],
      })
    } catch (err) {
      console.log(err)
      console.log(i?.options?._hoistedOptions || i?.options)
    }
  },
}
