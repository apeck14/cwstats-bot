const { Events, MessageFlags } = require("discord.js")
const path = require("path")
const fs = require("fs")
const { orange, pink } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")
const { validate } = require("../util/validate")
const guildCreate = require("./guildCreate")

const sendCommandLog = async (i, client) => {
  const { discriminator, id, username } = i.user
  const { guild } = i.member

  let desc = `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guild.name} (${guild.id})`

  const hasOptions = i?.options?._hoistedOptions?.length > 0
  const hasFields = i?.fields?.fields?.size > 0
  let data = "*None*"

  if (hasOptions) data = `${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join("\n")}`
  else if (hasFields) data = `${i.fields.fields.map((o) => `• **${o.customId}**: ${o.value}`).join("\n")}`

  desc += `\n\n**Fields**: \n${data}`

  logToSupportServer(client, {
    color: pink,
    description: desc,
    title: `__/${i.commandName || i.customId}__`,
  })
}

const getTimeDifference = (date1, date2) => {
  const diff = Math.abs(date2 - date1) // Get the difference in milliseconds

  const minutes = Math.floor(diff / (1000 * 60)) // Convert to minutes
  const seconds = Math.floor((diff % (1000 * 60)) / 1000) // Get remaining seconds

  return `${minutes}m ${seconds}s`
}

module.exports = {
  name: Events.InteractionCreate,
  run: async (client, db, i) => {
    try {
      if (!i) return

      const isCommand = i.isChatInputCommand()
      const isUserContextMenuCommand = i.isUserContextMenuCommand()
      const isMessageContextMenuCommand = i.isMessageContextMenuCommand()
      const isModalSubmit = i.isModalSubmit()

      if (!isCommand && !isUserContextMenuCommand && !isMessageContextMenuCommand && !isModalSubmit) return

      const validateChannel = isCommand || isMessageContextMenuCommand
      if (validateChannel) await i.deferReply()

      if (!i.guild) {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=2147797184&scope=bot+applications.commands) me to a server to use my commands!**`,
            },
          ],
        })
      }

      const guilds = db.collection("Guilds")
      let guildExists = await guilds.findOne({
        guildID: i.guildId,
      })

      if (!guildExists) {
        await guildCreate.run(client, db, i.member.guild)

        guildExists = await guilds.findOne({
          guildID: i.guildId,
        })

        if (!guildExists) return console.log("Guild not in database, and could not be added.")

        console.log(`Guild not found, but updated! ${i.guildId}`)
      }

      const { color, error, onlyShowToUser } = validate(i, guildExists, client, validateChannel)

      // context commands
      if (isUserContextMenuCommand || isMessageContextMenuCommand) {
        const { run } = i.client.contextCommands.get(i.commandName)

        const messageInput = {
          embeds: [
            {
              color,
              description: error,
            },
          ],
          flags: MessageFlags.Ephemeral,
        }

        // show error modal
        if (error) {
          return isUserContextMenuCommand ? i.reply(messageInput) : i.editReply(messageInput)
        }

        return run(i, db, client)
      }

      // on modal submit
      if (isModalSubmit) {
        const { customId } = i
        const commandFilePath = path.join(__dirname, "../context-commands", `${customId}.js`)

        if (fs.existsSync(commandFilePath)) {
          const command = require(commandFilePath)
          if (command.handleModalSubmit) {
            command.handleModalSubmit(i, db)
          }
        }

        return sendCommandLog(i, client)
      }

      if (error) {
        return i.editReply({
          embeds: [
            {
              color,
              description: error,
            },
          ],
          flags: onlyShowToUser ? MessageFlags.Ephemeral : 0,
        })
      }

      const { cooldown, disabled, run } = i.client.commands.get(i.commandName)

      if (disabled) {
        return i.editReply({
          embeds: [
            {
              color: orange,
              description: ":tools: **This command has been temporarily disabled**.",
            },
          ],
        })
      }

      // check for cooldown in database
      if (cooldown && guildExists?.cooldowns) {
        const commandCooldown = guildExists?.cooldowns[i.commandName]
        if (commandCooldown) {
          const now = new Date()

          if (now < commandCooldown) {
            const timeRemainingStr = getTimeDifference(now, commandCooldown)

            return i.editReply({
              embeds: [
                {
                  color: orange,
                  description: `This command is on cooldown for **${timeRemainingStr}**.`,
                },
              ],
            })
          }
        }
      }

      // if a user @'s themselves send reminder above embed response
      if (i.options._hoistedOptions.find((o) => o.name === "user")?.value === i.user.id)
        await i.followUp(
          `:white_check_mark: **No need to @ yourself!** You can just use **/${i.commandName}** instead.`,
        )

      await run(i, db, client)

      sendCommandLog(i, client)
    } catch (e) {
      console.log(e)
      console.log(e?.requestBody?.json)
    }
  },
}
