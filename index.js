const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// --- Search API ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ status: false, message: "සර්ච් කරන්න නමක් දෙන්න. (?q=movie_name)" });

        const url = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://sinhalasub.lk/'
            }
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // Inspect එකට අනුව සයිට් එකේ තියෙන result-item class එක පීරමු
        $('.result-item').each((i, el) => {
            const title = $(el).find('.result-title a').text().trim();
            const link = $(el).find('.result-title a').attr('href');
            const image = $(el).find('.result-item-poster img').attr('src');
            const year = $(el).find('.result-year').text().trim();

            if (title && link) {
                results.push({
                    title: title,
                    year: year || "N/A",
                    link: link,
                    image: image
                });
            }
        });

        res.json({ 
            status: true, 
            owner: "DEXTER", 
            count: results.length, 
            results 
        });

    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

// --- Get Download Links API ---
app.get('/api/getlink', async (req, res) => {
    try {
        const movieUrl = req.query.url;
        if (!movieUrl) return res.json({ status: false, message: "URL එක ලබා දෙන්න." });

        const response = await axios.get(movieUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(response.data);
        let dlLinks = [];

        // Sinhalasub වල ඩවුන්ලෝඩ් ලින්ක් තියෙන්නේ සාමාන්‍යයෙන් මේ වගේ තැන්වල
        $('a.btnBtn, a[href*="pixeldrain"], a[href*="mega.nz"]').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();
            if (href) {
                dlLinks.push({
                    name: text || "Download Link",
                    link: href
                });
            }
        });

        res.json({ status: true, owner: "DEXTER", dlLinks });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dexter Sinhalasub API Live!`));
