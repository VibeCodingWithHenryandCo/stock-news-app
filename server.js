const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.json());

// API endpoint to search for stock news
app.get('/api/news', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Using a mock response for testing
    // In production, you would integrate with a real news API like NewsAPI, Alpha Vantage, etc.
    const mockNews = [
      {
        title: `${query} Stock Surges 15% on Strong Earnings Report`,
        source: 'Financial Times',
        publishedAt: new Date().toISOString(),
        description: `${query} reported better-than-expected quarterly earnings, sending shares higher in after-hours trading.`,
        url: 'https://example.com/news/1',
        impact: 'high'
      },
      {
        title: `Analysts Upgrade ${query} to Buy Rating`,
        source: 'Bloomberg',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        description: `Multiple analysts have upgraded their rating on ${query} following positive industry trends.`,
        url: 'https://example.com/news/2',
        impact: 'medium'
      },
      {
        title: `${query} Announces New Product Launch`,
        source: 'Reuters',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        description: `${query} unveiled its latest product innovation, aiming to capture market share in Q2.`,
        url: 'https://example.com/news/3',
        impact: 'high'
      },
      {
        title: `Market Watch: ${query} Trading Volume Spikes`,
        source: 'CNBC',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        description: `Unusual trading activity detected in ${query} shares as institutional investors increase positions.`,
        url: 'https://example.com/news/4',
        impact: 'medium'
      }
    ];

    res.json({ success: true, articles: mockNews });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

app.listen(PORT, () => {
  console.log(`Stock News App running on http://localhost:${PORT}`);
});
