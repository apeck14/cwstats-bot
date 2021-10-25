module.exports = {
    name: 'update',
    aliases: ['update'],
    disabled: false,
    execute: async (message, args, bot, db) => {
        return message.channel.send(`**__NEW UPDATE: 10/24/2021__**

With the bot being out for a few months now, I was able to gather enough feedback to determine which key features were missing. With that being said, here are some new additions:

- **Clan families!!!**
    - Up to 3 clans can be saved (for now)
    - Use \`?setClan1\`, \`?setClan2\`, \`?setClan3\` to link the 3 clans within your family
    - Easily view race stats, attacks, sync stats, etc now! Simply type ?race 2 to view clan 2's race, ?sync 3 to sync clan 3's stats...and so on.

- **Decks Command**
    - No longer have to have tag linked to use this command
    - Do \`?decks @USER\` or \`?decks #TAG\` to view recommended decks for any player!

- **Leaderboard Command**
    - Do \`?lb 1\` to view 1st clan's leaderboard
    - Similarily, do \`?lb 3 full\` to view clan 3's full leaderboard

- **Prefixes**
    - Can now be up to 2 characters in length

- **Aliases:**
    - Aliases are other ways to type the same command. Here is the full list:
        - attacks: atks
        - clan: c
        - decks: d
        - info: i
        - lb: leaderboard
        - link: save
        - player: p, playa
        - race: r
        - setClan1: setClanTag1
        - setClan2: setClanTag2
        - setClan3: setClanTag3
        - setColor: color
        - stats: s
    - Ex: \`?a 1\` will now show attacks left for your 1st clan

Thank you everyone for your support and feedback. More features are on the way! As always, DM Apehk#5688 on Discord with questions/comments/feedback!`)
    }
}