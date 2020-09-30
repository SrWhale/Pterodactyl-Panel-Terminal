module.exports = class MessageEvent {
    constructor(client) {
        this.client = client;
    }


    async run(message) {
        if (message.author.bot || message.channel.type === 'dm') return;

        const prefix = await this.client.getPrefix(message.guild.id);
        if (!prefix) return this.client.database.ref(`Pterodactyl/servidores/${message.guild.id}/config/prefix`).set('p!');

        if (!message.content.startsWith(prefix)) return;

        const command = message.content.split(" ")[0].slice(prefix.length);

        const cmd = this.client.commands.find(c => c.help.name.toLowerCase() === command || (c.help.aliases && c.help.aliases.includes(command)));

        if (!cmd) return message.channel.send(new this.client.embed().setDescription(`${message.member}, não foi possível encontrar este comando.`));

        const verify = await cmd.verifyPermissions(message);
        if (verify) return;

        cmd.setMessage(message);

        await cmd.run(prefix | 'p!')

    }
}