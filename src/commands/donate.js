module.exports = {
	data: {
		name: "donate",
		description: "Donate to support CW2 Stats",
	},
	run: async (i, db, client) => {
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
			embeds: [
				{
					title: "Donate with PayPal",
					description:
						"CW Stats strives to aid all competitive war clans with game-changing data & stats! All proceeds help expand the capabilities of the bot & website.",
					color: "#3b7bbf",
					thumbnail: {
						url: "https://w7.pngwing.com/pngs/875/329/png-transparent-paypal-logo-e-commerce-payment-system-paypal-blue-angle-company.png",
					},
				},
			],
			components: [row],
		})
	},
}
