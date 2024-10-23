const { Events } = require("discord.js")
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

  // for user context commands
  if (i.targetId) desc += `\n**Target User**: ${i.targetId}`

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

module.exports = {
  name: Events.InteractionCreate,
  run: async (client, db, i) => {
    try {
      if (!i) return

      const isCommand = i.isChatInputCommand()
      const isContextMenuCommand = i.isMessageContextMenuCommand() || i.isUserContextMenuCommand()
      const isModalSubmit = i.isModalSubmit()

      if (!isCommand && !isContextMenuCommand && !isModalSubmit) return

      if (!i.guild) {
        return i.reply({
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

      const ignoreChannelChecks = isModalSubmit || i.commandName === "Link Player (ADMIN)"
      const { color, error, onlyShowToUser } = validate(i, guildExists, client, ignoreChannelChecks)

      // context commands
      if (isContextMenuCommand) {
        const { run } = i.client.contextCommands.get(i.commandName)

        // show error modal
        if (error)
          return i.reply({
            embeds: [
              {
                color,
                description: error,
              },
            ],
            ephemeral: true,
          })

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
        return i.reply({
          embeds: [
            {
              color,
              description: error,
            },
          ],
          ephemeral: onlyShowToUser,
        })
      }

      await i.deferReply()

      const { disabled, run } = i.client.commands.get(i.commandName)

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
