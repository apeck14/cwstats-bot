module.exports = {
    data: {
        name: 'test',
        description: 'Test'
    },
    run: async (i, db, client) => {
        const decks = db.collection('Decks');

        const allDecks = await decks.find({}).toArray();

        const now = new Date();

        const oldDecks = allDecks.filter(d => {
            const deckDate = new Date(d.dateAdded);
            const diffInDays = (now.getTime() - deckDate.getTime()) / (1000 * 3600 * 24);

            return diffInDays > 10;
        });

        for (const d of oldDecks) {
            decks.deleteOne({ _id: d._id });
        }
    }
};
