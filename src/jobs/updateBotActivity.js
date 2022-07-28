module.exports = {
	expression: "0 */20 * * * *", //run every 30 mins
	run: async (client, db) => {
		client.user.setActivity(`Need help? | ${client.guilds.cache.size} servers`)
	},
}
