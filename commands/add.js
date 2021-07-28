const { verifyClanBio } = require("../util/clanUtil");
const mongoUtil = require("../util/mongoUtil");
const { request, red, parseDate } = require("../util/otherUtil");

module.exports = {
    name: 'add',
    execute: async (message) => {
        const db = await mongoUtil.db("General");
        const players = db.collection('Players');
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
            seasonId: r.seasonId,
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

        //remove all weeks with 0 available players
        for (const r of raceLog) {
            r.clan.participants = r.clan.participants.filter(p => p.decksUsed > 0);
        }

        raceLog = raceLog.filter(r => r.clan.participants.length > 0 && r.clan.fame > 0); //filter weeks with no participants to add
        raceLog = raceLog.filter(r => !r.createdDate || (r.createdDate && parseDate(r.createdDate) > parseDate('20210712T000000.000Z'))); //created date is past most recent update

        if (raceLog.length === 0) return message.channel.send({
            embed: { //if no weeks available after filters
                color: color,
                description: `There are no weeks to add at this time!`
            }
        });

        //send directions embed
        await message.channel.send({
            embed: {
                title: `__How to add stats:__`,
                color: color,
                footer: {
                    text: `If you add a score by accident, use ${prefix}delete to delete the score.`
                },
                description: `__**1. Select the Week**__\n⏪/⏩ = **Navigate** weeks\n✅ = **Select** Week\n❌ = **Cancel**\n\n*Note: Weeks with no participants or 0 clan fame, will not show up.*\n\n__**2. Add Player Scores**__\n✅ = **Add** Player's Stats\n❌ = **Skip** Player\n⏭️ = **Skip All** Remaining Players`
            }
        });

        let weekSelected = false;
        let index = 0;

        while (!weekSelected) {
            const { sectionIndex, clan, createdDate } = raceLog[index];
            const { name, fame, participants } = clan;

            if (!createdDate)
                desc = `**__Week ${sectionIndex + 1}__ (Current Week)**\n\n**${name}**\n<:fame:807475879215104020>${fame}\n**Participants:** ${participants.length}`;
            else {
                const weekDate = parseDate(createdDate);
                weekDate.setTime(weekDate.getTime() - (24 * 60 * 60 * 1000));

                desc = `**__Week ${sectionIndex + 1}__ (${weekDate.getUTCMonth()}/${weekDate.getUTCDate()}/${weekDate.getUTCFullYear()})**\n\n**${name}**\n<:fame:807475879215104020>${fame}\n**Participants:** ${participants.length}`;
            }

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

            const navigationEmojis = ['⏪', '✅', '⏩', '❌'];

            //react to embed (first and last week don't need forwards and backwards arrow, respectively)
            for (const e of navigationEmojis) {
                if (index === 0 && e === '⏪' && raceLog.length !== 1) continue;
                else if (index === raceLog.length - 1 && e === '⏩' && raceLog.length !== 1) continue;
                await weekEmbed.react(e);
            }

            const emojiCollector = await weekEmbed.awaitReactions((r, u) => u.id === message.author.id && navigationEmojis.includes(r.emoji.name), { max: 1, time: 60000 });
            const firstReact = emojiCollector.first();

            weekEmbed.delete();

            //check reaction
            if (!firstReact || firstReact._emoji.name === '❌') return;
            else if (firstReact._emoji.name === '⏪') index--;
            else if (firstReact._emoji.name === '⏩') index++;
            else {
                weekSelected = raceLog[index];

                let weekSelectedDate;

                if (weekSelected.createdDate) {
                    weekSelectedDate = parseDate(weekSelected.createdDate);
                    weekSelectedDate.setTime(weekSelectedDate.getTime() - (24 * 60 * 60 * 1000));

                    await message.channel.send(`__**Week ${weekSelected.sectionIndex + 1} (${(!weekSelected.createdDate) ? 'Current Week' : `${weekSelectedDate.getUTCMonth()}/${weekSelectedDate.getUTCDate()}/${weekSelectedDate.getUTCFullYear()}`})**__`);
                }
            }
        }

        const selectedCreatedDate = weekSelected.createdDate;
        const selectedParticipants = weekSelected.clan.participants.sort((a, b) => b.fame - a.fame);
        const selectedClanScore = weekSelected.clan.clanScore;

        // SEND PLAYER EMBEDS W/ REACTIONS ------------------------------------------------------------
        for (const p of selectedParticipants) {
            const pTag = p.tag;
            const pName = p.name;
            const pFame = p.fame;
            const { decksUsed, decksUsedToday } = p;

            let memEmbedDesc = `<:fame:807475879215104020> **${pFame}**\n\nDecks Used: **${decksUsed}**/28`;
            if (!selectedCreatedDate) memEmbedDesc += `\nDecks Used Today: **${decksUsedToday}**/4`;

            const memEmbed = await message.channel.send({
                embed: {
                    color: color,
                    title: `${pName} (${pTag})`,
                    description: memEmbedDesc,
                    footer: {
                        text: `${selectedParticipants.indexOf(selectedParticipants.find(p => p.tag === pTag)) + 1} of ${selectedParticipants.length}`
                    }
                }
            });

            const reactionEmojis = ['✅', '❌', '⏭️'];
            for (const e of reactionEmojis) await memEmbed.react(e);
            const memEmojiCollector = await memEmbed.awaitReactions((r, u) => u.id === message.author.id && reactionEmojis.includes(r.emoji.name), { max: 1, time: 30000 });
            const memFirstReact = memEmojiCollector.first();

            //check reaction
            if (!memFirstReact || memFirstReact._emoji.name === '❌') {
                memEmbed.delete();
                await message.channel.send(`❌ **${pName}** (${pTag}): <:fame:807475879215104020>${pFame}`);
            }
            else if (memFirstReact._emoji.name === '⏭️') {
                memEmbed.delete();
                return await message.channel.send(`⏭️ Skipped **${selectedParticipants.length - selectedParticipants.indexOf(p)}** member(s)!`);
            }
            else {
                const player = await players.findOne({ tag: pTag });

                const getDate = () => { //get date string to set in DB, current week needs to be calculated
                    if (!selectedCreatedDate) { //current week, find next sunday
                        const resultDate = new Date();
                        resultDate.setDate(date.getDate() + (7 + 0 - date.getDay()) % 7);
                        return `${resultDate.getUTCMonth()}/${resultDate.getUTCDate()}/${resultDate.getUTCFullYear()}`;
                    }
                    else { //subtract 1 day, supercell date strings show Mondays
                        const resultDate = parseDate(selectedCreatedDate);
                        resultDate.setTime(resultDate.getTime() - (24 * 60 * 60 * 1000));
                        return `${resultDate.getUTCMonth()}/${resultDate.getUTCDate()}/${resultDate.getUTCFullYear()}`;
                    }
                }

                //if player not in database (new player)
                if (!player) {
                    await players.insertOne({
                        name: pName,
                        tag: pTag,
                        fameTotals: [{
                            fame: pFame,
                            clanTrophies: selectedClanScore,
                            date: getDate(),
                            clanTag: clanTag
                        }]
                    });

                    await message.channel.send(`✅ **${pName}** (${pTag}): <:fame:807475879215104020>${pFame}`);
                }
                else {
                    const weekExists = player.fameTotals.find(w => w.fame === pFame && w.date === getDate() && w.clanTag === clanTag);

                    if (weekExists) //score has already been added
                        await message.channel.send(`⚠️ **${pName}** - **${getDate()}**: <:fame:807475879215104020>**${pFame}** already exists!`);
                    else {
                        await players.updateOne({ tag: pTag }, {
                            $push: {
                                fameTotals: {
                                    fame: pFame,
                                    clanTrophies: selectedClanScore,
                                    date: getDate(),
                                    clanTag: clanTag
                                }
                            }
                        });

                        await message.channel.send(`✅ **${pName}** (${pTag}): <:fame:807475879215104020>${pFame}`);
                    }
                }
                memEmbed.delete();
            }

        }

    }

}