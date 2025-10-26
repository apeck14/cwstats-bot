const { Events } = require('discord.js')
const { green, pink } = require('../static/colors')
const { logToSupportServer } = require('../util/logging')
const { createGuild } = require('../util/services')

module.exports = {
  name: Events.GuildCreate,
  run: async (client, guild) => {
    guild
      .fetchAuditLogs()
      .then((logs) => {
        const executorId = logs.entries.find(
          (log) => log.actionType === 'Create' && log.targetType === 'User' && log.targetId === '869761158763143218'
        )?.executorId

        // send welcome message to user who invited
        if (executorId) {
          const cwstatsEmoji = client.cwEmojis.get('cwstats')
          const discordEmoji = client.cwEmojis.get('discord')

          const welcomeEmbed = {
            color: pink,
            description: `## :tada: Welcome to CWStats! :confetti_ball:\nGreetings, fellow Clash Royale enthusiast! We're thrilled to have you join our community at CWStats, your ultimate destination for top-notch Clash Royale services.\n### :robot: CWStats Discord Bot: Your #1 Clan Wars Companion!\nPrepare to elevate your Clash Royale experience with our cutting-edge Discord bot, designed to cater to all your Clan Wars needs. From real-time war stats and analytics to battle nudges and deck spying, CWStats is here to enhance every aspect of your clan! Trusted and used by 2500+ of the most competitive Clan Wars clans, expect nothing but the best!\n### :globe_with_meridians: Unlock the Full Potential with Our Website:\nBut that's not all! Our services extend beyond Discord with a feature-packed website that complements CWStats' Discord Bot seamlessly. Dive into detailed player profiles, track your clan's race, view advance war tooling, and much more! The website is your hub for comprehensive information, ensuring you're always in the loop.\n### :people_hugging: Join a Vibrant Community:\nAt CWStats, we believe in the strength of community. Join our Discord Support Server to connect with like-minded Clash Royale enthusiasts, get help setting up our Discord bot, request new features, report bugs, or just hang out!\n### :link: Links:\n${discordEmoji} **Support Server**: [Invite](https://cwstats.com/support)\n${cwstatsEmoji} **Website**: [CWStats.com](https://cwstats.com)`
          }

          client.users.cache.get(executorId).send({ embeds: [welcomeEmbed] })
        }
      })
      .catch(console.error)

    createGuild(guild.id)

    logToSupportServer(
      client,
      {
        color: green,
        description: `**Name**: ${guild.name}\n**ID**: ${guild.id}\n**Members**: ${guild.memberCount}`,
        thumbnail: {
          url: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
        },
        title: '__Joined Server!__'
      },
      false
    )
  }
}
