const { MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: 'donate',
    aliases: ['donate'],
    description: 'Support the CW2 Stats Bot',
    parameters: [],
    disabled: false,
    execute: async (message, args, bot, db) => {
        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setLabel('Donate')
                    .setStyle('LINK')
                    .setURL('https://paypal.me/cw2stats')
            )

        return message.channel.send({
            embeds: [
                {
                    title: 'Donate with PayPal',
                    description: 'CW2 Stats helps top war clans track member performance, view race stats, automate recruiting, & more! All proceeds help expand the capabilities of the bot.',
                    color: `#3b7bbf`,
                    thumbnail: {
                        url: 'https://w7.pngwing.com/pngs/875/329/png-transparent-paypal-logo-e-commerce-payment-system-paypal-blue-angle-company.png'
                    }
                }
            ],
            components: [row]
        })
    }
}