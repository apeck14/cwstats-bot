const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker")
const { logToSupportServer } = require("../util/logging")
const { red, green } = require("../static/colors")
const allCards = require("../static/cardInfo")

puppeteer.use(StealthPlugin())
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

module.exports = {
	expression: "0 15 16 * * *", //run once a day
	run: async (client, db) => {
		const decks = db.collection("Decks")

		const now = new Date()

		puppeteer
			.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			})
			.then(async (browser) => {
				const page = await browser.newPage()

				await page.setDefaultNavigationTimeout(0)

				for await (const c of allCards) {
					//loop through all cards
					const url = `https://royaleapi.com/decks/popular?time=7d&sort=rating&size=20&players=PvP&min_trophies=0&max_trophies=10000&min_elixir=1&max_elixir=9&min_cycle_elixir=4&max_cycle_elixir=28&mode=digest&type=GC&win_count=8&inc=${c.name}&&global_exclude=false`

					await page.goto(url)

					const allDecks = await page.$$("div.deck_segment")
					const ratings = await page.$$("table.stats td:nth-child(1)")

					if (allDecks.length === ratings.length) {
						const month = now.getUTCMonth() + 1
						const date = now.getUTCDate()
						const year = now.getUTCFullYear()

						for (let i = 0; i < allDecks.length; i++) {
							const deck = {
								cards: (await page.evaluate((el) => el.getAttribute("data-name"), allDecks[i])).split(",").sort(), //alphabetize
								rating: parseInt(await page.evaluate((el) => el.textContent, ratings[i])),
								dateAdded: `${month}/${date}/${year}`,
							}

							const deckExists = await decks.findOne({
								cards: deck.cards,
							})

							if (deckExists) {
								decks.updateOne(
									{ cards: deck.cards },
									{
										$set: {
											dateAdded: deck.dateAdded,
											rating: deck.rating,
										},
									}
								)
							} else {
								await decks.insertOne(deck)
							}
						}
					}

					if (allCards.findIndex((ca) => c.name === ca.name) !== allCards.length - 1) {
						//if not last card in search
						const timeout = (Math.random() * 8 + 3) * 1000
						await page.waitForTimeout(timeout)
					}

					console.log("Added " + c.name)
				}

				logToSupportServer(client, {
					description: "**Decks successfully updated!**",
					color: green,
				})

				await browser.close()
			})
			.then(async () => {
				//remove old decks
				const existingDecks = await decks.find({}).toArray()

				const oldDecks = existingDecks.filter((d) => {
					const deckDate = new Date(d.dateAdded)
					const diffInDays = (now.getTime() - deckDate.getTime()) / (1000 * 3600 * 24)

					return diffInDays > 1.2
				})

				for (const d of oldDecks) {
					decks.deleteOne({ _id: d._id })
				}
			})
			.catch((e) => {
				logToSupportServer(client, {
					title: "Error while updating decks...",
					description: `**${e.name}**: ${e.message}`,
					color: red,
				})
			})
	},
}
