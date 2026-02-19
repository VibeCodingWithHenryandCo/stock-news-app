# 📈 Stock News Search App

A simple web application to search for the newest and most impactful stock news.

## Features

- 🔍 Real-time stock news search
- 📊 Impact level indicators (High, Medium, Low)
- ⏰ Time-stamped news articles
- 📱 Responsive design for mobile and desktop
- 🎨 Modern, clean user interface

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **HTTP Client**: Axios

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stock-news-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Enter a stock symbol (e.g., AAPL, TSLA) or company name in the search box
2. Click "Search" or press Enter
3. View the latest news articles with impact ratings
4. Click on any article to read more

## API Endpoints

### GET /api/news

Search for stock news.

**Query Parameters:**
- `query` (required): Stock symbol or company name

**Response:**
```json
{
  "success": true,
  "articles": [
    {
      "title": "Article title",
      "source": "News source",
      "publishedAt": "ISO 8601 date",
      "description": "Article description",
      "url": "Article URL",
      "impact": "high|medium|low"
    }
  ]
}
```

## Development Notes

This is a test/demo application. The current implementation uses mock data for testing purposes.

### Future Enhancements

To make this production-ready, you would need to:

1. **Integrate a Real News API**:
   - [NewsAPI](https://newsapi.org/) - General news API
   - [Alpha Vantage](https://www.alphavantage.co/) - Financial data and news
   - [Finnhub](https://finnhub.io/) - Stock market data and news
   - [Polygon.io](https://polygon.io/) - Real-time and historical market data

2. **Add Features**:
   - Stock price charts
   - Sentiment analysis
   - Email alerts for specific stocks
   - Historical news archive
   - Multiple language support

3. **Security Enhancements**:
   - Rate limiting
   - API key management
   - Input validation
   - CORS configuration

4. **Performance**:
   - Caching layer (Redis)
   - Database for storing news (MongoDB/PostgreSQL)
   - CDN for static assets

## License

MIT License - Feel free to use this for learning and testing purposes.

## Author

Created as a demonstration project for stock news aggregation.
