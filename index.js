const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) return res.json({ status: false, message: "සර්ච් කරන්න නමක් දෙන්න." });

        // සරල සර්ච් URL එක
        const url = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}`;
        
        const response = await axios.get(url, {
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
                'referer': 'https://sinhalasub.lk/'
            },
            timeout: 10000 // තත්පර 10ක් ඇතුළත රිසල්ට් එක ආවේ නැත්තම් නවත්තන්න
        });

        const $ = cheerio.load(response.data);
        let results = [];

        // සයිට් එකේ පෝස්ට් එකක් තියෙන ප්‍රධාන Class එක "result-item"
        $('.result-item').each((i, el) => {
            const title = $(el).find('.title a').text().trim() || $(el).find('h3 a').text().trim();
            const link = $(el).find('.title a').attr('href') || $(el).find('h3 a').attr('href');
            const image = $(el).find('.thumbnail img').attr('src') || $(el).find('img').attr('src');
            const rating = $(el).find('.rating').text().trim();

            if (link && title) {
                results.push({
                    title: title,
                    link: link,
                    image: image,
                    rating: rating || "N/A"
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
        // වැරැද්ද මොකක්ද කියලා ලස්සනට පෙන්වන්න
        res.status(500).json({ 
            status: false, 
            error: "Request Error", 
            message: e.message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dexter API: Online`));
