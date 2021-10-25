module.exports = {
    name: 'ready',
    once: true,
    execute: (bot) => {
        console.log('CW2 Stats is online!');

        bot.user.setActivity(`NEW UPDATE: ?update`);
    }
}