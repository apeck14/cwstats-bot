const slash = {
    register: async (clientId, commands) => {
        const { REST } = require("@discordjs/rest");
        const { Routes } = require("discord-api-types/v9");

        const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);

        try {
            await rest.put(Routes.applicationCommands(clientId), { body: commands });
            return console.log(`Loaded Slash Commands`);
        } catch (error) {
            return console.log(`Could not load Slash Commands: \n ${error}`);
        }
    },
};

module.exports = slash;
