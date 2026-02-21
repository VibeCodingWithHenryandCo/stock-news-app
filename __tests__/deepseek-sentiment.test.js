/**
 * DeepSeek Sentiment Analysis Tests
 */

const {
  analyzeSentimentWithDeepSeek,
  analyzeArticleSentimentWithDeepSeek,
  addSentimentToArticlesWithDeepSeek
} = require('../src/sentiment-deepseek');

describe('DeepSeek Sentiment Analysis', () => {
  
  describe('analyzeSentimentWithDeepSeek', () => {
    
    it('should analyze positive sentiment', async () => {
      const text = 'Apple stock surges to record high on strong earnings report';
      const result = await analyzeSentimentWithDeepSeek(text);
      
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('comparative');
      expect(result).toHaveProperty('reasoning');
      expect(['positive', 'neutral', 'negative']).toContain(result.label);
      expect(typeof result.score).toBe('number');
      expect(typeof result.comparative).toBe('number');
    }, 15000);

    it('should analyze negative sentiment', async () => {
      const text = 'Tesla shares plummet after disappointing quarterly results';
      const result = await analyzeSentimentWithDeepSeek(text);
      
      expect(result).toHaveProperty('label');
      expect(['positive', 'neutral', 'negative']).toContain(result.label);
      expect(typeof result.score).toBe('number');
    }, 15000);

    it('should handle neutral sentiment', async () => {
      const text = 'Microsoft announces quarterly earnings release date';
      const result = await analyzeSentimentWithDeepSeek(text);
      
      expect(result).toHaveProperty('label');
      expect(['positive', 'neutral', 'negative']).toContain(result.label);
    }, 15000);

    it('should handle empty text with fallback', async () => {
      const result = await analyzeSentimentWithDeepSeek('');
      
      expect(result).toHaveProperty('label');
      expect(result.label).toBe('neutral');
      expect(result.score).toBe(0);
    });

    it('should include model information', async () => {
      const text = 'Stock market shows mixed results today';
      const result = await analyzeSentimentWithDeepSeek(text);
      
      expect(result).toHaveProperty('model');
      expect(['deepseek-chat', 'fallback']).toContain(result.model);
    }, 15000);
  });

  describe('analyzeArticleSentimentWithDeepSeek', () => {
    
    it('should analyze article with headline and summary', async () => {
      const article = {
        headline: 'Tech stocks rally on positive outlook',
        summary: 'Major technology companies see gains as investors remain optimistic about future growth'
      };
      
      const result = await analyzeArticleSentimentWithDeepSeek(article);
      
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('reasoning');
      expect(['positive', 'neutral', 'negative']).toContain(result.label);
    }, 15000);

    it('should handle article with only title', async () => {
      const article = {
        title: 'Breaking news in financial markets'
      };
      
      const result = await analyzeArticleSentimentWithDeepSeek(article);
      
      expect(result).toHaveProperty('label');
      expect(['positive', 'neutral', 'negative']).toContain(result.label);
    }, 15000);
  });

  describe('addSentimentToArticlesWithDeepSeek', () => {
    
    it('should add sentiment to multiple articles', async () => {
      const articles = [
        {
          headline: 'Amazon reports record revenue',
          summary: 'E-commerce giant exceeds expectations'
        },
        {
          headline: 'Oil prices decline amid oversupply concerns',
          summary: 'Energy sector faces challenges'
        }
      ];
      
      const results = await addSentimentToArticlesWithDeepSeek(articles);
      
      expect(results).toHaveLength(2);
      
      results.forEach(article => {
        expect(article).toHaveProperty('sentiment');
        expect(article).toHaveProperty('sentimentScore');
        expect(article).toHaveProperty('sentimentReasoning');
        expect(article).toHaveProperty('sentimentModel');
        expect(['positive', 'neutral', 'negative']).toContain(article.sentiment);
      });
    }, 30000);

    it('should handle empty articles array', async () => {
      const results = await addSentimentToArticlesWithDeepSeek([]);
      
      expect(results).toHaveLength(0);
    });

    it('should preserve original article properties', async () => {
      const articles = [
        {
          id: 123,
          headline: 'Test article',
          summary: 'Test summary',
          source: 'Test Source'
        }
      ];
      
      const results = await addSentimentToArticlesWithDeepSeek(articles);
      
      expect(results[0]).toHaveProperty('id', 123);
      expect(results[0]).toHaveProperty('headline', 'Test article');
      expect(results[0]).toHaveProperty('source', 'Test Source');
    }, 15000);
  });

  describe('Error Handling and Fallback', () => {
    
    it('should fall back to basic sentiment on API error', async () => {
      // Save original env
      const originalKey = process.env.OPENROUTER_API_KEY;
      
      // Set invalid key to force error
      process.env.OPENROUTER_API_KEY = 'invalid-key';
      
      const text = 'Stock market shows mixed results';
      const result = await analyzeSentimentWithDeepSeek(text);
      
      // Should still return valid result with fallback
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('model');
      expect(result.model).toBe('fallback');
      
      // Restore original key
      process.env.OPENROUTER_API_KEY = originalKey;
    }, 15000);
  });

  describe('Performance', () => {
    
    it('should complete analysis within reasonable time', async () => {
      const startTime = Date.now();
      const text = 'Quick sentiment test';
      
      await analyzeSentimentWithDeepSeek(text);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
    }, 20000);
  });
});
