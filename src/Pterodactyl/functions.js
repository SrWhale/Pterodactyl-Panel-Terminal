const axios = require('axios');

const Request = require('./request');

module.exports = class functions {
    constructor(url, api) {
        this.conf = {
            url,
            api
        }
    }


    async getAllServers() {
        return await this.request('GetAllServers');

    };

    async sendCommand(serverId, Command) {
        if (Command.startsWith('/')) Command = Command.slice(1, Command.length);
        console.log(Command)
        return await new Request(this.conf.url, this.conf.api).postRequest('command', { 'command': Command }, serverId);
    }

    async request(name, data) {
        return await new Request(this.conf.url, this.conf.api).request(name, data);
    }

    async stop(data) {
        return await new Request(this.conf.url, this.conf.api).postRequest('action', { 'signal': 'start' }, data);
    }

    async postRequest(type, data) {
        return await new Request(this.conf.url, this.conf.api).postRequest('action', { 'signal': type }, data);
    }

}