const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ status: false, message: "නමක් දෙන්න." });

        // Sinhalasub වල AJAX සර්ච් එකට කෙලින්ම යමු
        const url = `https://sinhalasub.lk/wp-admin/admin-ajax.php`;
        
        const params = new URLSearchParams();
        params.append('action', 'zt_ajax_search'); // මේක තමයි සයිට් එකේ රහස් ඇක්ෂන් එක
        params.append('keyword', query);

        const response = await axios.post(url, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': 'https://sinhalasub.lk/'
            }
        });

        // AJAX එකෙන් එන්නේ HTML ලිස්ට් එකක්. ඒක පීරමු.
        const $ = cheerio.load(response.data);
        let results = [];

        $('li').each((i, el) => {
            const title = $(el).find('.result-title').text().trim();
            const link = $(el).find('a').attr('href');
            const image = $(el).find('img').attr('src');
            const year = $(el).find('.result-year').text().trim();

            if (link && title) {
                results.push({ title, link, image, year });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dexter API Running...`));
