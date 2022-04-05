const puppeteer = require("puppeteer-extra")
const StealthPlugin = require("puppeteer-extra-plugin-stealth")
puppeteer.use(StealthPlugin())
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker")
puppeteer.use(AdblockerPlugin({ blockTrackers: true }))

module.exports = {
	expression: "0 0 13 * * *", //run daily at 7 am
	run: async (client, db) => {
		const decks = db.collection("Decks")
		console.log("Adding decks...")

		//remove old decks
		const existingDecks = await decks.find({}).toArray()

		const now = new Date()

		puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] }).then(async (browser) => {
			const page = await browser.newPage()

			await page.setDefaultNavigationTimeout(0)

			const allCards = require("../static/cardInfo")

			let totalDecksAdded = 0

			for await (const c of allCards) {
				//loop through all cards
				const url = `https://royaleapi.com/decks/popular?time=7d&inc=${c.name}&players=PvP&type=NormalBattle&size=20&sort=rating&min_elixir=1&max_elixir=9&mode=digest`

				await page.goto(url)

				const allDecks = await page.$$("div.deck_segment")
				const ratings = await page.$$("table.stats td:nth-child(1)")

				if (allDecks.length === ratings.length) {
					let decksAdded = 0

					const month = now.getUTCMonth() + 1
					const date = now.getUTCDate()
					const year = now.getUTCFullYear()

					for (let i = 0; i < allDecks.length; i++) {
						const deck = {
							cards: (await page.evaluate((el) => el.getAttribute("data-name"), allDecks[i])).split(",").sort(), //alphabetize
							rating: parseInt(await page.evaluate((el) => el.textContent, ratings[i])),
							dateAdded: `${month}/${date}/${year}`,
						}

						const deckExists = await decks.findOne({ cards: deck.cards })

						if (deckExists) {
							decks.updateOne({ cards: deck.cards }, { $set: { dateAdded: deck.dateAdded, rating: deck.rating } })
						} else {
							await decks.insertOne(deck)
							decksAdded++
						}
					}

					totalDecksAdded += decksAdded
				}

				if (allCards.findIndex((ca) => c.name === ca.name) !== allCards.length - 1) {
					//if not last card in search
					const timeout = (Math.random() * 8 + 3) * 1000
					await page.waitForTimeout(timeout)
				}
			}

			console.log(`Finished! (${totalDecksAdded} decks added)`)

			await browser.close()
		})

		const oldDecks = existingDecks.filter((d) => {
			const deckDate = new Date(d.dateAdded)
			const diffInDays = (now.getTime() - deckDate.getTime()) / (1000 * 3600 * 24)

			return diffInDays >= 3
		})

		for (const d of oldDecks) {
			decks.deleteOne({ _id: d._id })
		}

		console.log(`Removed ${oldDecks.length} old decks.`)
	},
}
