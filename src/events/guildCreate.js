module.exports = class GuildCreateEvent {
    constructor(client) {

        this.client = client;
    }

    run(guild) {
        this.client.database.ref(`Pterodactyl/servidores/${guild.id}/config/prefix`).set('p!');
    }
}