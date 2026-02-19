require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const { body, query, validationResult } = require('express-validator');
const NodeCache = require('node-cache');

const { initDatabase, userQueries, savedSearchQueries, bookmarkQueries, cacheQueries } = require('./src/database');
const { hashPassword, verifyPassword, generateToken, authMiddleware, optionalAuthMiddleware } = require('./src/auth');
const { addSentimentToArticles } = require('./src/sentiment');

const app = express();
const PORT = process.env.PORT || 3000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const CACHE_TTL = parseInt(process.env.CACHE_TTL_SECONDS) || 300;

// Database is auto-initialized when the module loads (see src/database.js)
// No need to call initDatabase() here

// In-memory cache for API responses
const apiCache = new NodeCache({ stdTTL: CACHE_TTL });

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts, please try again later' }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many API requests, please slow down' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// Serve static files with caching
app.use(express.static('public', {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
  etag: true
}));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch news from Finnhub API
 */
async function fetchNewsFromFinnhub(symbol = null, category = 'general') {
  try {
    let url;
    const config = {
      headers: { 'X-Finnhub-Token': FINNHUB_API_KEY }
    };

    if (symbol) {
      // Company-specific news
      const toDate = new Date();
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - 7);
      
      url = `https://finnhub.io/api/v1/company-news`;
      config.params = {
        symbol: symbol.toUpperCase(),
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0]
      };
    } else {
      // General market news
      url = `https://finnhub.io/api/v1/news`;
      config.params = { category };
    }

    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error('Finnhub API error:', error.message);
    throw error;
  }
}

/**
 * Fetch stock quote from Finnhub
 */
async function fetchStockQuote(symbol) {
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol: symbol.toUpperCase() },
      headers: { 'X-Finnhub-Token': FINNHUB_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error('Stock quote error:', error.message);
    throw error;
  }
}

/**
 * Transform Finnhub news to our format
 */
function transformFinnhubNews(articles) {
  return articles.map(article => ({
    title: article.headline,
    source: article.source,
    publishedAt: new Date(article.datetime * 1000).toISOString(),
    description: article.summary || article.headline,
    url: article.url,
    image: article.image,
    category: article.category
  }));
}

/**
 * Determine impact level based on sentiment and recency
 */
function calculateImpact(article) {
  const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
  const sentimentScore = Math.abs(article.sentimentScore || 0);
  
  if (hoursAgo < 2 && sentimentScore > 0.3) return 'high';
  if (hoursAgo < 12 && sentimentScore > 0.1) return 'medium';
  return 'low';
}

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

/**
 * Register new user
 */
