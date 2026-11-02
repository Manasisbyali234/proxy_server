const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

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

    res.json({ success: true, results, updatedAt: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
