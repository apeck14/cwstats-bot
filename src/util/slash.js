const { REST, Routes } = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

const rest = new REST({
  version: "10",
}).setToken(CLIENT_TOKEN)

/**
 * Compare local commands with remote (Discord-registered) commands
 * @param {string} CLIENT_ID - The bot's client ID
 * @param {Array} localCommands - The commands defined locally
 * @returns {Array} - Only the commands that have changed
 */
const getChangedSlashCommands = async (CLIENT_ID, localCommands) => {
  try {
    const remoteCommands = await rest.get(Routes.applicationCommands(CLIENT_ID))

    // Find changed or new commands
    const changed = localCommands.filter((local) => {
      const remote = remoteCommands.find((r) => r.name === local.name)
      if (!remote) return true // new command

      // Compare metadata (ignore IDs and other Discord-managed fields)
      const { default_member_permissions, description, dm_permission, options } = remote

      return (
        local.description !== description ||
        JSON.stringify(local.options ?? []) !== JSON.stringify(options ?? []) ||
        local.dm_permission !== dm_permission ||
        local.default_member_permissions !== default_member_permissions
      )
    })

    return changed
  } catch (error) {
    console.error("❌ Failed to fetch remote commands:", error)
    return localCommands // fallback: re-register everything
  }
}

/**
 * Register changed slash commands only
 * @param {string} CLIENT_ID - The bot's client ID
 * @param {Array} commands - The commands defined locally
 */
const registerSlashCommands = async (CLIENT_ID, commands) => {
  try {
    const changed = await getChangedSlashCommands(CLIENT_ID, commands)

    if (changed.length === 0) {
      console.log("✅ No slash command changes detected.")
      return
    }

    // Overwrite (add/update) changed commands one by one
    for (const cmd of changed) {
      await rest.post(Routes.applicationCommands(CLIENT_ID), { body: cmd })
      console.log(`🔄 Updated slash command: ${cmd.name}`)
    }

    console.log(`✅ Slash commands updated: ${changed.length}`)
  } catch (error) {
    console.error(`❌ Could not register Slash Commands: \n`, error)
  }
}

module.exports = registerSlashCommands