app.post('/api/auth/register',
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('email').trim().isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, email, password } = req.body;

      // Check if user exists
      const existingUser = userQueries.findByEmail.get(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const existingUsername = userQueries.findByUsername.get(username);
      if (existingUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const result = userQueries.create.run(username, email, passwordHash);
      
      const token = generateToken(result.lastInsertRowid, username, email);

      res.status(201).json({
        success: true,
        token,
        user: { id: result.lastInsertRowid, username, email }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

/**
 * Login user
 */
app.post('/api/auth/login',
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = userQueries.findByEmail.get(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await verifyPassword(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateToken(user.id, user.username, user.email);

      res.json({
        success: true,
        token,
        user: { id: user.id, username: user.username, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

/**
 * Get current user
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = userQueries.findById.get(req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true, user });
});

// ============================================================================
// NEWS ENDPOINTS
// ============================================================================

/**
 * Search for stock news
 */
app.get('/api/news',
  apiLimiter,
  query('query').optional().trim().isLength({ min: 1, max: 10 }),
  query('category').optional().isIn(['general', 'forex', 'crypto', 'merger']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  optionalAuthMiddleware,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { query: searchQuery, category = 'general', page = 1, limit = 20 } = req.query;
      const cacheKey = `news:${searchQuery || category}:${page}:${limit}`;

      // Check in-memory cache first
      let articles = apiCache.get(cacheKey);
      
      if (!articles) {
        // Check database cache
        const dbCache = cacheQueries.get.get(cacheKey);
        
        if (dbCache) {
          articles = JSON.parse(dbCache.response_data);
          apiCache.set(cacheKey, articles);
        } else {
          // Fetch from API
          if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'your_finnhub_api_key_here') {
            // Use mock data if no API key
            articles = generateMockNews(searchQuery || 'Market');
          } else {
            const rawArticles = await fetchNewsFromFinnhub(searchQuery, category);
            articles = transformFinnhubNews(rawArticles);
            
            // Add sentiment analysis
            articles = addSentimentToArticles(articles);
            
            // Add impact levels
            articles = articles.map(article => ({
              ...article,
              impact: calculateImpact(article)
            }));
          }

          // Cache in database
          try {
            cacheQueries.set.run(
              cacheKey,
              JSON.stringify(articles),
              articles[0]?.sentiment || 'neutral',
              CACHE_TTL
            );
          } catch (dbError) {
            console.error('Database cache error:', dbError);
          }

          // Cache in memory
          apiCache.set(cacheKey, articles);
        }
      }

      // Pagination
      const startIndex = (page - 1) * limit;
      const paginatedArticles = articles.slice(startIndex, startIndex + limit);

      res.json({
        success: true,
        articles: paginatedArticles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: articles.length,
          hasMore: startIndex + limit < articles.length
        }
      });
    } catch (error) {
      console.error('News fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch news' });
    }
  }
);

/**
 * Get stock quote
 */
app.get('/api/stock/:symbol',
  apiLimiter,
  async (req, res) => {
    try {
      const { symbol } = req.params;
      const cacheKey = `stock:${symbol}`;

      let quote = apiCache.get(cacheKey);

      if (!quote) {
        if (!FINNHUB_API_KEY || FINNHUB_API_KEY === 'your_finnhub_api_key_here') {
          quote = generateMockQuote(symbol);
        } else {
          quote = await fetchStockQuote(symbol);
        }
        
        // Cache for 1 minute
        apiCache.set(cacheKey, quote, 60);
      }

      res.json({ success: true, quote });
    } catch (error) {
      console.error('Stock quote error:', error);
      res.status(500).json({ error: 'Failed to fetch stock quote' });
    }
  }
);

// ============================================================================
// USER DATA ENDPOINTS
// ============================================================================

/**
 * Get saved searches
 */
app.get('/api/user/searches', authMiddleware, (req, res) => {
  try {
    const searches = savedSearchQueries.getByUser.all(req.user.userId);
    res.json({ success: true, searches });
  } catch (error) {
    console.error('Get searches error:', error);
    res.status(500).json({ error: 'Failed to get searches' });
  }
});

/**
 * Save a search
 */
app.post('/api/user/searches',
  authMiddleware,
  body('query').trim().isLength({ min: 1, max: 100 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { query } = req.body;
      const result = savedSearchQueries.create.run(req.user.userId, query);
      res.status(201).json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error('Save search error:', error);
      res.status(500).json({ error: 'Failed to save search' });
    }
  }
);

/**
 * Delete a saved search
 */
app.delete('/api/user/searches/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    savedSearchQueries.delete.run(id, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ error: 'Failed to delete search' });
  }
});

/**
 * Get bookmarks
 */
app.get('/api/user/bookmarks', authMiddleware, (req, res) => {
  try {
    const bookmarks = bookmarkQueries.getByUser.all(req.user.userId);
    res.json({ success: true, bookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get bookmarks' });
  }
});

/**
 * Add bookmark
 */
app.post('/api/user/bookmarks',
  authMiddleware,
  body('articleUrl').trim().isURL(),
  body('articleTitle').trim().notEmpty(),
  body('articleSource').optional().trim(),
  body('articlePublishedAt').optional().isISO8601(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { articleUrl, articleTitle, articleSource, articlePublishedAt } = req.body;
      
      // Check if already bookmarked
      const existing = bookmarkQueries.checkExists.get(req.user.userId, articleUrl);
      if (existing) {
        return res.status(409).json({ error: 'Article already bookmarked' });
      }

      const result = bookmarkQueries.create.run(
        req.user.userId,
        articleUrl,
        articleTitle,
        articleSource || null,
        articlePublishedAt || null
      );
      
      res.status(201).json({ success: true, id: result.lastInsertRowid });
    } catch (error) {
      console.error('Add bookmark error:', error);
      res.status(500).json({ error: 'Failed to add bookmark' });
    }
  }
);

/**
 * Delete bookmark
 */
app.delete('/api/user/bookmarks/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    bookmarkQueries.delete.run(id, req.user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bookmark error:', error);
    res.status(500).json({ error: 'Failed to delete bookmark' });
  }
});

// ============================================================================
// MOCK DATA GENERATORS (fallback when no API key)
// ============================================================================

function generateMockNews(query) {
  const sources = ['Financial Times', 'Bloomberg', 'Reuters', 'CNBC', 'Wall Street Journal'];
  const impacts = ['high', 'medium', 'low'];
  const sentiments = ['positive', 'negative', 'neutral'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    title: `${query} ${['Surges', 'Drops', 'Holds Steady', 'Rises', 'Falls'][i % 5]} ${Math.floor(Math.random() * 20)}% on Market News`,
    source: sources[i % sources.length],
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    description: `${query} experienced significant movement in today's trading session following recent developments in the market.`,
    url: `https://example.com/news/${i}`,
    impact: impacts[i % 3],
    sentiment: sentiments[i % 3],
    sentimentScore: (Math.random() - 0.5) * 2
  }));
}

function generateMockQuote(symbol) {
  const basePrice = 100 + Math.random() * 400;
  return {
    c: basePrice,
    h: basePrice * 1.05,
    l: basePrice * 0.95,
    o: basePrice * 0.98,
    pc: basePrice * 0.97,
    t: Date.now()
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   📈 Stock News App (Enhanced)            ║
║                                            ║
║   Server: http://localhost:${PORT}         ║
║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
║   API Key: ${FINNHUB_API_KEY ? '✓ Configured' : '✗ Not set (using mock)'}          ║
║                                            ║
║   Features Enabled:                        ║
║   ✓ Real API Integration                   ║
║   ✓ Sentiment Analysis                     ║
║   ✓ User Authentication                    ║
║   ✓ Saved Searches & Bookmarks             ║
║   ✓ Rate Limiting                          ║
║   ✓ Caching (Memory + Database)            ║
║   ✓ Security Headers                       ║
║   ✓ Response Compression                   ║
╚════════════════════════════════════════════╝
  `);
});

module.exports = app;
