const { REST, Routes } = require("discord.js")
const { CLIENT_TOKEN, NODE_ENV, TEST_CLIENT_TOKEN, TEST_GUILD_ID } = require("../../config")

const isDev = NODE_ENV === "dev"

const rest = new REST({
  version: "10",
}).setToken(isDev ? TEST_CLIENT_TOKEN : CLIENT_TOKEN)

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

const normalizeContextCommand = (cmd) => ({
  name: cmd.name,
  type: cmd.type,
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

      const isContextCmd = remote.type === 2 || remote.type === 3

      const localNorm = isContextCmd ? normalizeContextCommand(local) : normalizeCommand(local)
      const remoteNorm = isContextCmd ? normalizeContextCommand(remote) : normalizeCommand(remote)

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
    // if dev, register commands for test guild
    if (isDev) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, TEST_GUILD_ID), {
        body: commands,
      })

      console.log(`✅ Loaded Guild Commands (dev)`)
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: [],
      })
      console.log("🗑️ Cleared all Global Commands")

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
    }
  } catch (error) {
    console.error(`❌ Could not register Commands: \n`, error)
  }
}

module.exports = registerSlashCommands
