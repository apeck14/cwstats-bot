const { Events, MessageFlags } = require('discord.js')
const path = require('path')
const fs = require('fs')
const { pink } = require('../static/colors')
const { logToSupportServer } = require('../util/logging')
const { createGuild, getGuild } = require('../util/services')
const { errorMsg, warningMsg } = require('../util/functions')
const validate = require('../util/validate')

const sendCommandLog = (i, client) => {
  try {
    const { discriminator, id, username } = i.user
    const { guild } = i.member

    let desc = `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guild.name} (${guild.id})`

    const hasOptions = i?.options?._hoistedOptions?.length > 0
    const hasFields = i?.fields?.fields?.size > 0
    let data = '*None*'

    if (hasOptions) data = `${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join('\n')}`
    else if (hasFields) data = `${i.fields.fields.map((o) => `• **${o.customId}**: ${o.value}`).join('\n')}`

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

  await i.deferReply({ flags: onlyShowToUser ? MessageFlags.Ephemeral : 0 })

  if (error) {
    return i.editReply({ embeds: [{ color, description: error }] })
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
  if (i.options._hoistedOptions.find((o) => o.name === 'user')?.value === i.user.id)
    await i.followUp(`:white_check_mark: **No need to @ yourself!** You can just use **/${i.commandName}** instead.`)

  await cmd.run(i, client)
  sendCommandLog(i, client)
}

async function handleContextCommand(i, client, guild) {
  const { color, error } = validate(i, guild, client, true)

  const cmd = i.client.contextCommands.get(i.commandName)

  if (cmd?.handleModalSubmit) {
    if (error) {
      return i.reply({
        embeds: [{ color, description: error }],
        ephemeral: true
      })
    }

    await cmd.run(i, client)
  } else {
    if (error) {
      return i.reply({ embeds: [{ color, description: error }], ephemeral: true })
    }

    await i.deferReply()

    await cmd.run(i, client)
  }

  sendCommandLog(i, client)
}

async function handleModalSubmit(i) {
  const file = path.join(__dirname, '../context-commands', `${i.customId}.js`)
  if (fs.existsSync(file)) {
    const command = require(file)
    if (command.handleModalSubmit) await command.handleModalSubmit(i)
  }
}

async function handleAutocomplete(i, client) {
  const cmd = i.client.commands.get(i.commandName)
  if (!cmd?.search) return
  const results = await cmd.search(i)
  await i.respond(results?.length ? results : [{ name: '❌ No matches', value: 'no_match' }])
  sendCommandLog(i, client)
}

module.exports = {
  name: Events.InteractionCreate,
  run: async (client, i) => {
    try {
      if (!i) return
      if (i.createdTimestamp < client.readyTimestamp) return // stale interaction
      if (Date.now() - i.createdTimestamp > 15 * 60 * 1000) return // expired interaction

      // ignore DMs
      if (!i.guild)
        return warningMsg(
          i,
          `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=2147797184&scope=bot+applications.commands) me to a server to use my commands!**`
        )

      const { data: guild } = await getGuild(i.guildId)

      // guild not in database, create it
      if (!guild) {
        await createGuild(i.guildId)
        return errorMsg(i, '**Unexpected error.** Please try again.')
      }

      if (i.isAutocomplete()) return handleAutocomplete(i, client)
      if (i.isChatInputCommand()) return handleCommand(i, client, guild)
      if (i.isModalSubmit()) return handleModalSubmit(i)
      if (i.isUserContextMenuCommand() || i.isMessageContextMenuCommand()) {
        return handleContextCommand(i, client, guild)
      }
    } catch (e) {
      console.error('INTERACTION CREATE ERROR', i?.commandName, e)
    }
  }
}
