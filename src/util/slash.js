const { CLIENT_TOKEN, TEST_GUILD_ID } = require("../../config")

const registerSlashCommands = async (CLIENT_ID, commands) => {
	const { REST } = require("@discordjs/rest")
	const { Routes } = require("discord-api-types/v9")

	const rest = new REST({
		version: "9"
	}).setToken(CLIENT_TOKEN)

	try {
		if (TEST_GUILD_ID) {
			await rest.put(Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID), {
				body: commands,
			})

			return console.log(`Loaded Guild Slash Commands`)
		}
		else {
			await rest.put(Routes.applicationCommands(CLIENT_ID), {
				body: commands,
			})

			return console.log(`Loaded Slash Commands`)
		}
	}
	catch (error) {
		return console.log(`Could not load Slash Commands: \n ${error}`)
	}
}

module.exports = registerSlashCommands