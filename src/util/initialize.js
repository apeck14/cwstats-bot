/* eslint-disable no-console */
import { Client, Collection, GatewayIntentBits, Options } from 'discord.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import { CLIENT_TOKEN, NODE_ENV, TEST_CLIENT_TOKEN } from '../../config.js'
import ownerIds from '../static/ownerIds.js'
import { bulkAddEmojis } from './services.js'

const isDev = NODE_ENV === 'dev'

const events = fs.readdirSync('src/events')

const initializeEvents = async (client) => {
  for (const event of events) {
    const eventFile = await import(`../events/${event}`)
    client.on(eventFile.default.name, (...args) => eventFile.default.run(client, ...args))
  }

  console.log('✅ DiscordJS Events Initialized!')

  return client
}

const initializeClient = async () => {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildExpressions
    ],
    // Limit caches for high-scale stability; we don't need to cache messages for slash commands
    makeCache: Options.cacheWithLimits({
      GuildInviteManager: 0,
      MessageManager: 0,
      PresenceManager: 0,
      ReactionManager: 0
    }),
    // Periodically sweep old items; messages are already limited to 0, but keep as a safety net
    shards: 'auto',
    sweepers: {
      messages: {
        interval: 300, // run every 5 minutes
        lifetime: 900 // remove messages older than 15 minutes
      }
    }
  })

  client.commands = new Collection()
  client.contextCommands = new Collection()
  client.cwEmojis = new Collection()

  await client.login(isDev ? TEST_CLIENT_TOKEN : CLIENT_TOKEN)

  console.log('Client Initialized!')

  return client
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function initializeCommands(client) {
  const commandsArray = []

  const commandDir = path.join(__dirname, '../commands')
  const contextDir = path.join(__dirname, '../context-commands')

  const commandFiles = fs.readdirSync(commandDir).filter((f) => f.endsWith('.js'))
  const contextFiles = fs.readdirSync(contextDir).filter((f) => f.endsWith('.js'))

  for (const file of commandFiles) {
    const command = await import(`file://${path.join(commandDir, file)}`)
    client.commands.set(command.default.data.name, command.default)
    commandsArray.push(command.default)
  }

  for (const file of contextFiles) {
    const command = await import(`file://${path.join(contextDir, file)}`)
    client.contextCommands.set(command.default.data.name, command.default)
    commandsArray.push(command.default)
  }

  console.log(`🔧 Loaded ${commandsArray.length} commands`)
  return commandsArray
}

function initializeEmojis(client) {
  console.time('🎨 Emoji Load Time')

  const emojis = []

  for (const emoji of client.emojis.cache.values()) {
    const { guild } = emoji
    if (!guild || !ownerIds.includes(guild.ownerId)) continue

    const emojiStr = `<:${emoji.name}:${emoji.id}>`
    client.cwEmojis.set(emoji.name, emojiStr)
    emojis.push({ emoji: emojiStr, name: emoji.name })
  }

  bulkAddEmojis(emojis)
  console.log(`🎨 Loaded ${emojis.length} emojis into memory`)
  console.timeEnd('🎨 Emoji Load Time')
}

export { initializeClient, initializeCommands, initializeEmojis, initializeEvents }
