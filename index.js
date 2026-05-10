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
        const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(data);
        let results = [];

        $('article').each((i, el) => {
            results.push({
                title: $(el).find('h2 a').text().trim(),
                link: $(el).find('h2 a').attr('href'),
                image: $(el).find('img').attr('src')
            });
        });

        res.json({ status: true, results });
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
