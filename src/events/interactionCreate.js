const { orange, red } = require('../static/colors.js');

module.exports = {
    event: "interactionCreate",
    run: async (client, db, i) => {
        if (!i.isCommand()) return;

        try {
            await i.deferReply();
        }
        catch (e) {
            console.error(e);

            return await i.reply({
                embeds: [{
                    description: `**Unexpected error.**`,
                    color: red,
                    footer: {
                        text: 'If this problem persists, DM Apehk#5688.'
                    }
                }],
                ephemeral: true
            });
        }

        await i.deferReply({ ephemeral: true });

        const guilds = db.collection('Guilds');

        const { channels } = await guilds.findOne({ guildID: i.channel.guild.id });
        const { commandChannelID, applicationsChannelID, applyChannelID } = channels;

        const command = i.client.commands.get(i.commandName);

        if (command.data.name === 'apply') {
            if (!applyChannelID)
                return await i.editReply({
                    embeds: [{
                        description: `**No apply channel set.**`,
                        color: orange
                    }],
                    ephemeral: true
                });

            if (!applicationsChannelID)
                return await i.editReply({
                    embeds: [{
                        description: `**No applications channel set.**`,
                        color: orange
                    }],
                    ephemeral: true
                });

            if (applyChannelID !== i.channel.id)
                return await i.editReply({
                    embeds: [{
                        description: `You can only use this command in the set **apply channel**! (<#${applyChannelID}>)`,
                        color: orange
                    }],
                    ephemeral: true
                });

            const applicationsChannelPermissions = client.channels.cache.get(applicationsChannelID).permissionsFor(client.user).toArray();
            const requiredPerms = ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'];
            const missingPerms = requiredPerms.filter(p => !applicationsChannelPermissions.includes(p));

            if (missingPerms.length > 0) {
                const permissionList = requiredPerms.map(p => {
                    if (missingPerms.includes(p)) return `❌ \`${p}\`\n`;
                    return `✅ \`${p}\`\n`;
                }).join('');
                return await i.editReply({
                    embeds: [{
                        description: `**Missing permissions in** <#${applicationsChannelID}>.\n\n${permissionList}`,
                        color: red
                    }],
                    ephemeral: true
                });
            }
        }
        else {
            //check if in set command channel
            if (commandChannelID && commandChannelID !== i.channel.id)
                return await i.editReply({
                    embeds: [{
                        description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`,
                        color: orange
                    }],
                    ephemeral: true
                });

            //check if user has permissions
            if (!i.member.permissions.has(command.data.userPermissions || [])) {
                const permissionList = command.data.userPermissions.map(c => {
                    if (i.member.permissions.has(c)) return `✅ \`${c}\`\n`;
                    return `❌ \`${c}\`\n`;
                }).join('');
                return await i.editReply({
                    embeds: [{
                        description: `You don't have **permission(s)** to use this command.\n\n${permissionList}`,
                        color: red
                    }],
                    ephemeral: true
                });
            }

            //check if bot has permissions in this channel
            const channelPermissions = client.channels.cache.get(i.channelId).permissionsFor(client.user).toArray();
            const requiredPerms = ['USE_EXTERNAL_EMOJIS'];
            const missingPerms = requiredPerms.filter(p => !channelPermissions.includes(p));

            if (missingPerms.length > 0) {
                const permissionList = requiredPerms.map(p => {
                    if (missingPerms.includes(p)) return `❌ \`${p}\`\n`;
                    return `✅ \`${p}\`\n`;
                }).join('');
                return await i.editReply({
                    embeds: [{
                        description: `__**Missing permissions**__\n\n${permissionList}`,
                        color: red
                    }],
                    ephemeral: true
                });
            }
        }

        try {
            await command.run(i, db, client);
        }
        catch (e) {
            console.error(e);

            return await i.editReply({
                embeds: [{
                    description: `**Unexpected error.**`,
                    color: red,
                    footer: {
                        text: 'If this problem persists, DM Apehk#5688.'
                    }
                }],
                ephemeral: true
            });
        }
    },
};