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
        // සයිට් එකේ AJAX සර්ච් එකට කෙලින්ම කතා කරමු
        const url = `https://cinesubz.lk/wp-admin/admin-ajax.php`;
        
        const params = new URLSearchParams();
        params.append('action', 'z_ajax_search'); // Zetaflix theme එකේ සර්ච් ඇක්ෂන් එක
        params.append('keyword', query);

        const response = await axios.post(url, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://cinesubz.lk/'
            }
        });

        // AJAX එකෙන් එන්නේ HTML කෑල්ලක්. ඒක පීරමු.
        const $ = cheerio.load(response.data);
        let results = [];

        $('li').each((i, el) => {
            const title = $(el).find('.result-title').text().trim() || $(el).text().trim();
            const link = $(el).find('a').attr('href');
            const img = $(el).find('img').attr('src');

            if (link && link.includes('/movies/')) {
                results.push({ title, link, img });
            }
        });

        // ඒක වැඩ නැත්නම් පරණ ක්‍රමයත් නිකමට රන් කරමු
        if (results.length === 0) {
             const oldRes = await axios.get(`https://cinesubz.lk/?s=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
             const $old = cheerio.load(oldRes.data);
             $old('a').each((i, el) => {
                 const l = $old(el).attr('href');
                 const t = $old(el).text().trim();
                 if (l && l.includes('/movies/') && t.length > 10) results.push({ title: t, link: l });
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
