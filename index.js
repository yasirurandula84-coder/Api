const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const url = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
        
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
        });

        const $ = cheerio.load(data);
        let results = [];

        // සයිට් එකේ හැම result එකක්ම අහුවෙන්නේ 'result-item' කියන class එකෙන්
        $('.result-item').each((i, el) => {
            const title = $(el).find('.title a').text().trim();
            const link = $(el).find('.title a').attr('href');
            const image = $(el).find('img').attr('src');
            const year = $(el).find('.year').text().trim();
            const rating = $(el).find('.rating').text().trim();

            if (link && title) {
                results.push({
                    title: title,
                    link: link,
                    image: image,
                    year: year,
                    rating: rating
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

// Download Link API
app.get('/api/getlink', async (req, res) => {
    try {
        const movieUrl = req.query.url;
        const { data } = await axios.get(movieUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let dlLinks = [];

        // Pixeldrain ලින්ක් එක සොයාගැනීම
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('pixeldrain.com/u/')) {
                dlLinks.push({
                    name: "Pixeldrain",
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
app.listen(PORT, () => console.log(`Dexter API is running on ${PORT}`));
