const { getPlayer } = require("../util/api")
const { orange, pink } = require("../static/colors")
const {
	getEmoji,
	getArenaEmoji,
	getDeckUrl,
	errorMsg,
	hasDuplicateCard,
	deckSetAvgLvl,
	deckSetAvgDeckRating,
	deckSetScore,
	allIncludedCardsInSet,
	hasLockedCard,
} = require("../util/functions")
const allCards = require("../static/cardInfo.js")
const { MessageActionRow } = require("discord.js")

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
			{
				type: 3,
				name: "sort-by",
				description: "Filter decks in order by...",
				required: false,
				choices: [
					{ name: "Recommended (Default)", value: "score" },
					{ name: "Rating", value: "avgRating" },
					{ name: "Card Level", value: "avgCardLvl" },
				],
			},
		],
	},
	run: async (i, db) => {
		const linkedAccounts = db.collection("Linked Accounts")
		const decks = db.collection("Decks")

		const user = i.options.getUser("user")
		const iTag = i.options.getString("tag")

		let tag

		if (!user && !iTag) {
			//linked account
			const linkedAccount = await linkedAccounts.findOne({ discordID: i.user.id })

			if (linkedAccount?.tag) tag = linkedAccount.tag
			else return i.editReply({ embeds: [{ color: orange, description: `**No tag linked!** Use **/link** to link your tag.` }], ephemeral: true })
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

		const excludedCards = [
			...new Set(
				i.options
					.getString("exclude-cards")
					?.split(",")
					?.map((alias) => {
						alias = alias.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
						const card = allCards.find((c) => c.name === alias || c.aliases.includes(alias))

						return card?.name || null
					})
					.filter((c) => c)
			),
		]

		if (excludedCards.length > 10) return i.editReply({ embeds: [{ color: orange, description: "**You can only exclude up to 10 cards.**" }], ephemeral: true })

		const includedCards = [
			...new Set(
				i.options
					.getString("include-cards")
					?.split(",")
					?.map((alias) => {
						alias = alias.trim().toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")
						const card = allCards.find((c) => c.name === alias || c.aliases.includes(alias))

						return card?.name || null
					})
					.filter((c) => c && !excludedCards.includes(c))
			),
		]

		if (includedCards.length > 10) return i.editReply({ embeds: [{ color: orange, description: "**You can only include up to 10 cards.**" }], ephemeral: true })

		const { data: player, error } = await getPlayer(tag)
		if (error) return errorMsg(i, error)

		player.cards = player.cards.map((c) => ({
			//rename all cards, and give level
			name: c.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, ""),
			level: 14 - (c.maxLevel - c.level),
		}))

		//query all decks that don't contain excluded cards
		let allDecks = await decks
			.find({ cards: { $nin: excludedCards } })
			.sort({ rating: -1 })
			.toArray()

		const playerCardsSet = new Set(player.cards.map((c) => c.name))

		allDecks = allDecks.filter((d) => !hasLockedCard(d.cards, playerCardsSet))

		function findNextUnique(deckSet, remainingDecks) {
			for (let i = 0; i < remainingDecks.length; i++) {
				const deckCards = remainingDecks[i].cards
				if (!hasDuplicateCard(deckSet.cards, deckCards)) {
					return {
						cards: new Set([...Array.from(deckSet.cards), ...deckCards]),
						decks: [...deckSet.decks, remainingDecks[i]],
						lastIndex: i,
					}
				}
			}
		}

		function findUniques() {
			const unqiueDeckCombos = []

			for (let i = 0; i < allDecks.length; i++) {
				const deckSet = {
					cards: new Set(allDecks[i].cards),
					decks: [allDecks[i]],
					lastIndex: 0,
				}

				for (let k = i + 1; k < allDecks.length - (4 - deckSet.decks.length) && deckSet.decks.length < 4; k++) {
					const nextUnique = findNextUnique(deckSet, allDecks.slice(k))

					if (!nextUnique) continue

					deckSet.cards = nextUnique.cards
					deckSet.decks = nextUnique.decks
					deckSet.lastIndex = nextUnique.lastIndex
					k = nextUnique.lastIndex
				}

				if (deckSet.decks.length === 4) unqiueDeckCombos.push(deckSet.decks)
			}

			return unqiueDeckCombos
		}

		let allDeckSets = findUniques()

		for (let i = 0; i < allDeckSets.length; i++) {
			//check if all includedCards are in deck set
			if (!allIncludedCardsInSet(allDeckSets[i], includedCards)) {
				allDeckSets.splice(i--, 1) //remove deck set
				continue
			}

			allDeckSets[i].score = deckSetScore(allDeckSets[i], player.cards)
			allDeckSets[i].avgCardLvl = deckSetAvgLvl(
				[...allDeckSets[i][0].cards, ...allDeckSets[i][1].cards, ...allDeckSets[i][2].cards, ...allDeckSets[i][3].cards],
				player.cards
			)
			allDeckSets[i].avgRating = deckSetAvgDeckRating(allDeckSets[i])
		}

		const sortBy = i.options.getString("sort-by") || "score"
		const priority = ["score", "avgCardLvl", "avgRating"]
		const nextPriority = (last = []) => {
			for (let i = 0; i < priority.length; i++) {
				if (!last.includes(priority[i])) return priority[i]
			}
		}

		allDeckSets = allDeckSets
			.sort((a, b) => {
				if (a[sortBy] === b[sortBy]) {
					const secondPriority = nextPriority([sortBy])

					if (a[nextPriority] === b[nextPriority]) {
						const lastPriority = nextPriority([sortBy, nextPriority])
						return b[lastPriority] - a[lastPriority]
					}

					return b[secondPriority] - a[secondPriority]
				}
				return b[sortBy] - a[sortBy]
			})
			.slice(0, 20)

		if (allDeckSets.length === 0) {
			if (includedCards.length > 0 || excludedCards.length > 0)
				return i.editReply({
					embeds: [{ color: orange, description: `**No deck sets found.** Try changing search parameters.` }],
				})

			//no deck sets found
			return i.editReply({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] })
		}

		//create and send pagination embed
		const leagueEmoji = getEmoji(getArenaEmoji(player.bestTrophies))
		const copyEmoji = getEmoji("copy")
		const sortByStr = sortBy === "score" ? "Recommended" : sortBy === "avgCardLvl" ? "Card Level" : "Rating"

		const emojiStr = (cards) => {
			let str = ""
			for (let i = 0; i < cards.length; i++) {
				str += getEmoji(cards[i].replace(/-/g, "_"))
			}

			return str || "None"
		}

		const deckSetStr = (deckSet) => {
			let str = ""
			for (let i = 0; i < deckSet.length; i++) {
				str += `[**Copy**](${getDeckUrl(deckSet[i].cards)})${copyEmoji}: `

				for (let x = 0; x < deckSet[i].cards.length; x++) {
					str += getEmoji(deckSet[i].cards[x].replace(/-/g, "_"))
				}

				str += "\n"
			}

			return str
		}

		const createEmbeds = (deckSets) => {
			const embeds = []
			for (let i = 0; i < deckSets.length; i++) {
				embeds.push({
					title: `${leagueEmoji} ${player.name} | ${player.tag}`,
					description: `**Included Cards**: ${emojiStr(includedCards)}\n**Excluded Cards**: ${emojiStr(
						excludedCards
					)}\n**Sort By**: ${sortByStr}\n\n**__Deck Set__**\nRating: **${deckSets[i].avgRating.toFixed(1)}**\nAvg. Level: **${deckSets[i].avgCardLvl.toFixed(1)}**\n
				${deckSetStr(deckSets[i])}`,
					color: pink,
					footer: {
						text: `${i + 1}/${allDeckSets.length}${allDeckSets.length >= 20 ? " of many results" : ""}`,
					},
				})
			}

			return embeds
		}
		const deckSetEmbeds = createEmbeds(allDeckSets)

		const row = new MessageActionRow().addComponents([
			{
				type: "BUTTON",
				customId: "prev",
				emoji: { name: "◀️" },
				style: "PRIMARY",
				disabled: true,
			},
			{
				type: "BUTTON",
				customId: "next",
				emoji: { name: "▶️" },
				style: "PRIMARY",
				disabled: deckSetEmbeds.length < 2,
			},
		])

		let index = 0

		let data = {
			embeds: [deckSetEmbeds[index]],
			components: [row],
			fetchReply: true,
		}

		const msg = await i.editReply(data)

		const col = msg.createMessageComponentCollector({
			filter: (int) => int.user.id === i.user.id,
			idle: 20000,
		})

		col.on("collect", (i) => {
			if (i.customId === "prev") index--
			else if (i.customId === "next") index++

			row.setComponents(
				{
					type: "BUTTON",
					customId: "prev",
					emoji: { name: "◀️" },
					style: "PRIMARY",
					disabled: index === 0,
				},
				{
					type: "BUTTON",
					customId: "next",
					emoji: { name: "▶️" },
					style: "PRIMARY",
					disabled: deckSetEmbeds.length < index + 1,
				}
			)

			i.update({
				components: [row],
				embeds: [deckSetEmbeds[index]],
			})
		})

		col.on("end", () => {
			i.editReply({
				components: [],
			})
		})
	},
}
