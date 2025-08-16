const { REST, Routes } = require("discord.js")
const { CLIENT_TOKEN } = require("../../config")

const rest = new REST({
  version: "10",
}).setToken(CLIENT_TOKEN)

const normalizeCommand = (cmd) => ({
  description: cmd.description,
  name: cmd.name,
  options: (cmd.options ?? []).map((opt) => ({
    choices: (opt.choices ?? []).map((c) => ({ name: c.name, value: c.value })),
    description: opt.description,
    name: opt.name,
    required: opt.required ?? false,
    type: opt.type,
  })),
})

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

      const localNorm = normalizeCommand(local)
      const remoteNorm = normalizeCommand(remote)

      return JSON.stringify(localNorm) !== JSON.stringify(remoteNorm)
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
      console.log("✅ No command changes detected.")
      return
    }

    // Overwrite (add/update) changed commands one by one
    for (const cmd of changed) {
      await rest.post(Routes.applicationCommands(CLIENT_ID), { body: cmd })
      console.log(`🔄 Updated command: ${cmd.name}`)
    }

    console.log(`✅ Commands updated: ${changed.length}`)
  } catch (error) {
    console.error(`❌ Could not register Commands: \n`, error)
  }
}

module.exports = registerSlashCommands
