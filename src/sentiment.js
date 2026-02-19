const Sentiment = require('sentiment');
const sentiment = new Sentiment();

/**
 * Analyze sentiment of text
 * @param {string} text - Text to analyze
 * @returns {Object} - { score, comparative, label }
 */
function analyzeSentiment(text) {
  if (!text) {
    return { score: 0, comparative: 0, label: 'neutral' };
  }

  const result = sentiment.analyze(text);
  
  let label = 'neutral';
  if (result.comparative > 0.5) {
    label = 'positive';
  } else if (result.comparative < -0.5) {
    label = 'negative';
  }

  return {
    score: result.score,
    comparative: result.comparative,
    label
  };
}

/**
 * Analyze sentiment of a news article
 * @param {Object} article - Article with title and description
 * @returns {Object} - Sentiment analysis result
 */
function analyzeArticleSentiment(article) {
  const text = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`;
  return analyzeSentiment(text);
}

/**
 * Batch analyze sentiment for multiple articles
 * @param {Array} articles - Array of articles
 * @returns {Array} - Articles with sentiment added
 */
function addSentimentToArticles(articles) {
  return articles.map(article => {
    const sentimentData = analyzeArticleSentiment(article);
    return {
      ...article,
      sentiment: sentimentData.label,
      sentimentScore: sentimentData.comparative
    };
  });
}

module.exports = {
  analyzeSentiment,
  analyzeArticleSentiment,
  addSentimentToArticles
};
