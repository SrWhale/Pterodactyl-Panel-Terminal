const axios = require('axios');

const functions = require('./functions');

module.exports = class Client extends functions {
    constructor(url, api) {

        super(url, api);

        this.conf = {
            url,
            api
        };

        this.connected = false;


    }

    login() {
        return new Promise((resolve, reject) => {

            this.conf.url = this.conf.url.trim();

            if (this.conf.url.endsWith('/')) this.conf.url = this.conf.url.slice(0, -1);

            setTimeout(() => {
                if (!this.connected) return resolve({ status: false, error: 'I can not connect' });
            }, 1000);

            axios.get(this.conf.url + '/api/client', {
                responseEncoding: 'utf8',
                maxRedirects: 5,
                headers: {
                    'Authorization': 'Bearer ' + this.conf.api,
                    'Content-Type': 'application/json',
                    'Accept': 'Application/vnd.pterodactyl.v1+json',
                },
            }).then((result) => {
                // console.log(result);
                if (!result.status) return resolve({ status: false, error: 'I CAN NOT CONNECT!' });
                if (result.status === 404) return resolve({ status: false, error: 'API IS NOT VALID!' });

                this.connected = true;
                return resolve({ status: true });

            }).catch((err) => {

                if (!err.response) return resolve({ status: false, error: 'I CAN NOT CONNECT' });

                if (err.response.status === 403) {
                    resolve({ status: false, error: 'I CAN NOT CONNECT' });
                    console.log('API KEY IS NOT VALID');
                    return;
                }

                if (err.response.status === 522) {
                    resolve({ status: false, error: 'I CAN NOT CONNECT' });
                    return;
                }

                console.log(err)
            })
        })
    }
}