/* eslint-disable no-console */
import { Events, MessageFlags } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { REQUEST_TIMEOUT_MS } from '../../config.js'
import { pink, red } from '../static/colors.js'
import { getTimeDifference } from '../util/formatting.js'
import { errorMsg, safeEdit, safeReply, warningMsg } from '../util/functions.js'
import { logCommand } from '../util/logging.js'
import { createGuild, getGuildCached } from '../util/services.js'
import validate from '../util/validate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Watchdog helper to avoid long "thinking..." and hard-timeout runaway handlers
const createWatchdog = (i) => {
  const TIMEOUT_BUFFER_MS = 2000
  const TIMEOUT_MS = (Number(REQUEST_TIMEOUT_MS) || 10000) + TIMEOUT_BUFFER_MS
  let completed = false
  // mark as not timed out at start
  i.__cwTimedOut = false

  const watchdog = setTimeout(() => {
    if (!completed) {
      completed = true
      // mark interaction timed out so commands can avoid late edits/attachments
      i.__cwTimedOut = true
      // allow a single safeEdit to post the timeout message, which will also clear attachments
      i.__cwAllowTimeoutEdit = true
      safeEdit(i, { embeds: [{ color: red, description: '**Request took too long.** Please try again later.' }] })
    }
  }, TIMEOUT_MS)

  return () => {
    completed = true
    clearTimeout(watchdog)
  }
}

async function handleCommand(i, client, guild) {
  const { color, error, onlyShowToUser } = validate(i, guild, client, true)

  // If we haven't acknowledged yet (e.g., invoked directly), do it now
  if (!i.deferred && !i.replied) {
    try {
      await i.deferReply({ flags: onlyShowToUser ? MessageFlags.Ephemeral : 0 })
    } catch (deferErr) {
      console.log('[handleCommand] ⚠️ deferReply failed:', deferErr.message)
    }
  }

  if (error) {
    const embed = { color, description: error }
    if (onlyShowToUser) {
      // Ensure the response is ephemeral when required
      try {
        if (i.deferred || i.replied) {
          await i.deleteReply().catch(() => {})
          return safeReply(i, { embeds: [embed], flags: MessageFlags.Ephemeral })
        }
        return safeReply(i, { embeds: [embed], flags: MessageFlags.Ephemeral })
      } catch (err) {
        console.log('[handleCommand] ❌ Failed to send ephemeral validation error:', err)
        return
      }
    }
    return safeEdit(i, { embeds: [embed] })
  }

  const cmd = i.client.commands.get(i.commandName)

  // Watchdog to prevent long "thinking..." and to stop wasting resources
  const cleanupWatchdog = createWatchdog(i)

  if (cmd.cooldown && guild?.cooldowns) {
    const commandCooldown = guild?.cooldowns[i.commandName]
    if (commandCooldown) {
      const now = new Date()

      if (now < commandCooldown) {
        const timeRemainingStr = getTimeDifference(now, commandCooldown)
        return warningMsg(i, `This command is on cooldown for **${timeRemainingStr}**.`)
      }
    }
  }

  // if a user @'s themselves send reminder above embed response
  if (i?.options?._hoistedOptions?.find?.((o) => o.name === 'user')?.value === i.user.id) {
    await safeReply(i, `:white_check_mark: **No need to @ yourself!** You can just use **/${i.commandName}** instead.`)
  }

  try {
    await cmd.run(i, client)
    cleanupWatchdog()
    logCommand(client, i)
  } catch (err) {
    console.log(`[handleCommand] ❌ Error executing ${i.commandName}:`, err)
    cleanupWatchdog()
    return errorMsg(i, 'Something went wrong while executing this command.')
  }
}

