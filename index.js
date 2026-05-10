const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const url = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // ක්‍රමය 1: Zetaflix Search Results (ඔයා එවපු කෝඩ් එකේ තිබුණ විදිහ)
        $('.result-item').each((i, el) => {
            const title = $(el).find('.title a').text().trim();
            const link = $(el).find('.title a').attr('href');
            const image = $(el).find('img').attr('src');
            if (link && title) results.push({ title, link, image });
        });

        // ක්‍රමය 2: කිසිම රිසල්ට් එකක් නැත්නම් සයිට් එකේ තියෙන ඕනෑම ෆිල්ම් ලින්ක් එකක් අහුකරගන්න
        if (results.length === 0) {
            $('a').each((i, el) => {
                const link = $(el).attr('href');
                const title = $(el).text().trim();
                // ලින්ක් එකේ 'movies' කෑල්ල තියෙන, වචන 3කට වඩා වැඩි නමක් තියෙන ලින්ක් විතරක් ගමු
                if (link && link.includes('/movies/') && title.split(' ').length > 2) {
                    if (!results.find(r => r.link === link)) {
                        results.push({ title, link });
                    }
                }
            });
        }

        // ක්‍රමය 3: Article Tag (පරණ විදිහ)
        if (results.length === 0) {
            $('article').each((i, el) => {
                const title = $(el).find('h2 a').text().trim() || $(el).find('h3 a').text().trim();
                const link = $(el).find('a').attr('href');
                if (link && title) results.push({ title, link });
            });
        }

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
