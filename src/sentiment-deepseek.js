const axios = require('axios');

/**
 * Analyze sentiment using DeepSeek AI model
 * @param {string} text - Text to analyze
 * @returns {Promise<Object>} - { score, comparative, label, reasoning }
 */
async function analyzeSentimentWithDeepSeek(text) {
  if (!text) {
    return { score: 0, comparative: 0, label: 'neutral', reasoning: 'No text provided' };
  }

  try {
    // Use OpenRouter API with DeepSeek model
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a financial sentiment analyzer. Analyze the sentiment of news headlines and summaries. Respond with ONLY a JSON object in this exact format: {"label": "positive|neutral|negative", "score": <number between -1 and 1>, "reasoning": "<brief explanation>"}. Do not include any other text.'
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this stock market news:\n\n${text}\n\nRespond with JSON only.`
          }
        ],
        temperature: 0.3,
        max_tokens: 150
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY || ''}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Stock News Sentiment Analyzer'
        },
        timeout: 10000
      }
    );

    const content = response.data.choices[0].message.content.trim();
    
    // Parse JSON response
    let result;
    try {
      // Try to extract JSON if there's extra text
      const jsonMatch = content.match(/\{[^}]+\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', content);
      throw new Error('Invalid JSON response from DeepSeek');
    }

    // Normalize the result
    const label = result.label.toLowerCase();
    const score = parseFloat(result.score) || 0;
    
    return {
      score: Math.round(score * 100), // Convert to -100 to 100 scale
      comparative: score,
      label,
      reasoning: result.reasoning || 'Analysis complete',
      model: 'deepseek-chat'
    };

  } catch (error) {
    console.error('DeepSeek sentiment analysis error:', error.message);
    
    // Fallback to basic sentiment analysis
    const Sentiment = require('sentiment');
    const sentiment = new Sentiment();
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
      label,
      reasoning: 'Fallback to basic sentiment (DeepSeek unavailable)',
      model: 'fallback'
    };
  }
}

/**
 * Analyze sentiment of a news article using DeepSeek
 * @param {Object} article - Article with title and description
 * @returns {Promise<Object>} - Sentiment analysis result
 */
async function analyzeArticleSentimentWithDeepSeek(article) {
  const text = `${article.headline || article.title || ''} ${article.summary || article.description || ''}`;
  return await analyzeSentimentWithDeepSeek(text);
}

/**
 * Batch analyze sentiment for multiple articles using DeepSeek
 * @param {Array} articles - Array of articles
 * @returns {Promise<Array>} - Articles with sentiment added
 */
async function addSentimentToArticlesWithDeepSeek(articles) {
  const results = await Promise.all(
    articles.map(async (article) => {
      const sentimentData = await analyzeArticleSentimentWithDeepSeek(article);
      return {
        ...article,
        sentiment: sentimentData.label,
        sentimentScore: sentimentData.comparative,
        sentimentReasoning: sentimentData.reasoning,
        sentimentModel: sentimentData.model
      };
    })
  );
  
  return results;
}

module.exports = {
  analyzeSentimentWithDeepSeek,
  analyzeArticleSentimentWithDeepSeek,
  addSentimentToArticlesWithDeepSeek
};
