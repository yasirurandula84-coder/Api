const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.get('/', (req, res) => {
    res.send('Dexter Movie API is Live! 🚀');
});

// Search Route: /api/search?q=avatar
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const url = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(url, { 
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' } 
        });
        const $ = cheerio.load(data);
        let results = [];

        // ක්‍රමය 1: Article tags (Cinesubz වල ගොඩක් වෙලාවට මේක වැඩ)
        $('article').each((i, el) => {
            const title = $(el).find('h2 a').text().trim() || $(el).find('.entry-title a').text().trim();
            const link = $(el).find('h2 a').attr('href') || $(el).find('.entry-title a').attr('href');
            const image = $(el).find('img').attr('src');
            if (link && title) results.push({ title, link, image });
        });

        // ක්‍රමය 2: ප්‍රතිඵල නැත්නම් වෙනත් class එකක් බලමු
        if (results.length === 0) {
            $('.result-item').each((i, el) => {
                const title = $(el).find('.title a').text().trim();
                const link = $(el).find('.title a').attr('href');
                if (link && title) results.push({ title, link });
            });
        }

        res.json({ status: true, count: results.length, results });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});
// Download Link Route: /api/getlink?url=https://cinesubz.co/movie/xyz
app.get('/api/getlink', async (req, res) => {
    try {
        const movieUrl = req.query.url;
        const { data } = await axios.get(movieUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        let dlLinks = [];

        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('pixeldrain.com/u/')) {
                dlLinks.push({
                    name: 'Pixeldrain',
                    link: href,
                    direct: href.replace('/u/', '/api/file/')
                });
            }
        });

        res.json({ status: true, dlLinks });
    } catch (e) {
        res.json({ status: false, error: e.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
