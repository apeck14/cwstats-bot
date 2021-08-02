const mongoUtil = require("../util/mongoUtil");

module.exports = {
  name: 'help',
  async execute(message) {
    const db = await mongoUtil.db("General");
    const guilds = db.collection("Guilds");

    const { channels, prefix } = await guilds.findOne({ guildID: message.channel.guild.id });
    const { commandChannelID } = channels;

    //must be in command channel if set
    if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

    const commands = [
      { name: 'lb full?', desc: 'View your clan\'s war leaderboard', main: true },
      { name: 'link #TAG', desc: `Link your CR account to the bot (so you don't have to type in your tag each time you call *${prefix}player* or *${prefix}stats*)`, main: true },
      { name: "player #TAG?", desc: "View information about any player", main: true },
      { name: 'apply #TAG', desc: 'Apply to join the clan', main: true },
      { name: 'race #TAG?', desc: 'View current river race stats of any clan', main: true },
      { name: 'stats #TAG?', desc: 'View war stats of a clan member', main: true },
      { name: 'sync', desc: 'Sync all recent weeks\' clan war data', main: false },
      { name: 'setColor #HEXCODE', desc: 'Set the clan color (ex: #F1F1F1)', main: false, setup: true },
      { name: 'setAdminRole @ROLE', desc: 'Set the role that can use admin commands (only administrators can set role)', main: false, setup: true },
      { name: 'setClanTag #TAG', desc: 'Set the clan tag for this server', main: false, setup: true },
      { name: 'setApplyChannel', desc: 'Set the channel where new server members should be applying (use command in the channel to set). `Default: Any Channel`', main: false, setup: true },
      { name: 'setApplicationsChannel', desc: 'Set the channel where all applications should be posted (use command in the channel to set). `Default: No Channel`', main: false, setup: true },
      { name: 'setCommandChannel', desc: 'Set the channel where all commands should be allowed (use command in the channel to set). `Default: Any Channel`', main: false, setup: true },
      { name: 'prefix PREFIX', desc: 'Set a custom prefix for all bot commands. `Default: ?`', main: false, setup: true }
    ];

    commands.sort((a, b) => {
      if (a.name > b.name) return 1;
      else if (b.name > a.name) return -1;
      return 0;
    });

    const mainCommands = commands.filter(c => c.main).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');
    const setupCommands = commands.filter(c => c.setup).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');
    const adminCommands = commands.filter(c => !c.main && !c.setup).map(c => `• **${prefix}${c.name}** - ${c.desc}\n`).join('');

    const helpEmbed = {
      title: '__Commands__',
      color: '#ff237a',
      description: `${mainCommands}\n__**Admin**__\n${adminCommands}\n**__Setup__**\n${setupCommands}`,
      footer: {
        text: `? = optional`
      }
    }

    message.channel.send({ embed: helpEmbed });
  },
};