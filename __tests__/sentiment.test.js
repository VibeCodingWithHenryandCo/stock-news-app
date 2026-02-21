/**
 * Sentiment Analysis Test Suite
 * Tests for sentiment scoring and article classification
 */

const { analyzeSentiment, classifySentiment } = require('../src/sentiment');

describe('Sentiment Analysis', () => {
  describe('analyzeSentiment', () => {
    test('should return positive sentiment for bullish news', () => {
      const text = 'Stock soars to record high as earnings beat expectations dramatically';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
      expect(result.comparative).toBeGreaterThan(0);
    });

    test('should return negative sentiment for bearish news', () => {
      const text = 'Stock plunges as company reports massive losses and layoffs';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result.score).toBeLessThan(0);
      expect(result.comparative).toBeLessThan(0);
    });

    test('should return neutral sentiment for neutral news', () => {
      const text = 'Company holds quarterly meeting to discuss regular operations';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(Math.abs(result.comparative)).toBeLessThan(1);
    });

    test('should handle empty string', () => {
      const result = analyzeSentiment('');
      
      expect(result).toBeDefined();
      expect(result.score).toBe(0);
    });

    test('should handle special characters', () => {
      const text = 'Stock up 10%! 📈🚀 Great news!!!';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    test('should handle mixed sentiment', () => {
      const text = 'Company reports strong revenue but faces increasing costs and challenges';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
      // Mixed sentiment should be closer to neutral
      expect(Math.abs(result.comparative)).toBeLessThan(2);
    });
  });

  describe('classifySentiment', () => {
    test('should classify as positive for high positive score', () => {
      const classification = classifySentiment(5);
      expect(classification).toBe('positive');
    });

    test('should classify as negative for high negative score', () => {
      const classification = classifySentiment(-5);
      expect(classification).toBe('negative');
    });

    test('should classify as neutral for score near zero', () => {
      const classification = classifySentiment(0);
      expect(classification).toBe('neutral');
    });

    test('should classify edge cases correctly', () => {
      expect(classifySentiment(0.5)).toBe('neutral');
      expect(classifySentiment(-0.5)).toBe('neutral');
      expect(classifySentiment(1.5)).toBe('positive');
      expect(classifySentiment(-1.5)).toBe('negative');
    });
  });

  describe('Real-world Scenarios', () => {
    const testCases = [
      {
        text: 'Apple stock surges 15% on strong iPhone sales and record profits',
        expectedSentiment: 'positive',
        description: 'Bullish earnings report'
      },
      {
        text: 'Tesla shares plummet following disappointing delivery numbers',
        expectedSentiment: 'negative',
        description: 'Bearish delivery report'
      },
      {
        text: 'Microsoft announces quarterly dividend payment',
        expectedSentiment: 'neutral',
        description: 'Routine corporate action'
      },
      {
        text: 'Tech stocks rally amid economic recovery hopes and strong market sentiment',
        expectedSentiment: 'positive',
        description: 'Market rally'
      },
      {
        text: 'Market crash: Dow plunges 800 points on recession fears',
        expectedSentiment: 'negative',
        description: 'Market crash'
      },
      {
        text: 'Company maintains guidance for the year amid stable market conditions',
        expectedSentiment: 'neutral',
        description: 'Guidance maintenance'
      },
      {
        text: 'Breakthrough innovation: AI chip breakthrough could revolutionize computing',
        expectedSentiment: 'positive',
        description: 'Innovation announcement'
      },
      {
        text: 'FDA recalls product over safety concerns and potential health risks',
        expectedSentiment: 'negative',
        description: 'Product recall'
      }
    ];

    testCases.forEach(({ text, expectedSentiment, description }) => {
      test(`should correctly classify: ${description}`, () => {
        const analysis = analyzeSentiment(text);
        const classification = classifySentiment(analysis.score);
        
        expect(classification).toBe(expectedSentiment);
      });
    });
  });

  describe('Financial Keywords', () => {
    const positiveKeywords = [
      'profit', 'gain', 'surge', 'rally', 'breakthrough', 'upgrade',
      'bullish', 'strong', 'beat', 'exceed', 'growth', 'boom'
    ];

    const negativeKeywords = [
      'loss', 'decline', 'crash', 'plunge', 'downgrade', 'bearish',
      'weak', 'miss', 'fall', 'drop', 'layoff', 'concern'
    ];

    positiveKeywords.forEach(keyword => {
      test(`should detect positive sentiment for keyword: ${keyword}`, () => {
        const text = `Company reports ${keyword} in latest quarter`;
        const result = analyzeSentiment(text);
        
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });

    negativeKeywords.forEach(keyword => {
      test(`should detect negative sentiment for keyword: ${keyword}`, () => {
        const text = `Company reports ${keyword} in latest quarter`;
        const result = analyzeSentiment(text);
        
        expect(result.score).toBeLessThanOrEqual(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null input', () => {
      expect(() => analyzeSentiment(null)).not.toThrow();
    });

    test('should handle undefined input', () => {
      expect(() => analyzeSentiment(undefined)).not.toThrow();
    });

    test('should handle very long text', () => {
      const longText = 'profit '.repeat(1000);
      const result = analyzeSentiment(longText);
      
      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThan(0);
    });

    test('should handle non-English characters', () => {
      const text = 'Company 公司 reports 报告 profit 利润';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
    });

    test('should handle numbers and symbols', () => {
      const text = 'Stock +10% $100 #winning @investors';
      const result = analyzeSentiment(text);
      
      expect(result).toBeDefined();
    });

    test('should be case insensitive', () => {
      const lower = analyzeSentiment('profit growth strong');
      const upper = analyzeSentiment('PROFIT GROWTH STRONG');
      const mixed = analyzeSentiment('Profit Growth Strong');
      
      expect(lower.score).toBeCloseTo(upper.score, 0);
      expect(lower.score).toBeCloseTo(mixed.score, 0);
    });
  });

  describe('Performance', () => {
    test('should analyze sentiment in reasonable time', () => {
      const text = 'Company reports strong quarterly earnings beating analyst expectations';
      const startTime = Date.now();
      
      analyzeSentiment(text);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
    });

    test('should handle bulk analysis efficiently', () => {
      const articles = Array.from({ length: 100 }, (_, i) => 
        `Company ${i} reports ${i % 2 === 0 ? 'profit' : 'loss'}`
      );
      
      const startTime = Date.now();
      articles.forEach(text => analyzeSentiment(text));
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 100 articles in < 1 second
    });
  });
});
