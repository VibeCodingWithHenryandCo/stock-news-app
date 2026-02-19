# Stock News App - Enhancement Specification

## Overview
Enhance the stock news web application with production-ready features, security, and performance improvements.

## Project Location
`/data/.openclaw/workspace/stock-news-app/`

## Current State
- Basic Express server with mock data
- Simple frontend with search functionality
- No real API integration
- No security measures
- No performance optimizations

## Features to Implement (Excluding Email Alerts)

### 1. Real News API Integration
- Integrate Finnhub API (free tier)
- Add API key management via environment variables
- Replace mock data with real news

### 2. Stock Price Charts
- Add simple line charts showing stock price trends
- Use Chart.js or lightweight alternative
- Display alongside news articles

### 3. Sentiment Analysis
- Analyze news article sentiment (Positive/Negative/Neutral)
- Display sentiment badges with color coding
- Add filter by sentiment

### 4. Historical News Archive
- Store fetched news in database (SQLite for simplicity)
- Allow users to browse historical news
- Add date range filters

### 5. Multiple Language Support
- Add i18n support (English, Spanish, Chinese)
- Language switcher in UI
- Translate UI elements

### 6. User Authentication & Saved Searches
- Simple JWT-based authentication
- User registration/login
- Save favorite searches
- Bookmark articles

## Security Enhancements

### 1. Rate Limiting
- Implement express-rate-limit
- 100 requests per 15 minutes per IP
- API-specific rate limits

### 2. API Key Management
- Use dotenv for environment variables
- Never expose API keys in frontend
- Proxy all external API calls through backend

### 3. Input Validation
- Validate all user inputs server-side
- Use express-validator
- Sanitize search queries

### 4. CORS Configuration
- Proper CORS setup for production
- Whitelist allowed origins

### 5. Security Headers
- Implement Helmet.js
- Content Security Policy
- X-Frame-Options, X-Content-Type-Options

### 6. HTTPS Enforcement
- Add redirect middleware for production
- Secure cookie flags

## Performance Improvements

### 1. Caching Layer
- Implement node-cache for in-memory caching
- Cache news responses (5-minute TTL)
- Cache stock price data (1-minute TTL)

### 2. Database Integration
- SQLite database for production
- Store user data, saved searches, cached news
- Proper indexing

### 3. Response Compression
- Implement compression middleware
- Gzip/Brotli support

### 4. API Pagination
- Paginate news results (20 per page)
- Infinite scroll or page navigation

### 5. Debounced Search
- Frontend: debounce search input (500ms)
- Reduce unnecessary API calls

### 6. Static Asset Optimization
- Minify CSS/JS for production
- Add caching headers for static files

## Task Delegation

### Backend Agent (Ben - DeepSeek)
- Real news API integration (Finnhub)
- Security enhancements (rate limiting, validation, Helmet)
- Database setup (SQLite)
- Caching implementation
- Authentication system (JWT)
- API pagination

### Frontend Agent (Finn - DeepSeek)
- Stock price charts (Chart.js)
- Sentiment display UI
- Language switcher
- Debounced search
- Infinite scroll/pagination UI
- Login/registration forms

### Data Agent (Rex - DeepSeek)
- Database schema design
- Migration scripts
- Seed data
- Caching strategy implementation

### Testing Agent (Tara - DeepSeek)
- Unit tests for backend endpoints
- Integration tests
- Security tests
- Performance benchmarks

## Implementation Priority

### Phase 1 (High Priority)
1. Real API integration (Finnhub)
2. Security basics (rate limiting, validation, Helmet)
3. Caching layer
4. Database setup

### Phase 2 (Medium Priority)
1. Authentication system
2. Sentiment analysis
3. Stock price charts
4. Response compression

### Phase 3 (Lower Priority)
1. Historical news archive
2. Multiple language support
3. Advanced filtering

## Success Criteria
- ✅ All features implemented except email alerts
- ✅ Security score A+ on security headers
- ✅ API response time < 500ms (cached)
- ✅ Rate limiting functional
- ✅ User authentication working
- ✅ All tests passing
- ✅ Production-ready deployment

## Estimated Timeline
- Backend enhancements: 2-3 hours
- Frontend enhancements: 2-3 hours
- Database & caching: 1-2 hours
- Testing: 1-2 hours
- **Total: 6-10 hours of agent work (can be parallelized)**
