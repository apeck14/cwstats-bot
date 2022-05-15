const { getPlayer } = require("../util/api")
const { orange, pink } = require("../static/colors")
const { getEmoji, getArenaEmoji, getDeckUrl, errorMsg } = require("../util/functions")
const allCards = require("../static/cardInfo.js")
const { filter } = require("lodash")

module.exports = {
	disabled: false,
	data: {
		name: "decks",
		description: "Find top deck sets based for any player!",
		options: [
			{
				type: 3,
				name: "tag",
				description: "#PLAYERTAG",
				required: false,
			},
			{
				type: 6,
				name: "user",
				description: "User to view.",
				required: false,
			},
			{
				type: 3,
				name: "exclude-cards",
				description: "Cards to exclude (separate card names with a comma)",
				required: false,
			},
			{
				type: 3,
				name: "include-cards",
				description: "Cards to include (separate card names with a comma)",
				required: false,
			},
		],
	},
	run: async (i, db, client) => {
		const linkedAccounts = db.collection("Linked Accounts")
		const decks = db.collection("Decks")

		const user = i.options.getUser("user")
		const iTag = i.options.getString("tag")

		let tag

		if (!user && !iTag) {
			//linked account
			const linkedAccount = await linkedAccounts.findOne({ discordID: i.user.id })

			if (linkedAccount?.tag) tag = linkedAccount.tag
			else return i.editReply({ embeds: [{ color: orange, description: `**No tag linked!**` }], ephemeral: true })
		} else if (iTag) tag = iTag //tag
		else {
			//user
			const linkedAccount = await linkedAccounts.findOne({ discordID: user.id })

			if (linkedAccount?.tag) tag = linkedAccount.tag
			else
				return i.editReply({
					embeds: [{ color: orange, description: `<@!${user.id}> **does not have an account linked.**` }],
					ephemeral: true,
				})
		}

		const { data: player, error } = await getPlayer(tag)

		if (error) return errorMsg(i, error)

		let excludedCards = i.options
			.getString("exclude-cards")
			?.split(",")
			?.map((alias) => {
				alias = alias.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
				const card = allCards.find((c) => c.name === alias || c.aliases.includes(alias))

				return card?.name || null
			})
			.filter((c) => c) //list of card names that cant be used

		excludedCards = [...new Set(excludedCards)]

		if (excludedCards.length > 10)
			return i.editReply({ embeds: [{ color: orange, description: "**You can only exclude up to 10 cards.**" }], ephemeral: true })

		let includedCards = i.options
			.getString("include-cards")
			?.split(",")
			?.map((alias) => {
				alias = alias.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
				const card = allCards.find((c) => c.name === alias || c.aliases.includes(alias))

				return card?.name || null
			})
			.filter((c) => c && !excludedCards.includes(c)) //list of card names that cant be used

		includedCards = [...new Set(includedCards)]

		if (includedCards.length > 10)
			return i.editReply({ embeds: [{ color: orange, description: "**You can only include up to 10 cards.**" }], ephemeral: true })

		player.cards = player.cards.map((c) => ({
			//rename all cards, and give level
			name: c.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, ""),
			level: 14 - (c.maxLevel - c.level),
		}))

		const cardsThatCanBeUnderLeveled = allCards.filter((c) => c.canBeUnderLeveled).map((c) => c.name)

		let cardsAvailable = []
		let lastLvlAdded

		for (let lvl = 14; lvl >= 1; lvl--) {
			//add cards available for use
			const sameLevelCards = player.cards.filter((c) => c.level === lvl)

			if (sameLevelCards.length === 0) continue

			//add cards
			for (const c of sameLevelCards) {
				if (!cardsAvailable.includes(c.name) && !excludedCards.includes(c.name))
					//not already in cardsAvailable & not in excludedCards
					cardsAvailable.push(c.name)
			}

			//check for usable underleveled cards
			for (const c of cardsThatCanBeUnderLeveled) {
				const card = player.cards.find((ca) => ca.name === c)

				if (!card || cardsAvailable.includes(c) || excludedCards.includes(c)) continue

				if (lvl - card.level <= 2)
					//add card if 2 levels or less below current lvl
					cardsAvailable.push(c)
			}

			lastLvlAdded = lvl

			if (cardsAvailable.length >= 32) break
		}

		if (cardsAvailable.length < 32)
			//less than 32 cards unlocked
			return i.editReply({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] })

		let allDecks = await decks.find({}).sort({ rating: -1, dateAdded: 1 }).toArray()

		const deckSetRating = (deckSetArr) => {
			let sum = 0
			for (let i = 0; i < deckSetArr.length; i++) {
				sum += deckSetArr[i].rating
			}

			return sum / deckSetArr.length
		}

		const allCardsAvailable = (deckObj) => {
			for (let i = 0; i < deckObj.cards.length; i++) {
				if (!cardsAvailable.includes(deckObj.cards[i])) return false
			}

			return true
		}

		const shareCards = (...decks) => {
			const unique = new Set()
			for (const deck of decks) {
				for (const card of deck.cards) {
					if (unique.has(card)) return true
					unique.add(card)
				}
			}
			return false
		}

		const containsAllIncludedCards = (deck1, deck2, deck3, deck4) => {
			//return true if all of ...includedCards exist in any of the 4 decks
			for (const c of includedCards) {
				if (!deck1.cards.includes(c) && !deck2.cards.includes(c) && !deck3.cards.includes(c) && !deck4.cards.includes(c))
					return false
			}

			return true
		}

		const deckSet = []

		main: while (deckSet.length === 0) {
			const tempAllDecks = filter(allDecks, allCardsAvailable)

			for (let i = 0, len = tempAllDecks.length; i < len - 3; i++) {
				const deck1 = tempAllDecks[i]

				for (let x = i + 1; x < len - 2; x++) {
					const deck2 = tempAllDecks[x]

					if (shareCards(deck1, deck2)) continue

					for (let y = x + 1; y < len - 1; y++) {
						const deck3 = tempAllDecks[y]

						if (shareCards(deck1, deck2, deck3)) continue

						for (let z = y + 1; z < len; z++) {
							const deck4 = tempAllDecks[z]

							if (shareCards(deck1, deck2, deck3, deck4)) continue
							if (!containsAllIncludedCards(deck1, deck2, deck3, deck4)) continue

							deckSet.push(deck1, deck2, deck3, deck4)
							break main
						}
					}
				}
			}

			lastLvlAdded--

			const newCardsToAdd = player.cards
				.filter((c) => c.level === lastLvlAdded && !cardsAvailable.includes(c.name) && !excludedCards.includes(c.name))
				.map((c) => c.name)

			cardsAvailable.push(...newCardsToAdd)

			if (lastLvlAdded <= 0) break main
		}

		if (deckSet.length === 0) {
			if (includedCards.length > 0)
				return i.editReply({
					embeds: [{ color: orange, description: `**No deck sets found.** Try changing the search parameters.` }],
				})

			//no deck sets found
			return i.editReply({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] })
		}

		const getAvgCardLvl = (deckSet) => {
			let sum = 0

			for (const d of deckSet) {
				for (const c of d.cards) {
					const card = player.cards.find((ca) => ca.name === c)
					sum += card.level
				}
			}

			return sum / 32
		}

		const embed = {
			title: `${getEmoji(client, getArenaEmoji(player.bestTrophies))} ${player.name} | ${player.tag}`,
			description: ``,
			color: pink,
			footer: {
				text: "Deck ratings are calculated from win % and usage rate",
			},
		}

		embed.description += `**Included Cards**: ${includedCards.map((c) => getEmoji(client, c.replace(/-/g, "_"))).join("") || "None"}`

		embed.description += `\n**Excluded Cards**: ${excludedCards.map((c) => getEmoji(client, c.replace(/-/g, "_"))).join("") || "None"}`

		//best deck set
		embed.description += `\n\n**__Best War Deck Set__**\nRating: **${deckSetRating(deckSet).toFixed(
			1
		)}**\nAvg. Level: **${getAvgCardLvl(deckSet).toFixed(1)}**\n`

		const copyEmoji = getEmoji(client, "copy")

		embed.description += `${deckSet
			.map(
				(d) =>
					`[**Copy**](${getDeckUrl(d.cards)})${copyEmoji}: ${d.cards
						.map((c) => getEmoji(client, c.replace(/-/g, "_")))
						.join("")}\n`
			)
			.join("")}`

		return i.editReply({ embeds: [embed] })
	},
}
