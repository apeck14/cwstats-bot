const { ApiRequest } = require("../functions/api");
const { groupBy } = require("lodash");
const { orange } = require("../data/colors");
const { average, getDeckUrl, getEmoji, getArenaEmoji } = require("../functions/util");
const BANNED_TAGS = require('../data/bannedTags.js');

module.exports = {
    name: 'decks',
    aliases: ['decks', 'd'],
    description: 'Get top rated war deck set(s) based on a player\'s cards',
    parameters: ['#TAG', '@USER'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const guilds = db.collection('Guilds');
        const decks = db.collection('Decks');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) throw `You can only use this command in the set **command channel**! (<#${commandChannelID}>)`;

        let tag;

        if (!args[0]) {
            const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });

            if (!linkedAccount?.tag)
                return message.channel.send({ embeds: [{ color: orange, description: `**No tag linked!**\n\n__Usage:__\n\`${prefix}link #ABC123\`` }] });

            tag = linkedAccount.tag;
        }
        else if (args[0].startsWith('<@')) {
            const id = args[0].replace(/[^0-9]/g, '');
            const linkedAccount = await linkedAccounts.findOne({ discordID: id });

            if (!linkedAccount) return message.channel.send({ embeds: [{ color: orange, description: `<@!${id}> **does not have an account linked.**` }] });
            tag = linkedAccount.tag;
        }
        else tag = args[0];

        const player = await ApiRequest('', tag, 'players')
            .catch((e) => {
                if (e.response?.status === 404) throw '**Invalid tag.** Try again.';
            });

        if (!player || BANNED_TAGS.includes(player?.clan?.tag)) return;

        const cardsGroupedByLevel = groupBy(player.cards, c => 14 - (c.maxLevel - c.level));

        for (const lvl in cardsGroupedByLevel) {
            cardsGroupedByLevel[lvl] = cardsGroupedByLevel[lvl].map(c => c.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''));
        }

        function containsAllCards(d, cardsAvail) {
            return d.cards.every(c => cardsAvail.includes(c));
        }

        function shareCards(deck1, deck2, deck3, deck4) {
            let cards;

            if (deck4) cards = deck1.cards.concat(deck2.cards, deck3.cards, deck4.cards);
            else if (deck3) cards = deck1.cards.concat(deck2.cards, deck3.cards);
            else cards = deck1.cards.concat(deck2.cards);

            return cards.length !== new Set(cards).size;
        }

        function getAvgLvl(deckSet) {
            let sum = 0;

            for (const d of deckSet) {
                for (const c of d.cards) {
                    const card = player.cards.find(ca => ca.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '') === c);
                    sum += 14 - (card.maxLevel - card.level);
                }
            }

            return sum / 32;
        }

        function totalRating(deckSet) {
            let sum = 0;

            for (const d of deckSet) {
                sum += d.rating;
            }

            return sum;
        }

        const cardsThatCanBePlayedUnderleved = ["Freeze", "Tornado", "Rage", "Inferno Tower", "Fisherman", "Clone", "Inferno Dragon", "Giant Snowball", "Zap", "Electric Spirit", "Skeletons", "Ice Spirit"]; //cards that can be played 2 levels under your top level
        let cardsAvailable = [];
        let lastLvlAdded;

        for (let lvl = 14; lvl >= 1; lvl--) {
            if (cardsGroupedByLevel[`${lvl}`]) {
                for (const c of cardsGroupedByLevel[`${lvl}`]) {
                    if (cardsAvailable.indexOf(c) !== -1) continue;
                    cardsAvailable.push(c);
                }
            }

            for (const c of cardsThatCanBePlayedUnderleved) {
                const cardInfo = player.cards.find(card => card.name === c);
                if (!cardInfo || cardsAvailable.indexOf(c.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')) !== -1) continue;

                const cardLvl = 14 - (cardInfo.maxLevel - cardInfo.level);

                if (lvl - cardLvl <= 2) cardsAvailable.push(c.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''));
            }

            lastLvlAdded = lvl;

            if (cardsAvailable.length >= 32) break;
        }

        if (cardsAvailable.length < 32) return message.channel.send({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] });

        const allDecks = (await decks.find({}).toArray()).sort((a, b) => {
            if (b.rating === a.rating) return new Date(a.dateAdded) - new Date(b.dateAdded);
            return b.rating - a.rating;
        });
        const deckSets = [];

        while (deckSets.length < 2) {
            //get all possible deck sets
            for (let i = 0, len = allDecks.length; i < len - 3; i++) {
                let deck1 = allDecks[i];
                if (deckSets.length === 2 && deck1.rating * 4 <= totalRating(deckSets[1])) break;
                else if (!containsAllCards(deck1, cardsAvailable)) continue;

                for (let x = i + 1; x < len - 2; x++) {
                    let deck2 = allDecks[x];
                    if (deckSets.length === 2 && deck1.rating + (deck2.rating * 3) <= totalRating(deckSets[1])) continue;
                    else if (!containsAllCards(deck2, cardsAvailable)) continue;
                    else if (shareCards(deck1, deck2)) continue;

                    for (let y = x + 1; y < len - 1; y++) {
                        let deck3 = allDecks[y];
                        if (deckSets.length === 2 && (deck1.rating + deck2.rating) + (deck3.rating * 2) <= totalRating(deckSets[1])) continue;
                        else if (!containsAllCards(deck3, cardsAvailable)) continue;
                        else if (shareCards(deck1, deck2, deck3)) continue;

                        for (let z = y + 1; z < len; z++) {
                            let deck4 = allDecks[z];
                            if (deckSets.length === 2 && (deck1.rating + deck2.rating + deck3.rating + deck4.rating) <= totalRating(deckSets[1])) continue;
                            else if (!containsAllCards(deck4, cardsAvailable)) continue;
                            else if (shareCards(deck1, deck2, deck3, deck4)) continue;

                            //add to deckSets if higher rated
                            if (deckSets.length === 0) deckSets.push([deck1, deck2, deck3, deck4]);
                            else if (deckSets.length === 1) {
                                const isHigherThan = totalRating([deck1, deck2, deck3, deck4]) > totalRating(deckSets[0]);
                                if (isHigherThan) deckSets.unshift([deck1, deck2, deck3, deck4]); //add to front
                                else deckSets.push([deck1, deck2, deck3, deck4]); //add to end
                            }
                            else if (deckSets.length === 2) {
                                const [deckSet1Rat, deckSet2Rat, deckSetRat] = [totalRating(deckSets[0]), totalRating(deckSets[1]), totalRating([deck1, deck2, deck3, deck4])];

                                if (deckSetRat > deckSet1Rat) {
                                    deckSets.pop();
                                    deckSets.unshift([deck1, deck2, deck3, deck4]);
                                }
                                else if (deckSetRat > deckSet2Rat) {
                                    deckSets.pop();
                                    deckSets.push([deck1, deck2, deck3, deck4]);
                                }
                            }
                        }
                    }
                }
            }

            //add more cards to cardsAvailable
            if (deckSets.length < 2) {
                lastLvlAdded--;

                if (cardsGroupedByLevel[`${lastLvlAdded}`]?.length > 0) cardsAvailable = cardsAvailable.concat(cardsGroupedByLevel[`${lastLvlAdded}`]);
            }

            if (lastLvlAdded <= 0) break;
        }

        if (deckSets.length === 0) return message.channel.send({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] });

        deckSets.sort((a, b) => {
            const avgRatingA = average(a.map(d => d.rating));
            const avgRatingB = average(b.map(d => d.rating));
            const avgLvlA = getAvgLvl(a);
            const avgLvlB = getAvgLvl(b);

            if (avgRatingA === avgRatingB) {
                if (avgLvlA === avgLvlB) return average(a.map(d => new Date(d.dateAdded).getTime())) - average(b.map(d => new Date(d.dateAdded).getTime()));
                return avgLvlB - avgLvlA;
            }
            return avgRatingB - avgRatingA;
        });

        let desc = `\n**__Best War Deck Set__**\nRating: **${(average(deckSets[0].map(d => d.rating))).toFixed(1)}**\nAvg. Lvl: **${getAvgLvl(deckSets[0]).toFixed(1)}**\n`;

        for (let i = 0; i < 4; i++) {
            desc += `[**Copy**](${getDeckUrl(deckSets[0][i].cards)}): `;
            for (const c of deckSets[0][i].cards) {
                desc += getEmoji(bot, c.replace(/-/g, "_"));
            }

            desc += '\n';
        }

        if (deckSets.length >= 2) {
            desc += `\n**__Alternative__**\nRating: **${(average(deckSets[1].map(d => d.rating))).toFixed(1)}**\nAvg. Lvl: **${getAvgLvl(deckSets[1]).toFixed(1)}**\n`;

            for (let i = 0; i < 4; i++) {
                desc += `[**Copy**](${getDeckUrl(deckSets[1][i].cards)}): `;
                for (const c of deckSets[1][i].cards) {
                    desc += getEmoji(bot, c.replace(/-/g, "_"));
                }

                desc += '\n';
            }
        }

        return message.channel.send({
            embeds: [{
                description: `${getEmoji(bot, getArenaEmoji(player.pb))} **${player.name} | ${player.tag}**\n` + desc,
                color: color,
                footer: {
                    text: `Deck ratings are calculated from win % and usage rate`
                }
            }]
        });
    }
}