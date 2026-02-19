# 📈 Stock News Search App - Enhanced Edition

A comprehensive, production-ready web application for searching and tracking the newest and most impactful stock market news.

## ✨ Features

### Core Features
- 🔍 **Real-time Stock News Search** - Search for news by stock symbol or company name
- 📊 **Stock Price Charts** - Interactive charts showing stock price trends
- 🎭 **Sentiment Analysis** - AI-powered sentiment analysis (Positive/Neutral/Negative)
- 📈 **Impact Ratings** - News categorized by impact level (High/Medium/Low)
- ⏰ **Time-stamped Articles** - See how recent each article is

### User Features
- 🔐 **User Authentication** - Secure JWT-based authentication
- 💾 **Saved Searches** - Save your favorite stock searches
- 🔖 **Bookmarks** - Bookmark important articles for later
- 🌐 **Multi-language Support** - Available in English, Spanish, and Chinese
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### Performance & Security
- ⚡ **Intelligent Caching** - In-memory and database caching for fast responses
- 🛡️ **Rate Limiting** - Protection against abuse
- 🔒 **Security Headers** - Helmet.js for enhanced security
- ✅ **Input Validation** - Server-side validation of all inputs
- 🗜️ **Response Compression** - Gzip compression for faster loading

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-news-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Finnhub API key:
   ```
   FINNHUB_API_KEY=your_api_key_here
   ```
   
   Get a free API key from: https://finnhub.io/register

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📖 Usage Guide

### Searching for News
1. Enter a stock symbol (e.g., `AAPL`, `TSLA`) or company name in the search box
2. Click "Search" or press Enter
3. View real-time news articles with sentiment analysis and impact ratings
4. See an interactive price chart for the stock

### User Account Features

#### Creating an Account
1. Click "Login" in the top-right corner
2. Switch to the "Register" tab
3. Fill in your username, email, and password
4. Click "Register"

#### Saving Searches
1. Log in to your account
2. Perform a search
3. Click the 💾 icon next to the search button
4. Access your saved searches via the 💾 button in the header

#### Bookmarking Articles
1. Log in to your account
2. Search for news
3. Click "Bookmark" on any article
4. Access your bookmarks via the 🔖 button in the header

### Filtering Results
- **Sentiment Filter**: Show only Positive, Neutral, or Negative news
- **Impact Filter**: Filter by High, Medium, or Low impact

### Changing Language
- Use the language dropdown in the top-right corner
- Available languages: English, Español, 中文

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- HTML5, CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+)
- Chart.js for stock price visualization

**Backend:**
- Node.js with Express
- Better-SQLite3 for database
- JWT for authentication
- Finnhub API for real-time stock data

**Security & Performance:**
- Helmet.js for security headers
- express-rate-limit for rate limiting
- node-cache for in-memory caching
- compression for response compression
- bcryptjs for password hashing

### Project Structure
```
stock-news-app/
├── public/              # Frontend files
│   ├── index.html      # Main HTML file
│   ├── app.js          # Frontend JavaScript
│   └── style.css       # Styles
├── src/                # Backend modules
│   ├── auth.js         # Authentication logic
│   ├── database.js     # Database operations
│   └── sentiment.js    # Sentiment analysis
├── data/               # SQLite database (auto-created)
├── server.js           # Main server file
├── package.json        # Dependencies
├── .env.example        # Environment variables template
└── README.md           # Documentation
```

## 🔌 API Endpoints

### Authentication

#### `POST /api/auth/register`
Register a new user.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### `POST /api/auth/login`
Login to an existing account.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### `GET /api/auth/me`
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

### News

#### `GET /api/news`
Search for stock news.

**Query Parameters:**
- `query` (required): Stock symbol or company name
- `category` (optional): `general`, `forex`, `crypto`, `merger`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 50)

**Example:**
```
GET /api/news?query=AAPL&page=1&limit=20
```

#### `GET /api/stock/:symbol`
Get stock quote for a symbol.

**Example:**
```
GET /api/stock/AAPL
```

### User Data (Requires Authentication)

#### `GET /api/user/searches`
Get saved searches.

#### `POST /api/user/searches`
Save a new search.

**Body:**
```json
{
  "query": "AAPL"
}
```

#### `DELETE /api/user/searches/:id`
Delete a saved search.

#### `GET /api/user/bookmarks`
Get bookmarked articles.

#### `POST /api/user/bookmarks`
Bookmark an article.

**Body:**
```json
{
  "articleUrl": "https://example.com/article",
  "articleTitle": "Article Title",
  "articleSource": "Source Name",
  "articlePublishedAt": "2024-01-01T00:00:00Z"
}
```

