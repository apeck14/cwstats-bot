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

        if (isNaN(maxChallWins) || isNaN(ccWins) || isNaN(gcWins)) return 0;

        let total = 0;

        //CCs
        //1: +10
        //2-9: +1 (18)
        //10: +15 (33)
        //11-49: +2 (109)
        //50: +20 (129)
        //51-99: +3 (273)
        //100: +25 (298)
        //100+: +4
        for (let n = 0; n < ccWins; n++) {
            if (n === 1) total += 10;
            else if (n < 10) total += 1;
            else if (n === 10) total += 15;
            else if (n < 50) total += 2;
            else if (n === 50) total += 20;
            else if (n < 100) total += 3;
            else if (n === 100) total += 25;
            else total += 4;
        }

        //GCs
        //1: +20
        //2-9: +5 (60)
        //10: +30 (90)
        //11-49: +7 (356)
        //50: +40 (396)
        //51-99: +9 (828)
        //100: +50 (878)
        //100+: +10
        for (let n = 0; n < gcWins; n++) {
            if (n === 1) total += 20;
            else if (n < 10) total += 5;
            else if (n === 10) total += 30;
            else if (n < 50) total += 7;
            else if (n === 50) total += 40;
            else if (n < 100) total += 9;
            else if (n === 100) total += 50;
            else total += 10;
        }

        //Most Chall Wins
        //13: +10
        //14: +20 (30)
        //15: +30 (60)
        //16: +40 (100)
        //17: +50 (150)
        //18: +60 (210)
        //19: +70 (280)
        //20: +80 (360)
        if (maxChallWins > 12) {
            for (let i = 13; i <= maxChallWins; i++) {
                total += (i - 12) * 10;
            }
        }

        if (total >= 800) return 100;

        return (total / 800) * 100;
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