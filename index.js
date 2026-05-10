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
        // සර්ච් එකට සරලම URL එක
        const url = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Referer': 'https://cinesubz.lk/'
            },
            timeout: 10000 // තත්පර 10කින් ලෝඩ් වුණේ නැත්නම් නවත්වන්න
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // සයිට් එකේ 'result-item' හෝ ඕනෑම 'a' ලින්ක් එකක් පරීක්ෂා කිරීම
        $('.result-item').each((i, el) => {
            const title = $(el).find('.title a').text().trim();
            const link = $(el).find('.title a').attr('href');
            const image = $(el).find('img').attr('src');
            if (link && title) results.push({ title, link, image });
        });

        // ලින්ක් එකේ /movies/ තියෙන ඒවා සයිට් එකේ ඕනෑම තැනකින් අහුකරගමු
        if (results.length === 0) {
            $('a').each((i, el) => {
                const link = $(el).attr('href');
                const title = $(el).text().trim();
                if (link && link.includes('/movies/') && title.length > 5) {
                    if (!results.find(r => r.link === link)) {
                        results.push({ title, link });
                    }
                }
            });
        }

        res.json({ 
            status: true, 
            owner: "DEXTER", 
            count: results.length, 
            results 
        });

    } catch (e) {
        // මෙතනදී Error එක 400 ද 403 ද කියලා හරියටම බලාගමු
        res.json({ 
            status: false, 
            message: "සයිට් එකෙන් අපිව බ්ලොක් කරලා වගෙයි.",
            error_code: e.response ? e.response.status : e.message 
        });
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
