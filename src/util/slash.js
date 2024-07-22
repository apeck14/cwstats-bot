const { REST, Routes } = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

const registerSlashCommands = async (CLIENT_ID, commands) => {
  const rest = new REST({
    version: "10",
  }).setToken(CLIENT_TOKEN)

  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    })
    console.log(`Loaded Slash Commands`)
  } catch (error) {
    console.log(`Could not load Slash Commands: \n ${error}`)
  }
}

module.exports = registerSlashCommands
