const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { ttdl } = require('btch-downloader');
const chalk = require('chalk');
const figlet = require('figlet');
const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const data = {
        status: 'true',
        message: 'Bot Successfully Activated!',
        author: 'BOTCAHX'
    };
    const result = {
        response: data
    };
    res.send(JSON.stringify(result, null, 2));
});

function listenOnPort(port) {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
    app.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying another port...`);
            listenOnPort(port + 1);
        } else {
            console.error(err);
        }
    });
}

listenOnPort(port);

const logs = (message, color) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(chalk[color](`[${timestamp}] => ${message}`));
};

const Figlet = () => {
    figlet('tiktokdl', { font: 'Block', horizontalLayout: 'default' }, function (err, data) {
        if (err) {
            console.log('Error:', err);
            return;
        }
        console.log(chalk.yellow.bold(data));
        console.log(chalk.yellow(`BOTCAHX`));
    });
};

async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version, isLatest } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        const From = msg.key.remoteJid;

        if (msg.message.conversation.startsWith('/start')) {
            const caption = `This bot is specially designed to help you download TikTok videos automatically. Just send the URL of the TikTok video you want to download, and this bot will do the job quickly and easily!`;
            await sock.sendMessage(From, { text: caption });
        }

        if (msg.message.conversation.match(/^https:\/\/.*tiktok\.com\/.+/)) {
            const url = msg.message.conversation;
            try {
                const data = await ttdl(url);
                const audio = data.audio[0];
                const { title, title_audio } = data;

                await sock.sendMessage(From, { video: { url: data.video[0] }, caption: title });
                await sleep(3000);
                await sock.sendMessage(From, { audio: { url: audio }, mimetype: 'audio/mpeg', fileName: title_audio });
                await sleep(3000);
                await sock.sendMessage(From, { text: 'Powered by @wtffry' });
            } catch (error) {
                await sock.sendMessage(From, { text: 'Sorry, an error occurred while downloading the TikTok video.' });
                console.log(`[ ERROR ] ${From}: ${error.message}`, 'red');
            }
        }
    });
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

startSock();
