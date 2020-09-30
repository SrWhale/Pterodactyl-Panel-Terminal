const { Client } = require('./Pterodactyl/index');

const inquirer = require("inquirer");

const dotenv = require('dotenv').config();

const ora = require("ora");

const chalk = require('chalk');

const shell = require('shelljs');

main();

async function main() {
    await shell.exec('cls');

    const { url, api } = require('../config.json');

    const client = new Client(url, api);

    const spinLogin = ora('   Realizando conexão com o painel...')
    client.login().then(async (status) => {
        if (status.error && !status.status) {
            spinLogin.succeed(`   Não foi possível estabelecer a conexão com o painel informado.`);
            return process.exit();
        }

        if (!status.status) {
            spinLogin.succeed(`   Não foi possível logar utilizando estas credenciais.Por favor, verifique se a API está correta e configure novamente.`);
            return process.exit();
        }

        if (!status.status && status.error) process.exit();
        spinLogin.succeed('   Conexão com o painel estabelecida.');

        const spinGetAllServers = ora('   Requisitando servidores da conta...').start();
        const servers = await client.getAllServers();

        if (!servers.length && !servers) return spinGetAllServers.succeed(`   Você não possui nenhum servidor em sua conta.`);

        spinGetAllServers.succeed('   Servidores requisitados com sucesso.')
        const serversIdentifier = servers.map(r => r.attributes.name + ' - ' + r.attributes.identifier);

        const input = await inquirer.prompt({
            type: 'list',
            name: 'serverID',
            message: '   Selecione o servidor que deseja gerenciar.',
            choices: serversIdentifier
        });

        const selected = servers[serversIdentifier.indexOf(input.serverID)];

        const serverStatus = await client.request('GetServerInfo', selected.attributes.identifier);

        const allowedOptions = ['Online', 'Desligando', 'Reiniciando', 'Iniciando'].includes(serverStatus.status)
            ? ['Reiniciando', 'Desligando'].includes(serverStatus.status)
                ? serverStatus.status === 'Desligando'
                    ? [chalk.yellow('Matar')]
                    : [chalk.red('Desligar'), chalk.yellow('Matar')]
                : [chalk.cyan('Reiniciar'), chalk.red('Desligar'), chalk.yellow('Matar')]
            : [chalk.green('Iniciar')];

        const printImformations = [
            [chalk.cyan('\n')],
            [chalk.cyan(`   Servidor selecionado: ${selected.attributes.name} (${selected.attributes.identifier})`)],
            [chalk.cyan(`\n`)],
            [chalk.cyan(`   Status: ${serverStatus.status}`)],
            [chalk.cyan(`   Uso de memória RAM: ${serverStatus.usageMemory}/${serverStatus.maxMemory} MB`)],
            [chalk.cyan(`   Uso de CPU: ${serverStatus.cpuUsage}%`)],
            [chalk.cyan(`   Uso de disco: ${serverStatus.diskUsage}/${serverStatus.maxDisk} MB`)],
            ['\n'],
        ];

        console.log(printImformations.join('\n'));

        const inputAction = await inquirer.prompt({
            type: 'list',
            name: 'action',
            message: '   Selecione o que deseja fazer com o servidor.',
            choices: allowedOptions
        });

        const startAction = ora("   " + inputAction.action + ' servidor...').start();

        switch (inputAction.action) {

            case chalk.red('Desligar'):
                const stop = await client.postRequest('stop', selected.attributes.identifier);
                if (stop === "Servidor desligado com sucesso.") return setTimeout(async () => {
                    startAction.succeed('   Servidor desligado com sucesso.');

                    const end = await inquirer.prompt({
                        type: 'list',
                        name: 'response',
                        message: '   Deseja visualizar outro servidor ou finalizar a sessão?.',
                        choices: [chalk.green('Visualizar'), chalk.red('Finalizar')]
                    });

                    if (end.response === 'Visualizar') return main();
                    if (end.response === 'Finalizar') return process.exit();
                }, 5000);
                break;

            case chalk.green('Iniciar'):
                const start = await client.postRequest('start', selected.attributes.identifier);
                if (start === "Servidor iniciado com sucesso.") return setTimeout(async () => {
                    startAction.succeed('   Servidor ligado com sucesso.');

                    const end = await inquirer.prompt({
                        type: 'list',
                        name: 'response',
                        message: '   Deseja visualizar outro servidor ou finalizar a sessão?.',
                        choices: ['Visualizar', 'Finalizar']
                    });

                    if (end.response === 'Visualizar') return main();
                    if (end.response === 'Finalizar') return process.exit();
                }, 5000);
                break;

            case chalk.yellow('Matar'):
                const kill = await client.postRequest('kill', selected.attributes.identifier);
                if (kill === "Servidor morto com sucesso.") return setTimeout(async () => {
                    startAction.succeed('   Servidor morto com sucesso.');

                    const end = await inquirer.prompt({
                        type: 'list',
                        name: 'response',
                        message: '   Deseja visualizar outro servidor ou finalizar a sessão?.',
                        choices: ['Visualizar', 'Finalizar']
                    });

                    if (end.response === 'Visualizar') return main();
                    if (end.response === 'Finalizar') return process.exit();
                }, 5000)
                break;

            case chalk.cyan('Reiniciar'):
                const reiniciar = await client.postRequest('restart', selected.attributes.identifier);
                if (reiniciar === 'Servidor reiniciado com sucesso.') return setTimeout(async () => {
                    startAction.succeed('   Servidor reiniciado com sucesso.');

                    const end = await inquirer.prompt({
                        type: 'list',
                        name: 'response',
                        message: '   Deseja visualizar outro servidor ou finalizar a sessão?.',
                        choices: ['Visualizar', 'Finalizar']
                    });

                    if (end.response === 'Visualizar') return main();
                    if (end.response === 'Finalizar') return process.exit();
                }, 5000)
                break;
        }

    })
};