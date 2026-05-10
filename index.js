const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('public'));

// එක සැරයකට එක පාරක් පමණක් කෝඩ් එකක් ඉල්ලන API එක
app.get('/attack', async (req, res) => {
    const target = req.query.num;
    if (!target) return res.status(400).json({ error: "Target missing!" });

    console.log(`[DEXTER-LOG] Injected Payload to: ${target}`);

    try {
        const { state } = await useMultiFileAuthState('dexter_session');
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: ["Ubuntu", "Chrome", "20.0.04"],
            printQRInTerminal: false
        });

        // Pairing Code එක ඉල්ලීම
        await sock.requestPairingCode(target.replace(/[^0-9]/g, ''));
        
        res.json({ success: true, message: "Payload Delivered" });
    } catch (e) {
        console.log(`[DEXTER-ERROR] ${e.message}`);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, () => console.log(`DEXTER Neural Server Live on ${PORT}`));
