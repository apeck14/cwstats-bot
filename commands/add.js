const { verifyClanBio } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { request, red, parseDate, orange } = require("../util/otherUtil");

module.exports = {
    name: 'add',
    execute: async (message) => {
        const db = await mongoUtil.db("General");
        const matches = db.collection('Matches');
        const guilds = db.collection("Guilds");

        const { channels, adminRoleID, clanTag, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;
        const guildOwnerID = message.guild.owner?.id;

        //must be server owner or admin role
        if (message.author.id !== guildOwnerID && message.member._roles.indexOf(adminRoleID) === -1) return message.channel.send({ embed: { color: red, description: 'Only **admins** can use this command!' } });
        else if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        //tag must be linked and verified
        if (!clanTag) return message.channel.send({ embed: { color: red, description: `You must **link** a clan before using this command!\n\n__Usage:__\n\`${prefix}setClanTag #ABC123\`` } });
        //else if(!await verifyClanBio(clanTag)) return message.channel.send({embed: {color: orange, description: `__**Clan not verified!**__\n\nTo verify your clan, add '**top.gg/CW2Stats**' to your clan bio!`}});

        //-------------------------------------------------------------------------------------------------------------------------

        //show current war to start
        //allow member to naviagte through all weeks
        //do not show weeks that would have no players to add

        const rr = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/currentriverrace`);
        const log = await request(`https://proxy.royaleapi.dev/v1/clans/%23${clanTag.substr(1)}/riverracelog`);

        let raceLog = log.items.map(r => ({
            sectionIndex: r.sectionIndex,
            createdDate: r.createdDate,
            clan: r.standings.find(c => c.clan.tag === clanTag).clan
        }));

        raceLog.unshift({ //add current river race to front
            sectionIndex: rr.sectionIndex,
            clan: {
                tag: rr.clan.tag,
                name: rr.clan.name,
                fame: rr.clan.fame,
                participants: rr.clan.participants,
                clanScore: rr.clan.clanScore
            }
        });

        const checkForExistingMatches = async (arr, dateStr) => { //returns arr of matches in DB
            arr = arr.map(m => matches.findOne({ tag: m.tag, date: dateStr, clanTag: clanTag, fame: m.fame }));
            arr = await Promise.all(arr);

            return arr.filter(m => m);
        };

        //RACELOG FILTERS
        for (const r of raceLog) r.clan.participants = r.clan.participants.filter(p => p.decksUsed > 0); //remove all weeks with 0 available players
        raceLog = raceLog.filter(r => r.clan.participants.length > 0 && r.clan.fame > 0); //filter weeks with no participants to add
        raceLog = raceLog.filter(r => !r.createdDate || (r.createdDate && parseDate(r.createdDate) > parseDate('20210614T000000.000Z'))); //created date is past most recent update

        //send directions embed
        await message.channel.send({
            embed: {
                title: `__How to add stats:__`,
                color: color,
                description: `Add scores individually by selecting the week, or add all scores at once using *Smart Add*. Delete any player's most recent score using *${prefix}delete*.\n\n__**1. Select the Week**__\n⏪/⏩ = **Navigate** weeks\n✅ = **Select** week\n✔️ = **Smart Add** entire week (add all players with 16 or more used attacks and 0 boat attacks throughout the week)\n❌ = **Exit**\n\n__**2. Add Player Scores**__\n✅ = **Add** Player's Stats\n❌ = **Skip** Player\n⏭️ = **Skip All** Remaining Players`
            }
        });

        const loadingEmbed = await message.channel.send({
            embed: {
                color: color,
                description: `**Loading...**`
            }
        });

        for (const r of raceLog) { //set createdDateStr and push all matches in all weeks to matchesToBeChecked
            let weekDate;

            if (r.createdDate) {
                weekDate = parseDate(r.createdDate);
                weekDate.setTime(weekDate.getTime() - (24 * 60 * 60 * 1000));
            }
            else { //current week
                weekDate = new Date();
                weekDate.setDate(weekDate.getDate() + (7 + 0 - weekDate.getDay()) % 7);
            }

            r.clan.participants = r.clan.participants.filter(p => p.decksUsed > 0).sort((a, b) => b.fame - a.fame); //remove all players with 0 attacks and sort by fame
            r.createdDate = weekDate;
            r.createdDateStr = `${weekDate.getUTCMonth() + 1}/${weekDate.getUTCDate()}/${weekDate.getUTCFullYear()}`;
            r.matchesInDb = await checkForExistingMatches(r.clan.participants, r.createdDateStr);
        }

        raceLog = raceLog.filter(r => !(r.clan.participants.length === r.matchesInDb.length)); //remove all weeks where all matches have been added

        loadingEmbed.delete();

        //all weeks have already been added
        if (raceLog.length === 0) return message.channel.send({
            embed: { //if no weeks available after filters
                color: color,
                description: `**There are no weeks to add at this time!**`
            }
        });

        // START SELECTION
        let weekSelected = false;
        let index = 0;

        while (!weekSelected) {
            const { sectionIndex, clan, createdDateStr, matchesInDb } = raceLog[index];
            const { name, fame, participants, clanScore } = clan;
            const navigationEmojis = ['⏪', '✅', '⏩', '✔️', '❌'];

            desc = `**__Week ${sectionIndex + 1} (${createdDateStr})__**`;

            if (matchesInDb.length > 0) desc += `\n⚠️ **${matchesInDb.length}/${participants.length} players already added!**`;

            desc += `\n\n**${name}**\n<:fame:807475879215104020>**${fame}**\nParticipants: **${participants.length}**`;

            const weekEmbed = await message.channel.send({
                embed: {
                    title: 'Which week would you like to add?',
                    description: desc,
                    color: color,
                    footer: {
                        text: `${index + 1} of ${raceLog.length}`
                    }
                }
            });

            //react to embed (first and last week don't need forwards and backwards arrow, respectively)
            for (const e of navigationEmojis) {
                if (index === 0 && e === '⏪' && raceLog.length !== 1) continue;
                else if (index === raceLog.length - 1 && e === '⏩' && raceLog.length !== 1) continue;
                await weekEmbed.react(e);
            }
            const emojiCollector = await weekEmbed.awaitReactions((r, u) => u.id === message.author.id && navigationEmojis.includes(r.emoji.name), { max: 1, time: 60000 });
            const firstReact = emojiCollector.first();

            weekEmbed.delete();

            if (!firstReact || firstReact._emoji.name === '❌') return;
            else if (firstReact._emoji.name === '⏪') index--;
            else if (firstReact._emoji.name === '⏩') index++;
            else if (firstReact._emoji.name === '✔️') { //smart add entire week (all players with more than 16 attacks and 0 boat attacks)
                weekSelected = raceLog[index];

                let smartAddParticipants = participants.filter(p => p.decksUsed >= 16 && p.boatAttacks === 0);
                smartAddParticipants = smartAddParticipants.filter(p => !matchesInDb.find(m => m.tag === p.tag && m.clanTag === clanTag && m.date === createdDateStr && m.fame === p.fame)); //remove all players in matchesInDb

                if (smartAddParticipants.length === 0) {
                    return message.channel.send({
                        embed: {
                            color: orange,
                            description: `**All eligible players have already been added for this week! (${createdDateStr})**`
                        }
                    });
                }

                await message.channel.send(`__**Week ${sectionIndex + 1} (${createdDateStr})**__`);

                for (const p of smartAddParticipants) {
                    await matches.insertOne({
                        name: p.name,
                        tag: p.tag,
                        date: createdDateStr,
                        clanTag: clanTag,
                        fame: p.fame,
                        clanTrophies: clanScore
                    });

                    await message.channel.send(`✅ **${p.name}** (${p.tag}): <:fame:807475879215104020>${p.fame}`);
                }

                await message.channel.send(`**Added ${smartAddParticipants.length} member(s)!**`);
            }
            else {
                weekSelected = raceLog[index];

                await message.channel.send(`__**Week ${sectionIndex + 1} (${createdDateStr})**__`);

                const unaddedParticipants = participants.filter(p => !matchesInDb.find(m => m.tag === p.tag && m.clanTag === clanTag && m.date === createdDateStr && m.fame === p.fame)); //remove all players in matchesInDb

                for (const p of unaddedParticipants) {
                    const memEmbedDesc = `<:fame:807475879215104020> **${p.name}**\n\nDecks Used: **${p.decksUsed}**/28`;

                    const memEmbed = await message.channel.send({
                        embed: {
                            color: color,
                            title: `${p.name} (${p.tag})`,
                            description: memEmbedDesc,
                            footer: {
                                text: `${unaddedParticipants.indexOf(unaddedParticipants.find(m => m.tag === p.tag)) + 1} of ${unaddedParticipants.length}`
                            }
                        }
                    });

                    const reactionEmojis = ['✅', '❌', '⏭️'];
                    for (const e of reactionEmojis) await memEmbed.react(e);
                    const memEmojiCollector = await memEmbed.awaitReactions((r, u) => u.id === message.author.id && reactionEmojis.includes(r.emoji.name), { max: 1, time: 30000 });
                    const memFirstReact = memEmojiCollector.first();

                    memEmbed.delete();

                    //check reaction
                    if (!memFirstReact || memFirstReact._emoji.name === '❌') await message.channel.send(`❌ **${p.name}** (${p.tag}): <:fame:807475879215104020>${p.fame}`);
                    else if (memFirstReact._emoji.name === '⏭️') return await message.channel.send(`⏭️ Skipped **${unaddedParticipants.length - unaddedParticipants.indexOf(p)}** member(s)!`);
                    else {
                        await matches.insertOne({
                            name: p.name,
                            tag: p.tag,
                            fame: p.fame,
                            clanTrophies: clanScore,
                            date: createdDateStr,
                            clanTag: clanTag
                        });

                        await message.channel.send(`✅ **${p.name}** (${p.tag}): <:fame:807475879215104020>${p.fame}`);
                    }
                }
            }
        }
    }
}