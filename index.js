const { default: makeWASocket, useSingleFileAuthState, MessageType, MessageOptions, WA_DEFAULT_EPHEMERAL } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // prints the QR code in the terminal
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== 401;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.key.fromMe && m.type === 'notify') {
            const from = msg.key.remoteJid;

            const buttonMessage = {
                text: "Hello! Click the button below:",
                buttons: [
                    { buttonId: 'id1', buttonText: { displayText: 'Click Me' }, type: 1 }
                ],
                headerType: 1
            };

            await sock.sendMessage(from, buttonMessage);
        }
    });
}

connectToWhatsApp();
