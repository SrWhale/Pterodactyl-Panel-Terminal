const axios = require('axios');

module.exports = class Request {
    constructor(url, api) {
        this.conf = {
            url,
            api
        };

        const createRequest = async (response, data) => this.request(response, data);

        this.functions = {
            GetAllServers(result) {
                return result.data.data ? result.data.data : false;
            },

            async GetServerInfo(result) {
                const info = result.data.attributes;

                let aditionalInformation = await createRequest('GetServerProperty', info.identifier);

                aditionalInformation = aditionalInformation.data.attributes;

                const stats = {
                    on: 'Online',
                    off: 'Offline',
                    starting: 'Iniciando',
                    stopping: 'Desligando'
                };
                return {
                    name: info.name,
                    id: info.identifier,
                    description: info.description,
                    isOwner: info.server_owner || false,
                    maxMemory: aditionalInformation.memory.limit,
                    usageMemory: aditionalInformation.memory.current,
                    cpuMax: aditionalInformation.cpu.limit,
                    cpuUsage: aditionalInformation.cpu.current,
                    diskUsage: aditionalInformation.disk.current,
                    maxDisk: aditionalInformation.disk.limit,
                    status: stats[aditionalInformation.state]
                };
            },

        };
    };

    async request(response, data) {

        const URL = await this.getUrl(response, data);

        return new Promise((resolve, reject) => {
            axios.default.get(URL, {
                maxRedirects: 5,
                headers: {
                    'Authorization': 'Bearer ' + this.conf.api,
                    'Content-Type': 'application/json',
                    'Accept': 'Application/vnd.pterodactyl.v1+json',
                },

            }).then(async (result) => {

                return this.functions[response] ? resolve(this.functions[response](result)) : resolve(result)

            }).catch(err => {
                resolve(false);
                console.log(err)
            })
        })
    }



    postRequest(request, type, data, Command) {
        const messages = {
            action: {
                start: 'Servidor iniciado com sucesso.',
                stop: 'Servidor parado com sucesso.',
                restart: 'Servidor reiniciado com sucesso.',
                kill: 'Servidor morto com sucesso.',
                restart: 'Servidor reiniciado com sucesso.'
            },
            command: 'Comando enviado com sucesso.'
        }

        const URL = this.getUrl(request, data);

        return new Promise((resolve, reject) => {
            axios({
                url: URL,
                method: 'POST',
                followRedirect: true,
                maxRedirects: 5,
                headers: {
                    'Authorization': 'Bearer ' + this.conf.api,
                    'Content-Type': 'application/json',
                    'Accept': 'Application/vnd.pterodactyl.v1+json',
                },
                data: type
            }).then((result) => {

                if (![204, 500].includes(result.status)) return console.log(`Ocorreu um erro no postRequest ao ${type.signal ? `${type.signal} o servidor de ${this.conf.url} - ${this.conf.api}` : `enviar um comando para o servidor ${this.conf.url} - ${this.conf.api}`}: ${result}`)

                if (type.signal) return resolve(messages.action[type.signal]);

                if (type.command) return resolve(messages.command)

            }).catch(err => {

                if (err.response.status === 500) return resolve(messages.action[type.signal]);

                resolve(false, err);
                console.log(`Ocorreu um erro ao ${type.signal} um servidor: ${err}`);
            })
        })
    }
    getUrl(request, data) {

        const options = {
            GetAllServers: this.conf.url + '/api/client',
            GetServerInfo: this.conf.url + '/api/client/servers/' + data,
            GetServerProperty: this.conf.url + '/api/client/servers/' + data + '/utilization',
            action: this.conf.url + '/api/client/servers/' + data + '/power',
            command: this.conf.url + '/api/client/servers/' + data + '/command'
        };

        return options[request];
    }
}