#### `DELETE /api/user/bookmarks/:id`
Delete a bookmark.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (`development` or `production`) | `development` |
| `FINNHUB_API_KEY` | Finnhub API key | Required |
| `JWT_SECRET` | JWT signing secret | Change in production |
| `DB_PATH` | SQLite database path | `./data/stocknews.db` |
| `CACHE_TTL_SECONDS` | Cache TTL in seconds | `300` (5 minutes) |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 minutes) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### Finnhub API Limits

The free tier of Finnhub API includes:
- 60 API calls/minute
- Company news (up to 1 year)
- Market news
- Stock quotes

For higher limits, consider upgrading to a paid plan.

## 🔒 Security Features

1. **Helmet.js** - Sets security-related HTTP headers
2. **Rate Limiting** - Prevents abuse and DoS attacks
3. **Input Validation** - All inputs validated with express-validator
4. **JWT Authentication** - Secure token-based authentication
5. **Password Hashing** - bcrypt with salt rounds
6. **CORS Protection** - Configurable allowed origins
7. **SQL Injection Protection** - Parameterized queries with better-sqlite3
8. **XSS Protection** - HTML escaping in frontend

## 🎨 Customization

### Theming
CSS variables are used for easy theming. Edit `public/style.css`:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... more variables */
}
```

### Adding Languages
Add translations to the `translations` object in `public/app.js`:

```javascript
const translations = {
    en: { /* English translations */ },
    es: { /* Spanish translations */ },
    fr: { /* Add French */ }
};
```

## 📊 Performance Optimization

### Caching Strategy
- **In-memory cache**: Fast access for frequently requested data (node-cache)
- **Database cache**: Persistent cache for API responses (SQLite)
- **Cache TTL**: 5 minutes for news, 1 minute for stock quotes

### Database Indexing
Indexes are created on frequently queried columns:
- `users.email`
- `saved_searches.user_id`
- `bookmarked_articles.user_id`
- `news_cache.query, expires_at`

### Response Compression
All responses are compressed with gzip/brotli for faster transfer.

### Debounced Search
Search input is debounced (500ms) to reduce unnecessary API calls.

## 🧪 Testing

### Manual Testing
1. Start the server: `npm start`
2. Open browser to `http://localhost:3000`
3. Test each feature:
   - Search functionality
   - User registration/login
   - Saving searches
   - Bookmarking articles
   - Language switching
   - Chart display

### API Testing with cURL

```bash
# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Search news
curl "http://localhost:3000/api/news?query=AAPL"

# Get stock quote
curl "http://localhost:3000/api/stock/AAPL"
```

## 🚀 Deployment

### Using the Deploy Script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual Deployment

1. **Set environment to production**
   ```bash
   export NODE_ENV=production
   ```

2. **Set strong JWT secret**
   ```bash
   export JWT_SECRET=$(openssl rand -base64 32)
   ```

3. **Configure Finnhub API key**
   ```bash
   export FINNHUB_API_KEY=your_production_api_key
   ```

4. **Start with PM2** (recommended)
   ```bash
   npm install -g pm2
   pm2 start server.js --name stock-news-app
   pm2 startup
   pm2 save
   ```

### Using Docker (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t stock-news-app .
docker run -p 3000:3000 --env-file .env stock-news-app
```

## 🐛 Troubleshooting

### Common Issues

**"API key not set" message:**
- Make sure you've added `FINNHUB_API_KEY` to your `.env` file
- Restart the server after adding the key

**Rate limit errors:**
- Wait 15 minutes for the rate limit to reset
- Or increase `RATE_LIMIT_MAX_REQUESTS` in `.env`

**Database locked errors:**
- Close other connections to the database
- Restart the server

**Chart not displaying:**
- Check browser console for errors
- Ensure Chart.js CDN is accessible
- Check if stock quote API returned valid data

## 📝 License

MIT License - Feel free to use this for learning and commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Follow existing code style
2. Add comments for complex logic
3. Test thoroughly before submitting
4. Update README if adding new features

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Check the Troubleshooting section
- Review Finnhub API documentation: https://finnhub.io/docs/api

## 🎯 Roadmap

Potential future enhancements:
- [ ] Email alerts for price changes
- [ ] Portfolio tracking
- [ ] More chart types (candlestick, volume)
- [ ] Export bookmarks to PDF
- [ ] Social sharing features
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Historical news archive with date range filters
- [ ] Advanced filtering (by source, keyword, etc.)
- [ ] News aggregation from multiple sources

## 🙏 Acknowledgments

- **Finnhub** for the financial data API
- **Chart.js** for the charting library
- **Sentiment** npm package for sentiment analysis
- All open-source contributors

---

**Built with ❤️ for stock market enthusiasts**
