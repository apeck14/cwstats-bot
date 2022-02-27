module.exports = {
    getRacePlacements: (race, isColosseum) => { // return [{tag: '', fame: 0, placement: 0}]
        const fameAccessor = (isColosseum) ? 'fame' : 'periodPoints';
        const newRace = race.map(c => ({ tag: c.tag, fame: c[fameAccessor], placement: Infinity }));

        const clansWithPointsSorted = newRace.filter(cl => cl.fame > 0).sort((a, b) => b.fame - a.fame);
        let place = 1;

        for (let i = 0; i < clansWithPointsSorted.length; i++) {
            const clansWithSameFame = [clansWithPointsSorted[i].tag];

            for (let x = i + 1; x < clansWithPointsSorted.length; x++) {
                if (clansWithPointsSorted[x].fame === clansWithPointsSorted[i].fame) clansWithSameFame.push(clansWithPointsSorted[x].tag)
            }

            for (const c of clansWithSameFame) {
                newRace.find(cl => c === cl.tag).placement = place;
            }

            i += clansWithSameFame.length - 1;
            place += clansWithSameFame.length;
        }

        return newRace.sort((a, b) => a.placement - b.placement);
    },
    getAvgFame: (clan, isColosseum, dayOfWeek) => {
        const attacksCompletedToday = clan.participants.reduce((a, b) => a + b.decksUsedToday, 0);
        const currentFame = (isColosseum) ? clan.fame : clan.periodPoints;
        const battleDaysCompleted = () => {
            if (!isColosseum || dayOfWeek <= 3) return 0;
            else return dayOfWeek - 3;
        };

        if (isColosseum) {
            if (attacksCompletedToday === 0 && battleDaysCompleted() === 0) return 0;
            return currentFame / (attacksCompletedToday + (200 * battleDaysCompleted()));
        }

        if (attacksCompletedToday === 0) return 0;
        return currentFame / attacksCompletedToday;
    },
    getProjFame: (clan, isColosseum, dayOfWeek) => {
        const movementPoints = (isColosseum) ? clan.periodPoints : clan.fame;
        const fame = (isColosseum) ? clan.fame : clan.periodPoints;

        if (!isColosseum && movementPoints >= 10000) return 0;

        const maxDuelsCompletedToday = clan.participants.filter(p => p.decksUsedToday >= 2).length;
        const attacksCompletedToday = clan.participants.reduce((a, b) => a + b.decksUsedToday, 0);
        const totalPossibleFame = () => {
            const movementPoints = (isColosseum) ? clan.periodPoints : clan.fame;
            const fame = (isColosseum) ? clan.fame : clan.periodPoints;

            if (!isColosseum && movementPoints >= 10000) return 0;

            const duelsRemainingToday = 50 - clan.participants.filter(p => p.decksUsedToday >= 2).length;
            const totalAttacksRemaining = 200 - clan.participants.reduce((a, b) => a + b.decksUsedToday, 0); //today
            let maxPossibleFame = fame + (duelsRemainingToday * 500) + ((totalAttacksRemaining - (duelsRemainingToday * 2)) * 200); //max fame today

            if (isColosseum) {
                const battleDaysComp = battleDaysCompleted(isColosseum, dayOfWeek);
                maxPossibleFame += 45000 * (3 - battleDaysComp);
                return (maxPossibleFame > 180000) ? 180000 : maxPossibleFame;
            }

            return (maxPossibleFame > 45000) ? 45000 : maxPossibleFame;
        };
        let currentPossibleFame = (maxDuelsCompletedToday * 500) + ((attacksCompletedToday - (maxDuelsCompletedToday * 2)) * 200);
        let winRate = fame / currentPossibleFame;

        if (isColosseum) {
            const battleDaysCompleted = () => {
                if (!isColosseum || dayOfWeek <= 3) return 0;
                else return dayOfWeek - 3;
            };

            if (attacksCompletedToday === 0 && battleDaysCompleted() === 0) return 0;

            currentPossibleFame += 45000 * battleDaysCompleted();
            winRate = fame / currentPossibleFame;

            const projFame = fame + ((totalPossibleFame() - fame) * winRate);

            return (projFame > 180000) ? 180000 : Math.ceil(projFame / 50) * 50;
        }

        if (attacksCompletedToday === 0) return 0;
        const projFame = fame + ((totalPossibleFame() - fame) * winRate);

        return (projFame > 45000) ? 45000 : Math.ceil(projFame / 50) * 50;
    }
}