async function handleContextCommand(i, client, guild) {
  const { error } = validate(i, guild, client, true)
  const cmd = i.client.contextCommands.get(i.commandName)

  try {
    // Always defer early unless you are sure the command replies instantly
    const shouldDefer = !cmd?.handleModalSubmit
    if (shouldDefer && !i.deferred && !i.replied) {
      await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(console.log)
    }

    if (error) {
      return errorMsg(i, error)
    }

    // Watchdog for context commands as well
    const cleanupWatchdog = createWatchdog(i)

    try {
      await cmd.run(i, client)
      cleanupWatchdog()
    } catch (e) {
      console.log('handleContextCommand run error:', e)
      cleanupWatchdog()
    }

    logCommand(client, i)
  } catch (err) {
    console.log('handleContextCommand ERROR:', err)
  }
}

export async function handleModalSubmit(i) {
  const file = path.join(__dirname, '../context-commands', `${i.customId}.js`)
  if (fs.existsSync(file)) {
    const command = await import(`file://${file}`)
    const handler = command?.default?.handleModalSubmit || command?.handleModalSubmit
    if (typeof handler === 'function') {
      await handler(i)
    }
  }
}

async function handleAutocomplete(i, _client) {
  const cmd = i.client.commands.get(i.commandName)
  if (!cmd?.search) {
    return
  }

  const results = await cmd.search(i)
  await i.respond(results?.length ? results : [{ name: '❌ No matches', value: 'no_match' }])
  // intentionally skip logging autocomplete to reduce overhead
}

export default {
  name: Events.InteractionCreate,
  async run(client, i) {
    try {
      if (!i) return

      // stale/expired interaction guards
      if (i.createdTimestamp < client.readyTimestamp) return
      if (Date.now() - i.createdTimestamp > 15 * 60 * 1000) return

      // ignore DMs (reply with invite and exit fast)
      if (!i.guild) {
        return warningMsg(
          i,
          '**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=2147797184&scope=bot+applications.commands) me to a server to use my commands!**'
        )
      }

      // Autocomplete should be handled immediately and never blocked on external I/O
      if (i.isAutocomplete()) {
        return handleAutocomplete(i, client)
      }

      // For slash and context interactions: acknowledge ASAP to avoid Unknown Interaction
      let interactionType = null
      if (i.isChatInputCommand()) {
        interactionType = 'chat'
        try {
          if (!i.deferred && !i.replied) {
            await i.deferReply({ flags: 0 }) // public by default; we'll switch to ephemeral via delete+ephemeral reply if needed
          }
        } catch (deferErr) {
          console.log('[InteractionCreate] ⚠️ Early defer (chat) failed:', deferErr.message)
        }
      } else if (i.isUserContextMenuCommand() || i.isMessageContextMenuCommand()) {
        interactionType = 'context'
        try {
          // IMPORTANT: Do NOT defer if this context command opens a modal.
          // Showing a modal requires the interaction to be unacknowledged.
          const cmd = i.client.contextCommands?.get?.(i.commandName)
          const opensModal = !!cmd?.handleModalSubmit
          if (!i.deferred && !i.replied && !opensModal) {
            await i.deferReply({ flags: MessageFlags.Ephemeral }) // safe default for non-modal context commands
          }
        } catch (deferErr) {
          console.log('[InteractionCreate] ⚠️ Early defer (context) failed:', deferErr.message)
        }
      }

      // Fetch guild config after acknowledging to prevent 3s timeouts
      let guild
      try {
        const result = await getGuildCached(i.guildId)
        guild = result?.data
      } catch (fetchErr) {
        console.log('[InteractionCreate] ⚠️ getGuildCached failed:', fetchErr?.message)
      }

      if (!guild) {
        await createGuild(i.guildId)
        return i.deferred || i.replied
          ? safeEdit(i, { embeds: [{ color: pink, description: '**Unexpected error.** Please try again.' }] })
          : errorMsg(i, '**Unexpected error.** Please try again.')
      }

      if (interactionType === 'chat') {
        return handleCommand(i, client, guild)
      }

      if (i.isModalSubmit()) {
        return handleModalSubmit(i)
      }

      if (interactionType === 'context') {
        return handleContextCommand(i, client, guild)
      }
    } catch (e) {
      console.log('INTERACTION CREATE ERROR', i?.commandName, e)
    }
  }
}
