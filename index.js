const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

// Search API
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        // URL එක .lk වලට මාරු කළා
        const url = `https://cinesubz.lk/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://cinesubz.lk/',
                'Upgrade-Insecure-Requests': '1'
            }
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // සයිට් එකේ සැබෑ දත්ත තියෙන තැන
        $('a').each((i, el) => {
            const link = $(el).attr('href');
            const title = $(el).text().trim();

            // ලින්ක් එකේ /movies/ තියෙන, නමක් තියෙන ඒවා විතරක් අදිමු
            if (link && link.includes('/movies/') && title.length > 5) {
                // එකම දේ දෙපාරක් එන එක නවත්වන්න
                if (!results.find(r => r.link === link)) {
                    results.push({
                        title: title,
                        link: link
                    });
                }
            }
        });

        // අන්තිම උත්සාහය: කිසිවක් නැත්නම් වෙනත් class එකක් බලමු
        if (results.length === 0) {
            $('.result-item').each((i, el) => {
                const title = $(el).find('.title a').text().trim();
                const link = $(el).find('.title a').attr('href');
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
        res.json({ status: false, error: "Site Blocked or Error: " + e.message });
    }
});
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
