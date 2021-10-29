module.exports = {
    pbRating: (player) => {
        if (!player.pb) return 0;

        const max = 8000; // 100 rating
        const min = 3000; // 0 rating

        if (player.pb >= max) return 100;
        else if (player.pb <= min) return 0;

        return ((player.pb - min) / (max - min)) * 100;
    },
    cardsRating: (player) => {
        if (!player.cards) return 0;

        let rating = 0;

        for (const c of player.cards) {
            const diff = c.maxLevel - c.level;

            if (diff === 0) rating++; //level 14
            else if (diff === 1) rating += 0.75; //level 13
            else if (diff === 2) rating += 0.35; //level 12
            else if (diff === 3) rating += 0.15; //level 11
            else if (diff === 4) rating += 0.08; //level 10
            else if (diff === 5) rating += 0.04; //level 9
            else if (diff === 5) rating += 0.02; //level 8
            else if (diff === 5) rating += 0.01; //level 7
            else if (diff === 5) rating += 0.004; //level 6
            else if (diff === 5) rating += 0.0015; //level 5
            else if (diff === 5) rating += 0.0005; //level 4
            else if (diff === 5) rating += 0.0002; //level 3
            else if (diff === 5) rating += 0.00005; //level 2
        }

        return rating;
    },
    challRating: (player) => {
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
        if (isNaN(player.challWins)) return 0;

        let challengesRating = (player.challWins * 5) + (player.grandChallWins * 50);
        const mostChallWinsRating = player.mostChallWins * 5;

        if (challengesRating > 100) challengesRating = 100;

        return (challengesRating * 0.3) + (mostChallWinsRating * 0.7);
    },
    cw1Rating: (player) => {
        if (!player.warWins) return 0;

        const max = 350; // 100 rating

        if (player.warWins >= max) return 100;
        return player.warWins / 3.5;
    }
}