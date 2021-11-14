module.exports = {
    name: 'donate',
    aliases: ['donate'],
    description: 'Support the CW2 Stats Bot',
    parameters: [],
    disabled: false,
    execute: async (message, args, bot, db) => {
        return message.channel.send({
            embeds: [
                {
                    title: 'Donate with PayPal',
                    description: 'CW2 Stats strives to assist top war clans by tracking war performances, race stats, automating recruitment, & much more. However, there are monthly costs in order for the bot to have these capabilities. If I have assisted your clan in any way, please consider donating a small amount. :slight_smile:\n\n[__**Donate**__](https://paypal.me/cw2stats)',
                    color: `#3b7bbf`,
                    thumbnail: {
                        url: 'https://w7.pngwing.com/pngs/875/329/png-transparent-paypal-logo-e-commerce-payment-system-paypal-blue-angle-company.png'
                    }
                }
            ]
        })
    }
}