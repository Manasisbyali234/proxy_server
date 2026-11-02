const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());

let cache = { results: [], updatedAt: null };

async function scrape() {
  try {
    const response = await fetch('https://sattamatkajodi.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const html = await response.text();
    const results = [];

    const blockRegex = /<div class="result-(?:row|gold)">([\s\S]*?)<\/div>\s*(?=<div class="result-|<div class="contact|<div class="zone)/g;
    let match;

    while ((match = blockRegex.exec(html)) !== null) {
      const block = match[1];
      const spans = [...block.matchAll(/<span[^>]*>([^<]+)<\/span>/g)];
      const name = spans[0]?.[1]?.trim();
      const result = spans[1]?.[1]?.trim();
      const timeMatch = block.match(/result-time[^>]*>\(([^)]+)\)/);
      const timeText = timeMatch?.[1] || '';
      const [openTime, closeTime] = timeText.split(' - ');

      if (name && result && name.length < 40) {
        results.push({ name, result, openTime: openTime?.trim() || '', closeTime: closeTime?.trim() || '' });
      }
    }

    if (results.length > 0) {
      cache = { results, updatedAt: new Date().toISOString() };
      console.log(`✅ [${new Date().toLocaleTimeString()}] Refreshed — ${results.length} markets`);
    }
  } catch (err) {
    console.error(`❌ Scrape failed: ${err.message}`);
  }
}

// Scrape on startup then every 60 seconds
scrape();
setInterval(scrape, 60 * 1000);

app.get('/results', (req, res) => {
  res.json({ success: true, ...cache });
});

app.listen(4000, () => {
  console.log('✅ Proxy server running at http://localhost:4000');
  console.log('🔄 Auto-refreshing every 60 seconds');
});
