const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Home Route
app.get('/', (req, res) => {
    res.json({ 
        status: true, 
        message: "Dexter Movie API is Live! 🚀", 
        owner: "DEXTER OWNER" 
    });
});

// --- Search API ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ status: false, message: "Please provide a search query (?q=movie_name)" });

        // නවතම URL එක: cinesubz.lk
        const url = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://cinesubz.lk/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // ක්‍රමය 1: සයිට් එකේ ලින්ක් පීරලා දත්ත ගැනීම (Universal Method)
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim();

            if (link && link.includes('/movies/') && title.length > 5) {
                if (!results.find(r => r.link === link)) {
                    results.push({
                        title: title,
                        link: link
                    });
                }
            }
        });

        // ක්‍රමය 2: කිසිවක් හමු නොවූයේ නම් Zetaflix Classes බලමු
        if (results.length === 0) {
            $('.result-item').each((i, el) => {
                const title = $(el).find('.title a').text().trim();
                const link = $(el).find('.title a').attr('href');
                const image = $(el).find('img').attr('src');
                if (link && title) results.push({ title, link, image });
            });
        }

        res.json({ 
            status: true, 
            owner: "DEXTER", 
            count: results.length, 
            results 
        });

    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
});

// --- Download Link API ---
app.get('/api/getlink', async (req, res) => {
    try {
        const movieUrl = req.query.url;
        if (!movieUrl) return res.json({ status: false, message: "Please provide a movie url (?url=link)" });

        const { data } = await axios.get(movieUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        let dlLinks = [];

        // Pixeldrain සහ අනෙකුත් ලින්ක් සොයාගැනීම
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.includes('pixeldrain.com/u/')) {
                    dlLinks.push({
                        host: "Pixeldrain",
                        link: href,
                        direct: href.replace('/u/', '/api/file/')
                    });
                } else if (href.includes('gdtot') || href.includes('drive.google')) {
                    dlLinks.push({
                        host: "Google Drive / GDTot",
                        link: href
                    });
                }
            }
        });

        res.json({ status: true, owner: "DEXTER", dlLinks });
    } catch (e) {
        res.status(500).json({ status: false, error: e.message });
    }
});

// Server Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 DEXTER MOVIE API IS RUNNING!`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`=========================================`);
});
