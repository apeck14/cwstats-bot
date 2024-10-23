const {
  ActionRowBuilder,
  ApplicationCommandType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js")
const { formatTag } = require("../util/formatting")
const { calcLinkedPlayerLimit } = require("../util/functions")
const { green, orange, red } = require("../static/colors")
const { getPlayer } = require("../util/api")

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
    const guilds = db.collection("Guilds")
    const linkedClans = db.collection("Linked Clans")
    const CWStatsPlus = db.collection("CWStats+")

    const inputTag = i.fields.getTextInputValue("tag")
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
      else if (links.some((l) => l.tag === formattedTag)) err = "**This player has already been linked.**"

      if (err)
        return i.reply({
          embeds: [
            {
              color: orange,
              description: err,
            },
          ],
          ephemeral: true,
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
        ephemeral: true,
      })

    guilds.updateOne(
      {
        guildID: i.guildId,
      },
      {
        $push: {
          "nudges.links": {
            discordID: i.user.id,
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
      ephemeral: true,
    })
  },
  run: async (i) => {
    const { targetUser } = i

    const modal = new ModalBuilder().setCustomId("player-link").setTitle(`Link Player: ${targetUser.tag}`)

    // Create input fields for the modal
    const input = new TextInputBuilder()
      .setCustomId("tag")
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
