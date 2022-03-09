const { orange, red } = require('../static/colors.js');

module.exports = {
    event: "interactionCreate",
    run: async (client, db, i) => {
        if (!i.isCommand()) return;
        if (!i.guild) return i.reply({
            embeds: [{
                description: `**[Invite](https://discord.com/api/oauth2/authorize?client_id=869761158763143218&permissions=280576&scope=bot%20applications.commands) me to a server to use my commands!**`,
                color: orange
            }]
        });

        try {
            await i.deferReply();

            const guilds = db.collection('Guilds');

            const { channels } = await guilds.findOne({ guildID: i.guildId });
            const { commandChannelID, applicationsChannelID, applyChannelID } = channels;

            const command = i.client.commands.get(i.commandName);

            if (command.data.name === 'apply') {
                if (!applyChannelID)
                    return i.editReply({
                        embeds: [{
                            description: `**No apply channel set.**`,
                            color: orange
                        }],
                        ephemeral: true
                    });

                if (!applicationsChannelID)
                    return i.editReply({
                        embeds: [{
                            description: `**No applications channel set.**`,
                            color: orange
                        }],
                        ephemeral: true
                    });

                if (applyChannelID !== i.channel.id)
                    return i.editReply({
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
                    return i.editReply({
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
                    return i.editReply({
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
                    return i.editReply({
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
                    return i.editReply({
                        embeds: [{
                            description: `__**Missing permissions**__\n\n${permissionList}`,
                            color: red
                        }],
                        ephemeral: true
                    });
                }
            }

            await command.run(i, db, client);
        }
        catch (e) {
            if (e instanceof Error && client.isReady()) {
                console.log('Error');
                console.log('Command:', i?.commandName);
                console.log('User:', `${i?.user.username}#${i?.user.discriminator}`);
                console.log('Guild:', `${i?.guild.name} (${i?.guild.id})`);
                console.log('Options:', i?.options?._hoistedOptions.map(o => `\n${o.name}: ${o.value}`).join(''))
                console.log(e);
            }

            const errEmbed = {
                description: (typeof e === 'string') ? e : `**Unexpected error.**`,
                color: red,
                footer: {
                    text: (typeof e === 'string') ? '' : 'If this problem persists, join the Support Server.'
                }
            }

            if (i?.replied || i?.deferred)
                return i.editReply({ embeds: [errEmbed], ephemeral: true });

            return i.reply({ embeds: [errEmbed], ephemeral: true });
        }
    },
};