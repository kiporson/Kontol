const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const P = require('pino')
const fs = require('fs')

const { state, saveState } = useSingleFileAuthState('./auth_info.json')

async function startSock() {
    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state
    })

    sock.ev.on('creds.update', saveState)

    sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
        if(connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            if(shouldReconnect) {
                startSock()
            }
        } else if(connection === 'open') {
            console.log('✅ DIABLO is connected to WhatsApp')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if(type !== 'notify') return;
        const msg = messages[0]
        const sender = msg.key.remoteJid

        if(!msg.message) return;

        const text = msg.message.conversation || msg.message.extendedTextMessage?.text

        // Hanya izinkan dari PAPIPUPOR
        if(sender !== "628XXXXXXXXXX@s.whatsapp.net") return;

        if(text?.toLowerCase() === "bangun sistemmu") {
            await sock.sendMessage(sender, { text: "🔧 DIABLO sedang membangun dirinya sendiri..." })
            // Simulasi sistem membangun diri (tambahkan logika asli di sini)
        }
    })
}

startSock()
