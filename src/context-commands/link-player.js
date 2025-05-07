const {
  ActionRowBuilder,
  ApplicationCommandType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js")
const { formatTag } = require("../util/formatting")
const { calcLinkedPlayerLimit, generateDiscordNickname } = require("../util/functions")
const { green, orange, red } = require("../static/colors")
const { getPlayer, updateDiscordNickname } = require("../util/services")

module.exports = {
  data: {
    name: "Link Player (ADMIN)",
    name_localizations: {
      de: "Spieler verknüpfen (ADMIN)",
      "es-ES": "Vincular jugador (ADMIN)",
      fr: "Lier joueur (ADMIN)",
      it: "Collega giocatore (AMMIN)",
      nl: "Speler koppelen (BEHEERDER)",
      tr: "Oyuncu bağla (Yönetici)",
    },
    type: ApplicationCommandType.User,
  },
  handleModalSubmit: async (i, db) => {
    try {
      const guilds = db.collection("Guilds")
      const linkedClans = db.collection("Linked Clans")
      const CWStatsPlus = db.collection("CWStats+")

      const input = i.fields.fields.entries().next().value
      const { customId: targetId, value: inputTag } = input[1]

      const formattedTag = formatTag(inputTag)

      const guild = await guilds.findOne({
        guildID: i.guildId,
      })

      const { nudges } = guild
      const { links } = nudges || {}

      if (links) {
        // get amount of linked plus clans
        const [serverLinkedClans, allPlusClans] = await Promise.all([
          linkedClans.find({ guildID: i.guildId }).toArray(),
          CWStatsPlus.distinct("tag"),
        ])
        const linkedPlusClans = serverLinkedClans.filter((c) => allPlusClans.includes(c.tag))
        const linkedPlayerLimit = calcLinkedPlayerLimit(linkedPlusClans.length)

        let err

        if (links.length >= linkedPlayerLimit) err = "**Max amount of linked players reached!**"

        const tagFound = links.find((l) => l.tag === formattedTag)
        if (tagFound) err = `**This player tag has already been linked to: <@${tagFound.discordID}>**`

        if (err)
          return i.reply({
            embeds: [
              {
                color: orange,
                description: err,
              },
            ],
            flags: MessageFlags.Ephemeral,
          })
      }

      // check if player exists
      const { data: player, error } = await getPlayer(formattedTag)

      if (error)
        return i.reply({
          embeds: [
            {
              color: red,
              description: error,
            },
          ],
          flags: MessageFlags.Ephemeral,
        })

      // update discord username of player
      if (nudges?.updateNicknameUponLinking) {
        const existingLinks = links.filter((l) => l.discordID === targetId).map((l) => l.name)
        const newNickname = generateDiscordNickname([...existingLinks, player.name])
        updateDiscordNickname({ guildId: i.guildId, nickname: newNickname, userId: targetId })
      }

      await guilds.updateOne(
        {
          guildID: i.guildId,
        },
        {
          $push: {
            "nudges.links": {
              discordID: targetId,
              name: player.name,
              tag: player.tag,
            },
          },
        },
      )

      return i.reply({
        embeds: [
          {
            color: green,
            description: `:white_check_mark: **${player.name}** successfully linked to user!`,
          },
        ],
        flags: MessageFlags.Ephemeral,
      })
    } catch (e) {
      return i.reply({
        embeds: [
          {
            color: red,
            description: "**Unexpected error.**",
          },
        ],
        flags: MessageFlags.Ephemeral,
      })
    }
  },
  run: async (i) => {
    const { targetUser } = i

    const modal = new ModalBuilder().setCustomId(`link-player`).setTitle(`Link Player: ${targetUser.tag}`)

    // Create input fields for the modal
    const input = new TextInputBuilder()
      .setCustomId(targetUser.id)
      .setLabel("PLAYER TAG (#ABC123):")
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMinLength(3)
      .setMaxLength(10)

    const actionRow = new ActionRowBuilder().addComponents(input)

    modal.addComponents(actionRow)

    // Show the modal
    await i.showModal(modal)
  },
}
