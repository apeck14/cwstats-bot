module.exports = {
	expression: "0 */20 * * * *", //run every 20 mins
	run: async (client, db) => {
		client.user.setActivity(`Need help? | ${client.guilds.cache.size} servers`)
	},
}