const { getBattleLog, getClan, getPlayer, searchClans } = require("../util/api")
const { pink } = require("../static/colors")
const { errorMsg, findBestMatch, getClanBadge } = require("../util/functions")
const { formatStr, formatTag } = require("../util/formatting")

const specialGamemodes = require("../static/specialGamemodes")

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
        description: "Search by clan name",
        description_localizations: {
          de: "Suche nach Clan-Namen",
          "es-ES": "Búsqueda por nombre de clan",
          fr: "Recherche par nom de clan",
          it: "Ricerca per nome del clan",
          nl: "Zoeken op clannaam",
          tr: "Klan adına göre arama",
        },
        name: "clan-search",
        name_localizations: {
          de: "clan-suche",
          "es-ES": "búsqueda-clan",
          fr: "recherche-clan",
          it: "ricerca-clan",
          nl: "clan-zoeken",
          tr: "klan-arama",
        },
        required: false,
        type: 3,
      },
      {
        description: "Search by player name",
        description_localizations: {
          de: "Suche nach Spielername",
          "es-ES": "Búsqueda por nombre de jugador",
          fr: "Recherche par nom de joueur",
          it: "Ricerca per nome del giocatore",
          nl: "Zoeken op spelersnaam",
          tr: "Oyuncu adına göre arama",
        },
        name: "player-search",
        name_localizations: {
          de: "spieler-suche",
          "es-ES": "búsqueda-jugador",
          fr: "recherche-joueur",
          it: "ricerca-giocatore",
          nl: "speler-zoeken",
          tr: "oyuncu-arama",
        },
        required: false,
        type: 3,
      },
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
        required: false,
        type: 3,
      },
    ],
  },
  run: async (i, db, client) => {
    try {
      const iTag = i.options.getString("tag")
      const iClanSearch = i.options.getString("clan-search")
      const iPlayerSearch = i.options.getString("player-search")

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
        const { data, error } = await getBattleLog(iTag)

        if (data.length === 0 || error) {
          const msg = data.length === 0 ? "**Invalid tag, or no recent battles found for this player.**" : error

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

            if (playerError) {
              return errorMsg(i, "Error while retrieving player data.")
            }

            opponent.name = player.name
            opponent.clan.name = player.clan.name
            opponent.clan.tag = player.clan.tag
          }
        }

        const { data: clan, error: clanError } = await getClan(opponent.clan.tag)
        if (clanError) return errorMsg(i, clanError)

        opponent.clan.badge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
        log = data
      } else if (iClanSearch && iPlayerSearch) {
        // eslint-disable-next-line prefer-const
        let { data: clans, error: clanSearchError } = await searchClans(iClanSearch)

        const indeces = clans.length > 10 ? 10 : clans.length

        clans = clans.slice(0, indeces).sort((a, b) => b.clanWarTrophies - a.clanWarTrophies)

        if (clanSearchError) return errorMsg(i, clanSearchError)
        if (clans.length === 0) return errorMsg(i, "**No clans found.**")

        const { data: clan, error: clanError } = await getClan(clans[0].tag)
        if (clanError) return errorMsg(i, clanError)

        opponent.clan = {
          badge: getClanBadge(clan.badgeId, clan.clanWarTrophies),
          name: clan.name,
          tag: clan.tag,
        }

        const bestMatch = findBestMatch(
          iPlayerSearch.trim(),
          clan.memberList.map((p) => p.name),
        )

        if (bestMatch.rating === 0) {
          return errorMsg(i, "**No player in this clan has a similar name. Please try again.**")
        }

        const player = clan.memberList.find((p) => p.name === bestMatch.str)

        opponent.name = player.name
        opponent.tag = player.tag

        const { data, error } = await getBattleLog(player.tag)

        if (data.length === 0 || error) {
          const msg = data.length === 0 ? "**No recent battles found for this player.**" : error

          return errorMsg(i, msg)
        }

        log = data
      } else {
        return errorMsg(i, "**Both clan and player name search are required. Otherwise, search by player tag.**")
      }

      const duelDecks = [] // { emoji: "", cards: [] }
      const singleDecks = [] // { emoji: "", cards: [] }
      let duelSet = false // if most recent duel has already been set direct other duel decks to singleDecks
      let index = 0

      const sharesCards = (deck1, deck2) => {
        for (const c of deck1) {
          if (deck2.includes(c)) return true
        }

        return false
      }

      const addDeck = (deck, type = "duel", emoji = "duel") => {
        if (type === "duel") {
          // loop through duel decks
          for (const d of duelDecks) {
            if (sharesCards(d.cards, deck)) return
          }

          if (duelSet) {
            // loop through single decks
            for (const d of singleDecks) {
              if (sharesCards(d.cards, deck)) return
            }

            singleDecks.push({ cards: deck, emoji })
          } else {
            // remove from single decks if already added
            for (let i = 0; i < singleDecks.length; i++) {
              const d = singleDecks[i]

              if (sharesCards(d.cards, deck)) {
                singleDecks.splice(i, 1)
              }
            }
            duelDecks.push({ cards: deck, emoji })
          }
        } else {
          // loop through duel decks
          for (const d of duelDecks) {
            if (sharesCards(d.cards, deck)) return
          }

          // loop through single decks
          for (const d of singleDecks) {
            if (sharesCards(d.cards, deck)) return
          }

          singleDecks.push({ cards: deck, emoji })
        }
      }

      while (duelDecks.length + singleDecks.length < 4 && index < log.length) {
        const m = log[index]

        if (m.type === "riverRacePvP") {
          const deck = []

          for (const c of m.team[0].cards) {
            const cardName = `${c.name}${c.evolutionLevel ? " Evo" : ""}`
            deck.push(cardName)
          }

          let emoji = "normal"

          if (m.gameMode.name !== "CW_Battle_1v1") {
            const modeExists = specialGamemodes.find((gm) => gm.name === m.gameMode.name)

            if (modeExists) emoji = modeExists.emoji
          }

          addDeck(deck, "single", emoji)
        } else if (m.type === "riverRaceDuel" || m.type === "riverRaceDuelColosseum") {
          const { rounds } = m.team[0]

          for (const r of rounds) {
            const deck = []

            for (const c of r.cards) {
              const cardName = `${c.name}${c.evolutionLevel ? " Evo" : ""}`
              deck.push(cardName)
            }

            addDeck(deck)
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
            const emoji = client.cwEmojis.get(
              c.toLowerCase().replace(/\s+/g, "_").replace(/\./g, "").replace(/-/g, "_"),
            )

            duelStr += emoji
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
            const emoji = client.cwEmojis.get(
              c.toLowerCase().replace(/\s+/g, "_").replace(/\./g, "").replace(/-/g, "_"),
            )

            str += emoji
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

      return i.editReply({
        embeds: [embed],
      })
    } catch (err) {
      console.log(err)
      console.log(i?.options?._hoistedOptions || i?.options)
    }
  },
}
