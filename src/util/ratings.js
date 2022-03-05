const allCards = require('../static/cardInfo');
const { championUpgrades, legendaryUpgrades, epicUpgrades, rareUpgrades, commonUpgrades } = require('../static/cardUpgrades');
const { average } = require('./functions');

module.exports = {
    getCW1Rating: cw1Wins => {
        //0 - 390
        if (isNaN(cw1Wins)) return 0;

        if (cw1Wins >= 390) return 100;

        return (cw1Wins / 390) * 100;

    },
    getPBRating: pb => {
        //4000 - 8200
        if (isNaN(pb)) return 0;

        const min = 4000;
        const max = 8200;

        if (pb <= min) return 0;
        else if (pb >= max) return 100;

        return ((pb - min) / (max - min)) * 100;
    },
    getChallsRating: (maxChallWins, ccWins, gcWins) => {
        //0 - 750
        //CC: +1
        //GC: +10
        //Most Chall Wins: +(n - 12) * 10 (for each win above 12)
        if (isNaN(maxChallWins) || isNaN(ccWins) || isNaN(gcWins)) return 0;

        let total = 0;

        total += ccWins;
        total += gcWins * 10;

        if (maxChallWins > 12) {
            for (let i = 13; i < maxChallWins; i++) {
                total += (i - 12) * 10;
            }
        }

        if (total >= 750) return 100;

        return (total / 750) * 100;
    },
    getCardsRating: cards => {
        //no cards collected - all cards collected
        const totalChampions = allCards.filter(c => c.rarity === 'champion').length;
        const totalLegendaries = allCards.filter(c => c.rarity === 'legendary').length;
        const totalEpics = allCards.filter(c => c.rarity === 'epic').length;
        const totalRares = allCards.filter(c => c.rarity === 'rare').length;
        const totalCommons = allCards.filter(c => c.rarity === 'common').length;

        const championsToMax = totalChampions * championUpgrades.total;
        const legendariesToMax = totalLegendaries * legendaryUpgrades.total;
        const epicsToMax = totalEpics * epicUpgrades.total;
        const raresToMax = totalRares * rareUpgrades.total;
        const commonsToMax = totalCommons * commonUpgrades.total;

        let championsCollected = 0;
        let legendariesCollected = 0;
        let epicsCollected = 0;
        let raresCollected = 0;
        let commonsCollected = 0;

        for (const c of cards) {
            const level = 14 - (c.maxLevel - c.level);
            const rarity = allCards.find(ca => ca.id === c.id).rarity;

            const rarityUpgrades =
                rarity === 'champion'
                    ? championUpgrades
                    : rarity === 'legendary'
                        ? legendaryUpgrades
                        : rarity === 'epic'
                            ? epicUpgrades
                            : rarity === 'rare'
                                ? rareUpgrades
                                : commonUpgrades;

            //all levels below or equal to current card level
            const levelsCompleted = Object.keys(rarityUpgrades).map(prop => parseInt(prop)).filter(prop => !isNaN(prop) && prop <= level);

            let cardsCollected = 0;

            for (lvl of levelsCompleted) {
                if (rarity === 'common') cardsCollected += rarityUpgrades[lvl];
                else if (rarity === 'rare') cardsCollected += rarityUpgrades[lvl];
                else if (rarity === 'epic') cardsCollected += rarityUpgrades[lvl];
                else if (rarity === 'legendary') cardsCollected += rarityUpgrades[lvl];
                else cardsCollected += rarityUpgrades[lvl];
            }

            cardsCollected += c.count; //current card count

            if (rarity === 'common') commonsCollected += cardsCollected;
            else if (rarity === 'rare') raresCollected += cardsCollected;
            else if (rarity === 'epic') epicsCollected += cardsCollected;
            else if (rarity === 'legendary') legendariesCollected += cardsCollected;
            else championsCollected += cardsCollected;

        };

        //all card types hold equal weight
        return average([
            championsCollected / championsToMax,
            legendariesCollected / legendariesToMax,
            epicsCollected / epicsToMax,
            raresCollected / raresToMax,
            commonsCollected / commonsToMax
        ]) * 100;
    }
}