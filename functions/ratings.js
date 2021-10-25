module.exports = {
    /*
        100: 7500
        80: 6900
        60: 6300
        40: 5700
        20: 5100
        0: 4500
    */
    pbRating: (player) => {
        if (!player.pb) return 0;

        if (player.pb >= 7500) return 100;
        else if (player.pb <= 4500) return 0;

        return ((player.pb - 4500) / 3000) * 100;
    },
    /*
        Lvl 13 = +1
        Lvl 12 = +0.5
        Lvl 11 = +0.2
        Lvl 10 = +0.08
        Lvl 9 = +0.04

        100: 100+
        80: 80
        60: 60
        40: 40
        20: 20
        0: 0
    */
    cardsRating: (player) => {
        if (!player.cards) return 0;

        let sum = 0;

        for (const c of player.cards) {
            const diff = c.maxLevel - c.level;

            if (diff === 0) sum++;
            else if (diff === 1) sum += 0.5;
            else if (diff === 2) sum += 0.2;
            else if (diff === 3) sum += 0.08;
            else if (diff === 4) sum += 0.04;
        }

        return sum;
    },
    /*
        Challenges: (30%)
        GC = +50
        CC = +5

        100: 100+
        80: 80
        60: 60
        40: 40
        20: 20
        0: 0

        Most Chall Wins: (70%)
        100: 20
        80: 16
        60: 12
        40: 8
        20: 4
        0: 0
    */
    challRating: (player) => {
        if (!player.challWins) return 0;

        let challengesRating = (player.challWins * 5) + (player.grandChallWins * 50);
        const mostChallWinsRating = player.mostChallWins * 5;

        if (challengesRating > 100) challengesRating = 100;

        return (challengesRating * 0.3) + (mostChallWinsRating * 0.7);
    },
    /*
        100: 325+
        80: 260
        60: 195
        40: 130
        20: 65
        0: 0
    */
    cw1Rating: (player) => {
        if (!player.warWins) return 0;

        if (player.warWins >= 350) return 100;
        return player.warWins / 3.5;
    }
}