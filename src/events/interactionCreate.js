/* eslint-disable no-console */
import { Events, MessageFlags } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { pink } from '../static/colors.js'
import { errorMsg, safeEdit, safeReply, warningMsg } from '../util/functions.js'
import { logToSupportServer } from '../util/logging.js'
import { createGuild, getGuild } from '../util/services.js'
import validate from '../util/validate.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sendCommandLog = (i, client) => {
  try {
    const { discriminator, id, username } = i.user
    const { guild } = i.member

    let desc = `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guild.name} (${guild.id})`

    const hasOptions = i?.options?._hoistedOptions?.length > 0
    const hasFields = i?.fields?.fields?.size > 0
    let data = '*None*'

    if (hasOptions) {
      data = `${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join('\n')}`
    } else if (hasFields) {
      data = `${i.fields.fields.map((o) => `• **${o.customId}**: ${o.value}`).join('\n')}`
    }

    desc += `\n\n**Fields**: \n${data}`

    logToSupportServer(client, {
      color: pink,
      description: desc,
      title: `__/${i.commandName || i.customId}__`
    })
  } catch (e) {
    console.error('Error sending command log:', e)
  }
}

const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(date2 - date1) // Get the difference in milliseconds

  const minutes = Math.floor(diff / (1000 * 60)) // Convert to minutes
  const seconds = Math.floor((diff % (1000 * 60)) / 1000) // Get remaining seconds

  return `${minutes}m ${seconds}s`
}

async function handleCommand(i, client, guild) {
  const { color, error, onlyShowToUser } = validate(i, guild, client, true)

  try {
    await i.deferReply({ flags: onlyShowToUser ? MessageFlags.Ephemeral : 0 })
  } catch (deferErr) {
    console.log('[handleCommand] ⚠️ deferReply failed:', deferErr.message)
  }

  if (error) {
    return safeEdit(i, { embeds: [{ color, description: error }] })
  }

  const cmd = i.client.commands.get(i.commandName)

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
  if (i.options._hoistedOptions.find((o) => o.name === 'user')?.value === i.user.id) {
    await safeReply(i, `:white_check_mark: **No need to @ yourself!** You can just use **/${i.commandName}** instead.`)
  }

  try {
    await cmd.run(i, client)
    sendCommandLog(i, client)
  } catch (err) {
    console.log(`[handleCommand] ❌ Error executing ${i.commandName}:`, err)
    return errorMsg('Something went wrong while executing this command.')
  }
}

async function handleContextCommand(i, client, guild) {
  const { error } = validate(i, guild, client, true)
  const cmd = i.client.contextCommands.get(i.commandName)

  try {
    // Always defer early unless you are sure the command replies instantly
    const shouldDefer = !cmd?.handleModalSubmit
    if (shouldDefer) {
      await i.deferReply({ flags: MessageFlags.Ephemeral }).catch(console.log)
    }

    if (error) {
      return errorMsg(i, error)
    }

    await cmd.run(i, client).catch(console.error)

    sendCommandLog(i, client)
  } catch (err) {
    console.error('handleContextCommand ERROR:', err)
  }
}

export async function handleModalSubmit(i) {
  const file = path.join(__dirname, '../context-commands', `${i.customId}.js`)
  if (fs.existsSync(file)) {
    const command = await import(`file://${file}`)
    if (command.handleModalSubmit) {
      await command.handleModalSubmit(i)
    }
  }
}

async function handleAutocomplete(i, client) {
  const cmd = i.client.commands.get(i.commandName)
  if (!cmd?.search) {
    return
  }

  const results = await cmd.search(i)
  await i.respond(results?.length ? results : [{ name: '❌ No matches', value: 'no_match' }])
  sendCommandLog(i, client)
}

export default {
  name: Events.InteractionCreate,
  async run(client, i) {
    try {
      if (!i) {
        return
      }

      if (i.createdTimestamp < client.readyTimestamp) {
        return
      } // stale interaction

      if (Date.now() - i.createdTimestamp > 15 * 60 * 1000) {
        return
      } // expired interaction

      // ignore DMs
      if (!i.guild) {
        return warningMsg(
          i,
          '**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=2147797184&scope=bot+applications.commands) me to a server to use my commands!**'
        )
      }

      const { data: guild } = await getGuild(i.guildId)

      // guild not in database, create it
      if (!guild) {
        await createGuild(i.guildId)
        return errorMsg(i, '**Unexpected error.** Please try again.')
      }

      if (i.isAutocomplete()) {
        return handleAutocomplete(i, client)
      }

      if (i.isChatInputCommand()) {
        return handleCommand(i, client, guild)
      }

      if (i.isModalSubmit()) {
        return handleModalSubmit(i)
      }

      if (i.isUserContextMenuCommand() || i.isMessageContextMenuCommand()) {
        return handleContextCommand(i, client, guild)
      }
    } catch (e) {
      console.error('INTERACTION CREATE ERROR', i?.commandName, e)
    }
  }
}
