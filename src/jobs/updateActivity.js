module.exports = {
	expression: "0 30 * * * *", //run every hour at :30
	run: async (client, db) => {
		client.user.setActivity(`Need help? | ${client.guilds.cache.size} servers`)
	},
}
