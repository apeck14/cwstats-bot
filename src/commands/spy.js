const { getPlayer, getClan, getBattleLog, searchClans } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getClanBadge, getEmoji, errorMsg } = require("../util/functions")
const { formatStr } = require("../util/formatting")

const { diceCoefficient } = require("string-comparison")
const cardInfo = require("../static/cardInfo")
const specialGamemodes = require("../static/specialGamemodes")

module.exports = {
  data: {
    name: "spy",
    description: "View a player's war decks.",
    options: [
      {
        type: 3,
        name: "clan-search",
        description: "Search by clan",
        required: false,
      },
      {
        type: 3,
        name: "player-search",
        description: "Search by player",
        required: false,
      },
      {
        type: 3,
        name: "tag",
        description: "#PLAYERTAG",
        required: false,
      },
    ],
  },
  run: async (i, db) => {
    const iTag = i.options.getString("tag")
    const iClanSearch = i.options.getString("clan-search")
    const iPlayerSearch = i.options.getString("player-search")

    let log = []
    let clanBadge

    if (iTag) {
      const { data, error } = await getBattleLog(iTag)

      if (data.length === 0 || error) {
        const msg = data.length === 0 ? "**Player tag not found.**" : error

        return errorMsg(i, msg)
      }

      const { data: clan, error: clanError } = await getClan(
        data[0].team[0].clan.tag
      )
      if (clanError) return errorMsg(i, clanError)

      clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)
      log = data
    } else if (iClanSearch && iPlayerSearch) {
      const { data: clans, error: clanSearchError } = await searchClans(
        iClanSearch
      )

      if (clanSearchError) return errorMsg(i, clanSearchError)
      if (clans.length === 0) return errorMsg(i, "**No clans found.**")

      const { data: clan, error: clanError } = await getClan(clans[0].tag)
      if (clanError) return errorMsg(i, clanError)

      clanBadge = getClanBadge(clan.badgeId, clan.clanWarTrophies)

      const bestMatchSorted = diceCoefficient.sortMatch(
        iPlayerSearch,
        clan.memberList.map((p) => p.name)
      )

      const bestMatch = bestMatchSorted[bestMatchSorted.length - 1]

      if (bestMatch.rating === 0) {
        return errorMsg(
          i,
          "**No player found in this clan has a similar name. Try again.**"
        )
      }

      const player = clan.memberList.find((p) => p.name === bestMatch.member)

      const { data, error } = await getBattleLog(player.tag)
      if (error) return errorMsg(i, error)

      log = data
    } else {
      return errorMsg(
        i,
        "**Both clan and player name search are required. Otherwise, search by player tag.**"
      )
    }

    const duelDecks = [] // { emoji: "", cards: [] }
    const singleDecks = [] // { emoji: "", cards: [] }
    let duelSet = false //if most recent duel has already been set direct other duel decks to singleDecks
    let index = 0

    const sharesCards = (deck1, deck2) => {
      for (const c of deck1) {
        if (deck2.includes(c)) return true
      }

      return false
    }

    const addDeck = (deck, type = "duel", emoji = "duel") => {
      if (type === "duel") {
        //loop through duel decks
        for (const d of duelDecks) {
          if (sharesCards(d.cards, deck)) return
        }

        if (duelSet) {
          //loop through single decks
          for (const d of singleDecks) {
            if (sharesCards(d.cards, deck)) return
          }

          singleDecks.push({ emoji, cards: deck })
        } else {
          duelDecks.push({ emoji, cards: deck })
        }
      } else {
        //loop through duel decks
        for (const d of duelDecks) {
          if (sharesCards(d.cards, deck)) return
        }

        //loop through single decks
        for (const d of singleDecks) {
          if (sharesCards(d.cards, deck)) return
        }

        singleDecks.push({ emoji, cards: deck })
      }
    }

    while (duelDecks.length + singleDecks.length < 4 && index < log.length) {
      const m = log[index]

      if (m.type === "riverRacePvP") {
        const deck = []

        for (const c of m.team[0].cards) deck.push(c.name)

        let emoji = "normal"

        if (m.gameMode.name !== "CW_Battle_1v1") {
          const modeExists = specialGamemodes.find(
            (gm) => gm.name === m.gameMode.name
          )

          if (modeExists) emoji = modeExists.emoji
        }

        addDeck(deck, "single", emoji)
      } else if (
        m.type === "riverRaceDuel" ||
        m.type === "riverRaceDuelColosseum"
      ) {
        const rounds = m.team[0].rounds

        for (const r of rounds) {
          const deck = []

          for (const c of r.cards) deck.push(c.name)

          addDeck(deck)
        }

        duelSet = true
      }

      index++
    }

    const { name, tag } = log[0].team[0]
    const clanName = log[0].team[0].clan.name

    const badgeEmoji = getEmoji(clanBadge)
    const duelEmoji = getEmoji("duel")

    const embed = {
      color: pink,
      title: `**${name}** (${tag})`,
    }

    let description = `${badgeEmoji} **${formatStr(clanName)}**\n\n`

    if (duelDecks.length > 0) {
      description += `**__Duels__** ${duelEmoji}\n`

      for (let i = 0; i < duelDecks.length; i++) {
        let duelStr = `**${i + 1}.** `

        for (const c of duelDecks[i].cards) {
          const emoji = getEmoji(
            c.toLowerCase().replace(/\s+/g, "_").replace(/\./g, "")
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
        const matchEmoji = getEmoji(singleDecks[i].emoji)

        let str = `**${matchEmoji}:** `

        for (const c of singleDecks[i].cards) {
          const emoji = getEmoji(
            c.toLowerCase().replace(/\s+/g, "_").replace(/\./g, "")
          )

          str += emoji
        }

        str += `\n`
        description += str
      }
    }

    if (duelDecks.length + singleDecks.length < 4) {
      description += `\n**${
        4 - duelDecks.length - singleDecks.length
      }** deck(s) not found.`
    }

    embed.description = description

    await i.editReply({
      embeds: [embed],
    })

    if (duelDecks.length + singleDecks.length < 4) {
      const embed = {
        title: "__Opponent Card Data__",
        description:
          "Use the data below to help predict your oppponent's remaining deck(s)!",
        color: pink,
      }

      const winCons = cardInfo.filter((c) => c.winCon)
      const spells = cardInfo.filter((c) => c.spell)

      const { data: player, error: playerError } = await getPlayer(tag)
      if (playerError)
        return i.followUp({
          embeds: {
            color: orange,
            description: "**Error while gathering player card data.**",
          },
        })

      const cards = player.cards.map((c) => ({
        name: c.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, ""),
        level: 14 - (c.maxLevel - c.level),
      }))

      const remainingWinCons = []
      const remainingSpells = []

      const usedCards = []

      for (const d of duelDecks)
        usedCards.push(
          ...d.cards.map((c) =>
            c.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
          )
        )
      for (const d of singleDecks)
        usedCards.push(
          ...d.cards.map((c) =>
            c.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
          )
        )

      for (const c of cards) {
        if (usedCards.includes(c.name)) continue

        if (winCons.find((ca) => ca.name === c.name)) remainingWinCons.push(c)
        else if (spells.find((ca) => ca.name === c.name))
          remainingSpells.push(c)
      }

      let bestWinConLvl = -1
      let nextWinConLvl = -1
      let bestSpellLvl = -1
      let nextSpellLvl = -1

      for (const c of remainingWinCons) {
        if (c.level > bestWinConLvl) bestWinConLvl = c.level
        else if (c.level > nextWinConLvl && c.level !== bestWinConLvl)
          nextWinConLvl = c.level
      }

      for (const c of remainingSpells) {
        if (c.level > bestSpellLvl) bestSpellLvl = c.level
        else if (c.level > nextSpellLvl && c.level !== bestSpellLvl)
          nextSpellLvl = c.level
      }

      embed.description += `\n\n**__Best Remaining Win-Cons__**\n`
      if (bestWinConLvl === -1) embed.description += "**All win-cons used.**"
      else {
        embed.description += `**Level ${bestWinConLvl}**:\n`
        embed.description += remainingWinCons
          .filter((c) => c.level === bestWinConLvl)
          .map((c) => getEmoji(c.name.replace(/-/g, "_")))
          .join("")

        embed.description += `\n`

        if (nextWinConLvl !== -1) {
          embed.description += `**Level ${nextWinConLvl}**:\n`
          embed.description += remainingWinCons
            .filter((c) => c.level === nextWinConLvl)
            .map((c) => getEmoji(c.name.replace(/-/g, "_")))
        }
      }

      embed.description += `\n\n**__Best Remaining Spells__**\n`
      if (bestSpellLvl === -1) embed.description += "**All spells used.**"
      else {
        embed.description += `**Level ${bestSpellLvl}**:\n`
        embed.description += remainingSpells
          .filter((c) => c.level === bestSpellLvl)
          .map((c) => getEmoji(c.name.replace(/-/g, "_")))
          .join("")

        embed.description += `\n`

        if (nextSpellLvl !== -1) {
          embed.description += `**Level ${nextSpellLvl}**:\n`
          embed.description += remainingSpells
            .filter((c) => c.level === nextSpellLvl)
            .map((c) => getEmoji(c.name.replace(/-/g, "_")))
        }
      }

      i.followUp({
        embeds: [embed],
      })
    } else return
  },
}
