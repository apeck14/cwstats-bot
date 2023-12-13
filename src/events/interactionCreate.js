const { orange, pink } = require("../static/colors")
const { logToSupportServer } = require("../util/logging")
const { validate } = require("../util/validate")
const guildCreate = require("./guildCreate")

module.exports = {
  event: "interactionCreate",
  run: async (client, db, i) => {
    try {
      if (!i || !i.isChatInputCommand()) return

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

      const { color, error, onlyShowToUser } = validate(i, guildExists.channels, client)

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
        await i.followUp(`:white_check_mark: **No need to @ yourself!**`)

      await run(i, db, client)

      const hasOptions = i.options._hoistedOptions.length > 0
      let options = "*None*"

      if (hasOptions) options = `\n${i.options._hoistedOptions.map((o) => `• **${o.name}**: ${o.value}`).join("\n")}`

      const { discriminator, id, username } = i.user
      const { guild } = i.member

      logToSupportServer(client, {
        color: pink,
        description: `**User**: ${username}#${discriminator} (${id})\n**Guild**: ${guild.name} (${guild.id})\n\n**Options**: ${options}\n\n**Deferred**: ${i.deferred}\n**Replied**: ${i.replied}`,
        title: `__/${i.commandName}__`,
      })
    } catch (e) {
      console.log(e)
      console.log(e?.requestBody?.json)
    }
  },
}
