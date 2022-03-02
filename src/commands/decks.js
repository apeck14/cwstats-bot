const { getPlayer } = require("../util/api");
const { orange, red, pink } = require('../static/colors');
const { getEmoji, getArenaEmoji, average, getDeckUrl } = require("../util/functions");

module.exports = {
    data: {
        name: 'decks',
        description: 'Find top deck sets based for any player!',
        options: [
            {
                type: 3,
                name: 'tag',
                description: '#PLAYERTAG',
                required: false
            },
            {
                type: 6,
                name: 'user',
                description: 'User to view.',
                required: false
            },
            {
                type: 3,
                name: 'exclude-cards',
                description: 'Cards to exclude (separate card names with \',\')',
                required: false
            }
        ]
    },
    run: async (i, db, client) => {
        const linkedAccounts = db.collection('Linked Accounts');
        const decks = db.collection('Decks');

        const user = i.options.getUser('user');
        const iTag = i.options.getString('tag');
        let tag;

        if (!user && !iTag) { //linked account
            const linkedAccount = await linkedAccounts.findOne({ discordID: i.user.id });

            if (linkedAccount?.tag) tag = linkedAccount.tag;
            else return await i.editReply({ embeds: [{ color: orange, description: `**No tag linked!**` }], ephemeral: true });
        }
        else if (iTag) tag = iTag; //tag
        else { //user
            const linkedAccount = await linkedAccounts.findOne({ discordID: user.id });

            if (linkedAccount?.tag) tag = linkedAccount.tag;
            else return await i.editReply({ embeds: [{ color: orange, description: `<@!${user.id}> **does not have an account linked.**` }], ephemeral: true });
        }

        const player = await getPlayer(tag).catch(async e => {
            if (e?.response?.status === 404) throw '**Player not found.**';
            throw e?.response?.statusText || 'Unexpected Error.';
        });

        const allCards = require('../static/cardInfo.js');

        let excludedCards = i.options.getString('exclude-cards')?.split(',')?.map(alias => {
            alias = alias.trim().replace(/\s+/g, '-').replace(/\./g, '');
            const card = allCards.find(c => c.name === alias || c.aliases.includes(alias));

            return card?.name || null;
        }).filter(c => c); //list of card names that cant be used

        excludedCards = [...new Set(excludedCards)];

        if (excludedCards.length > 10)
            return await i.editReply({ embeds: [{ color: orange, description: '**You can only exclude up to 10 cards.**' }], ephemeral: true });

        player.cards = player.cards.map(c => ({ //rename all cards, and give level
            name: c.name.toLowerCase().replace(/\s+/g, '-').replace(/\./g, ''),
            level: 14 - (c.maxLevel - c.level)
        }));

        const cardsThatCanBeUnderLeveled = allCards.filter(c => c.canBeUnderLeveled).map(c => c.name);

        let cardsAvailable = [];
        let lastLvlAdded;

        for (let lvl = 14; lvl >= 1; lvl--) { //add cards available for use
            const sameLevelCards = player.cards.filter(c => c.level === lvl);

            if (sameLevelCards.length === 0) continue;

            //add cards
            for (const c of sameLevelCards) {
                if (!cardsAvailable.includes(c.name) && !excludedCards.includes(c.name)) //not already in cardsAvailable & not in excludedCards
                    cardsAvailable.push(c.name);
            }

            //check for usable underleveled cards
            for (const c of cardsThatCanBeUnderLeveled) {
                const card = player.cards.find(ca => ca.name === c);

                if (!card || cardsAvailable.includes(c) || excludedCards.includes(c)) continue;

                if (lvl - card.level <= 2) //add card if 2 levels or less below current lvl
                    cardsAvailable.push(c);
            }

            lastLvlAdded = lvl;

            if (cardsAvailable.length >= 32) break;
        }

        if (cardsAvailable.length < 32) //less than 32 cards unlocked
            return await i.editReply({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] });

        const allDecks = (await decks.find({}).toArray()).sort((a, b) => {
            if (b.rating === a.rating) return new Date(a.dateAdded) - new Date(b.dateAdded);
            return b.rating - a.rating;
        });

        const deckSetRating = deckSetArr => {
            const sum = deckSetArr.reduce((a, b) => a + b.rating, 0)
            return sum / deckSetArr.length;
        }

        const allCardsAvailable = deckObj => {
            return deckObj.cards.every(c => cardsAvailable.includes(c));
        }

        const shareCards = (deck1, deck2, deck3, deck4) => {
            let cards;

            if (deck4) cards = deck1.cards.concat(deck2.cards, deck3.cards, deck4.cards);
            else if (deck3) cards = deck1.cards.concat(deck2.cards, deck3.cards);
            else cards = deck1.cards.concat(deck2.cards);

            return cards.length !== new Set(cards).size;
        }

        const deckSets = [];

        while (deckSets.length < 2) {
            for (let i = 0, len = allDecks.length; i < len - 3; i++) {
                const deck1 = allDecks[i];
                if (deckSets.length === 2 && deck1.rating * 4 <= deckSetRating(deckSets[1])) break;
                if (!allCardsAvailable(deck1)) continue;

                for (let x = i + 1; x < len - 2; x++) {
                    const deck2 = allDecks[x];
                    if (deckSets.length === 2 && deck1.rating + (deck2.rating * 3) <= deckSetRating(deckSets[1])) break;
                    if (!allCardsAvailable(deck2)) continue;
                    if (shareCards(deck1, deck2)) continue;

                    for (let y = x + 1; y < len - 1; y++) {
                        const deck3 = allDecks[y];
                        if (deckSets.length === 2 && (deck1.rating + deck2.rating) + (deck3.rating * 2) <= deckSetRating(deckSets[1])) break;
                        if (!allCardsAvailable(deck3)) continue;
                        if (shareCards(deck1, deck2, deck3)) continue;

                        for (let z = y + 1; z < len; z++) {
                            const deck4 = allDecks[z];
                            if (deckSets.length === 2 && (deck1.rating + deck2.rating + deck3.rating + deck4.rating) <= deckSetRating(deckSets[1])) break;
                            if (!allCardsAvailable(deck4)) continue;
                            if (shareCards(deck1, deck2, deck3, deck4)) continue;

                            //add to deckSets if higher rated
                            if (deckSets.length === 0) deckSets.push([deck1, deck2, deck3, deck4]);
                            else if (deckSets.length === 1) {
                                const isHigherThan = deckSetRating([deck1, deck2, deck3, deck4]) > deckSetRating(deckSets[0]);
                                if (isHigherThan) deckSets.unshift([deck1, deck2, deck3, deck4]); //add to front
                                else deckSets.push([deck1, deck2, deck3, deck4]); //add to end
                            }
                            else if (deckSets.length === 2) {
                                const [deckSet1Rat, deckSet2Rat, deckSetRat] = [deckSetRating(deckSets[0]), deckSetRating(deckSets[1]), deckSetRating([deck1, deck2, deck3, deck4])];

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

                const newCardsToAdd = player.cards.filter(c => c.level === lastLvlAdded && !excludedCards.includes(c.name)).map(c => c.name);

                if (newCardsToAdd.length > 0)
                    cardsAvailable = cardsAvailable.concat(newCardsToAdd);
            }

            if (lastLvlAdded <= 0) break;
        }

        if (deckSets.length === 0) //no deck sets found
            return await i.editReply({ embeds: [{ color: orange, description: `**No deck sets found.** More cards need to be unlocked.` }] });

        const getAvgCardLvl = (deckSet) => {
            let sum = 0;

            for (const d of deckSet) {
                for (const c of d.cards) {
                    const card = player.cards.find(ca => ca.name === c);
                    sum += card.level;
                }
            }

            return sum / 32;
        }

        deckSets.sort((a, b) => {
            const avgRatingA = deckSetRating(a);
            const avgRatingB = deckSetRating(b);
            const avgLvlA = getAvgCardLvl(a);
            const avgLvlB = getAvgCardLvl(b);

            if (avgRatingA === avgRatingB) {
                if (avgLvlA === avgLvlB) return average(a.map(d => new Date(d.dateAdded).getTime())) - average(b.map(d => new Date(d.dateAdded).getTime()));
                return avgLvlB - avgLvlA;
            }
            return avgRatingB - avgRatingA;
        });

        const embed = {
            title: `${getEmoji(client, getArenaEmoji(player.bestTrophies))} ${player.name} | ${player.tag}`,
            description: ``,
            color: pink,
            footer: {
                text: 'Deck ratings are calculated from win % and usage rate'
            }
        }

        //excluded cards
        if (excludedCards.length > 0)
            embed.description += `**Excluded Cards**: ${excludedCards.map(c => getEmoji(client, c.replace(/-/g, '_'))).join('')}\n\n`;

        //best deck set
        embed.description += `**__Best War Deck Set__**\nRating: **${deckSetRating(deckSets[0]).toFixed(1)}**\nAvg. Level: **${getAvgCardLvl(deckSets[0]).toFixed(1)}**\n`;
        embed.description += `${deckSets[0].map(d => `[**Copy**](${getDeckUrl(d.cards)}): ${d.cards.map(c => getEmoji(client, c.replace(/-/g, '_'))).join('')}\n`).join('')}`;

        //alternative
        if (deckSets.length === 2) {
            embed.description += `\n\n**__Alternative__**\nRating: **${deckSetRating(deckSets[1]).toFixed(1)}**\nAvg. Level: **${getAvgCardLvl(deckSets[1]).toFixed(1)}**\n`;
            embed.description += `${deckSets[1].map(d => `[**Copy**](${getDeckUrl(d.cards)}): ${d.cards.map(c => getEmoji(client, c.replace(/-/g, '_'))).join('')}\n`).join('')}`;
        }

        return await i.editReply({ embeds: [embed] });
    }
};
