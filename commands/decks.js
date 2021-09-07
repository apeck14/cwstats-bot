const { groupBy } = require("lodash");
const { getPlayerData } = require("../util/clanUtil");
const { average, orange, red, getEmoji } = require("../util/otherUtil");

module.exports = {
    name: 'decks',
    execute: async (message, arg, bot, db) => {
        const guilds = db.collection('Guilds');
        const decks = db.collection('Decks');
        const linkedAccounts = db.collection('Linked Accounts');

        const { channels, prefix, color } = await guilds.findOne({ guildID: message.channel.guild.id });
        const { commandChannelID } = channels;

        //must be in command channel if set
        if (commandChannelID && commandChannelID !== message.channel.id) return message.channel.send({ embed: { color: red, description: `You can only use this command in the set **command channel**! (<#${commandChannelID}>)` } });

        //account must be linked
        const linkedAccount = await linkedAccounts.findOne({ discordID: message.author.id });
        let tag;

        if (!linkedAccount) return message.channel.send({ embed: { color: orange, description: `Please **link** your tag to use this feature!\n\n__Usage:__\n\`${prefix}link #ABC123\`` } });
        else tag = linkedAccount.tag;

        const player = await getPlayerData(tag);
        if (!player) return message.channel.send({ embed: { color: red, description: `**Player not found.** Please re-link your tag with the correct tag.` } });

        const cardsGroupedByLevel = groupBy(player.cards.filter(c => c.maxLevel - c.level < 5), c => 13 - (c.maxLevel - c.level));

        for (const lvl in cardsGroupedByLevel) {
            cardsGroupedByLevel[lvl] = cardsGroupedByLevel[lvl].map(c => c.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''));
        }

        function containsAllCards(d, cardsAvail) {
            return d.cards.every(c => cardsAvail.includes(c));
        }

        function getDeckUrl(cards) {
            const cardData = [
                { key: 'knight', id: 26000000 },
                { key: 'archers', id: 26000001 },
                { key: 'goblins', id: 26000002 },
                { key: 'giant', id: 26000003 },
                { key: 'pekka', id: 26000004 },
                { key: 'minions', id: 26000005 },
                { key: 'balloon', id: 26000006 },
                { key: 'witch', id: 26000007 },
                { key: 'barbarians', id: 26000008 },
                { key: 'golem', id: 26000009 },
                { key: 'skeletons', id: 26000010 },
                { key: 'valkyrie', id: 26000011 },
                { key: 'skeleton-army', id: 26000012 },
                { key: 'bomber', id: 26000013 },
                { key: 'musketeer', id: 26000014 },
                { key: 'baby-dragon', id: 26000015 },
                { key: 'prince', id: 26000016 },
                { key: 'wizard', id: 26000017 },
                { key: 'mini-pekka', id: 26000018 },
                { key: 'spear-goblins', id: 26000019 },
                { key: 'giant-skeleton', id: 26000020 },
                { key: 'hog-rider', id: 26000021 },
                { key: 'minion-horde', id: 26000022 },
                { key: 'ice-wizard', id: 26000023 },
                { key: 'royal-giant', id: 26000024 },
                { key: 'guards', id: 26000025 },
                { key: 'princess', id: 26000026 },
                { key: 'dark-prince', id: 26000027 },
                { key: 'three-musketeers', id: 26000028 },
                { key: 'lava-hound', id: 26000029 },
                { key: 'ice-spirit', id: 26000030 },
                { key: 'fire-spirit', id: 26000031 },
                { key: 'miner', id: 26000032 },
                { key: 'sparky', id: 26000033 },
                { key: 'bowler', id: 26000034 },
                { key: 'lumberjack', id: 26000035 },
                { key: 'battle-ram', id: 26000036 },
                { key: 'inferno-dragon', id: 26000037 },
                { key: 'ice-golem', id: 26000038 },
                { key: 'mega-minion', id: 26000039 },
                { key: 'dart-goblin', id: 26000040 },
                { key: 'goblin-gang', id: 26000041 },
                { key: 'electro-wizard', id: 26000042 },
                { key: 'elite-barbarians', id: 26000043 },
                { key: 'hunter', id: 26000044 },
                { key: 'executioner', id: 26000045 },
                { key: 'bandit', id: 26000046 },
                { key: 'royal-recruits', id: 26000047 },
                { key: 'night-witch', id: 26000048 },
                { key: 'bats', id: 26000049 },
                { key: 'royal-ghost', id: 26000050 },
                { key: 'ram-rider', id: 26000051 },
                { key: 'zappies', id: 26000052 },
                { key: 'rascals', id: 26000053 },
                { key: 'cannon-cart', id: 26000054 },
                { key: 'mega-knight', id: 26000055 },
                { key: 'skeleton-barrel', id: 26000056 },
                { key: 'flying-machine', id: 26000057 },
                { key: 'wall-breakers', id: 26000058 },
                { key: 'royal-hogs', id: 26000059 },
                { key: 'goblin-giant', id: 26000060 },
                { key: 'fisherman', id: 26000061 },
                { key: 'magic-archer', id: 26000062 },
                { key: 'electro-dragon', id: 26000063 },
                { key: 'firecracker', id: 26000064 },
                { key: 'elixir-golem', id: 26000067 },
                { key: 'battle-healer', id: 26000068 },
                { key: 'skeleton-dragons', id: 26000080 },
                { key: 'mother-witch', id: 26000083 },
                { key: 'electro-spirit', id: 26000084 },
                { key: 'electro-giant', id: 26000085 },
                { key: 'cannon', id: 27000000 },
                { key: 'goblin-hut', id: 27000001 },
                { key: 'mortar', id: 27000002 },
                { key: 'inferno-tower', id: 27000003 },
                { key: 'bomb-tower', id: 27000004 },
                { key: 'barbarian-hut', id: 27000005 },
                { key: 'tesla', id: 27000006 },
                { key: 'elixir-collector', id: 27000007 },
                { key: 'x-bow', id: 27000008 },
                { key: 'tombstone', id: 27000009 },
                { key: 'furnace', id: 27000010 },
                { key: 'goblin-cage', id: 27000012 },
                { key: 'goblin-drill', id: 27000013 },
                { key: 'fireball', id: 28000000 },
                { key: 'arrows', id: 28000001 },
                { key: 'rage', id: 28000002 },
                { key: 'rocket', id: 28000003 },
                { key: 'goblin-barrel', id: 28000004 },
                { key: 'freeze', id: 28000005 },
                { key: 'mirror', id: 28000006 },
                { key: 'lightning', id: 28000007 },
                { key: 'zap', id: 28000008 },
                { key: 'poison', id: 28000009 },
                { key: 'graveyard', id: 28000010 },
                { key: 'the-log', id: 28000011 },
                { key: 'tornado', id: 28000012 },
                { key: 'clone', id: 28000013 },
                { key: 'earthquake', id: 28000014 },
                { key: 'barbarian-barrel', id: 28000015 },
                { key: 'heal-spirit', id: 28000016 },
                { key: 'giant-snowball', id: 28000017 },
                { key: 'royal-delivery', id: 28000018 }
            ]

            let url = 'https://link.clashroyale.com/deck/en?deck=';

            for (const c of cards) {
                url += `${cardData.find(ca => ca.key === c).id};`;
            }

            return url.substring(0, url.length - 1);
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
                    sum += 13 - (card.maxLevel - card.level);
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

        let cardsAvailable = [];
        let lastLvlAdded;

        for (let lvl = 13; lvl >= 1; lvl--) {
            if (cardsGroupedByLevel[`${lvl}`]) cardsAvailable = cardsAvailable.concat(cardsGroupedByLevel[`${lvl}`]);
            lastLvlAdded = lvl;

            if (cardsAvailable.length >= 32) break;
        }

        if (cardsAvailable.length < 32) return message.channel.send({ embed: { color: orange, description: `**No deck sets found.** More cards need to be unlocked.` } });

        const allDecks = (await decks.find({}).toArray()).sort((a, b) => b.rating - a.rating);
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

        if (deckSets.length === 0) return message.channel.send({ embed: { color: orange, description: `**No deck sets found.** More cards need to be unlocked.` } });

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
            embed: {
                description: desc,
                color: color,
                author: {
                    name: `${player.name} | ${player.tag}`
                }
            }
        });
    }
}