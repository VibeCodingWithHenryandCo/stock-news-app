/**
 * Frontend Application Test Suite
 * Tests for client-side logic, state management, and UI interactions
 */

/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the frontend HTML and JS
let appJs;
let mockLocalStorage;
let mockFetch;

describe('Frontend Application', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = fs.readFileSync(
      path.join(__dirname, '../public/index.html'),
      'utf-8'
    );

    // Mock localStorage
    mockLocalStorage = (() => {
      let store = {};
      return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

    // Mock fetch
    mockFetch = jest.fn();
    global.fetch = mockFetch;

    // Load app.js
    const appJsCode = fs.readFileSync(
      path.join(__dirname, '../public/app.js'),
      'utf-8'
    );
    eval(appJsCode);
  });

  describe('API Key Management', () => {
    test('should show API modal when no key is stored', () => {
      const modal = document.getElementById('apiModal');
      expect(modal.classList.contains('hidden')).toBe(false);
    });

    test('should save API key to localStorage', () => {
      const input = document.getElementById('apiKeyInput');
      const saveBtn = document.getElementById('saveApiKey');
      
      input.value = 'test-api-key-123';
      saveBtn.click();
      
      expect(mockLocalStorage.getItem('stockpulse_apikey')).toBe('test-api-key-123');
    });

    test('should hide modal and show app after saving API key', () => {
      const input = document.getElementById('apiKeyInput');
      const saveBtn = document.getElementById('saveApiKey');
      const modal = document.getElementById('apiModal');
      const app = document.getElementById('app');
      
      input.value = 'test-api-key-123';
      saveBtn.click();
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(app.classList.contains('hidden')).toBe(false);
    });

    test('should load saved API key on initialization', () => {
      mockLocalStorage.setItem('stockpulse_apikey', 'saved-key-456');
      
      // Reinitialize
      const appJsCode = fs.readFileSync(
        path.join(__dirname, '../public/app.js'),
        'utf-8'
      );
      eval(appJsCode);
      
      const modal = document.getElementById('apiModal');
      const app = document.getElementById('app');
      
      expect(modal.classList.contains('hidden')).toBe(true);
      expect(app.classList.contains('hidden')).toBe(false);
    });

    test('should reject empty API key', () => {
      const input = document.getElementById('apiKeyInput');
      const saveBtn = document.getElementById('saveApiKey');
      
      input.value = '';
      saveBtn.click();
      
      expect(mockLocalStorage.getItem('stockpulse_apikey')).toBeNull();
    });
  });

  describe('View Switching', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
    });

    test('should switch to general view', () => {
      const generalBtn = document.querySelector('[data-view="general"]');
      const pageTitle = document.getElementById('pageTitle');
      
      generalBtn.click();
      
      expect(pageTitle.textContent).toContain('Market Overview');
    });

    test('should switch to search view', () => {
      const searchBtn = document.querySelector('[data-view="search"]');
      const pageTitle = document.getElementById('pageTitle');
      
      searchBtn.click();
      
      expect(pageTitle.textContent).toContain('Search by Symbol');
    });

    test('should switch to trending view', () => {
      const trendingBtn = document.querySelector('[data-view="trending"]');
      const pageTitle = document.getElementById('pageTitle');
      
      trendingBtn.click();
      
      expect(pageTitle.textContent).toContain('Trending');
    });

    test('should update active state on nav buttons', () => {
      const generalBtn = document.querySelector('[data-view="general"]');
      const searchBtn = document.querySelector('[data-view="search"]');
      
      searchBtn.click();
      
      expect(searchBtn.classList.contains('active')).toBe(true);
      expect(generalBtn.classList.contains('active')).toBe(false);
    });
  });

  describe('Symbol Search', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
    });

    test('should search for symbol on button click', () => {
      const searchInput = document.getElementById('symbolSearch');
      const searchBtn = document.getElementById('searchBtn');
      const pageTitle = document.getElementById('pageTitle');
      
      searchInput.value = 'AAPL';
      searchBtn.click();
      
      expect(pageTitle.textContent).toContain('AAPL');
    });

    test('should search for symbol on Enter key', () => {
      const searchInput = document.getElementById('symbolSearch');
      const pageTitle = document.getElementById('pageTitle');
      
      searchInput.value = 'TSLA';
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      searchInput.dispatchEvent(event);
      
      expect(pageTitle.textContent).toContain('TSLA');
    });

    test('should handle empty search', () => {
      const searchInput = document.getElementById('symbolSearch');
      const searchBtn = document.getElementById('searchBtn');
      
      searchInput.value = '';
      searchBtn.click();
      
      // Should shake the input (animation test would require more setup)
      expect(searchInput.style.animation).toContain('shake');
    });

    test('should convert symbol to uppercase', () => {
      const searchInput = document.getElementById('symbolSearch');
      const searchBtn = document.getElementById('searchBtn');
      const pageTitle = document.getElementById('pageTitle');
      
      searchInput.value = 'aapl';
      searchBtn.click();
      
      expect(pageTitle.textContent).toContain('AAPL');
    });
  });

  describe('Quick Symbol Chips', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
    });

    test('should load symbol news on chip click', () => {
      const aaplChip = document.querySelector('[data-symbol="AAPL"]');
      const pageTitle = document.getElementById('pageTitle');
      
      aaplChip.click();
      
      expect(pageTitle.textContent).toContain('AAPL');
    });

    test('should highlight active chip', () => {
      const aaplChip = document.querySelector('[data-symbol="AAPL"]');
      const tslaChip = document.querySelector('[data-symbol="TSLA"]');
      
      aaplChip.click();
      
      expect(aaplChip.classList.contains('active')).toBe(true);
      expect(tslaChip.classList.contains('active')).toBe(false);
    });
  });

  describe('Sorting and Filtering', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
      
      // Mock some articles
      window.state = {
        allArticles: [
          {
            id: 1,
            headline: 'Good news',
            datetime: 1704067200, // 2024-01-01
            sentiment: 'positive',
            impact: 4
          },
          {
            id: 2,
            headline: 'Bad news',
            datetime: 1704153600, // 2024-01-02
            sentiment: 'negative',
            impact: 2
          },
          {
            id: 3,
            headline: 'Neutral news',
            datetime: 1704240000, // 2024-01-03
            sentiment: 'neutral',
            impact: 3
          }
        ],
        sortBy: 'newest',
        filterBy: 'all',
        pageSize: 10,
        displayed: 0
      };
    });

    test('should sort by newest first', () => {
      const sortSelect = document.getElementById('sortSelect');
      
      sortSelect.value = 'newest';
      sortSelect.dispatchEvent(new Event('change'));
      
      expect(window.state.sortBy).toBe('newest');
    });

    test('should sort by highest impact', () => {
      const sortSelect = document.getElementById('sortSelect');
      
      sortSelect.value = 'impact';
      sortSelect.dispatchEvent(new Event('change'));
      
      expect(window.state.sortBy).toBe('impact');
    });

    test('should filter by positive sentiment', () => {
      const filterSelect = document.getElementById('filterSelect');
      
      filterSelect.value = 'positive';
      filterSelect.dispatchEvent(new Event('change'));
      
      expect(window.state.filterBy).toBe('positive');
    });

    test('should filter by negative sentiment', () => {
      const filterSelect = document.getElementById('filterSelect');
      
      filterSelect.value = 'negative';
      filterSelect.dispatchEvent(new Event('change'));
      
      expect(window.state.filterBy).toBe('negative');
    });

    test('should show all articles when filter is all', () => {
      const filterSelect = document.getElementById('filterSelect');
      
      filterSelect.value = 'all';
      filterSelect.dispatchEvent(new Event('change'));
      
      expect(window.state.filterBy).toBe('all');
    });
  });

  describe('Sentiment Scoring', () => {
    test('should score positive article as positive', () => {
      const article = {
        headline: 'Stock surges to record high on strong earnings beat',
        summary: 'Company reports exceptional growth and profit gains'
      };
      
      const sentiment = window.scoreSentiment(article);
      expect(sentiment).toBe('positive');
    });

    test('should score negative article as negative', () => {
      const article = {
        headline: 'Stock plummets on disappointing earnings miss',
        summary: 'Company faces losses and layoffs amid weak performance'
      };
      
      const sentiment = window.scoreSentiment(article);
      expect(sentiment).toBe('negative');
    });

    test('should score neutral article as neutral', () => {
      const article = {
        headline: 'Company holds quarterly meeting',
        summary: 'Regular operations continue as expected'
      };
      
      const sentiment = window.scoreSentiment(article);
      expect(sentiment).toBe('neutral');
    });

    test('should handle missing headline', () => {
      const article = { summary: 'Some news content' };
      const sentiment = window.scoreSentiment(article);
      expect(['positive', 'negative', 'neutral']).toContain(sentiment);
    });

    test('should handle missing summary', () => {
      const article = { headline: 'Some headline' };
      const sentiment = window.scoreSentiment(article);
      expect(['positive', 'negative', 'neutral']).toContain(sentiment);
    });
  });

  describe('Impact Scoring', () => {
    test('should give higher score to newer articles', () => {
      const newArticle = {
        datetime: Date.now() / 1000,
        related: ''
      };
      const oldArticle = {
        datetime: Date.now() / 1000 - 86400 * 30,
        related: ''
      };
      
      const newScore = window.impactScore(newArticle);
      const oldScore = window.impactScore(oldArticle);
      
      expect(newScore).toBeGreaterThan(oldScore);
    });

    test('should consider related stocks count', () => {
      const articleWithMany = {
        datetime: Date.now() / 1000,
        related: 'AAPL,MSFT,GOOGL,AMZN'
      };
      const articleWithFew = {
        datetime: Date.now() / 1000,
        related: 'AAPL'
      };
      
      const manyScore = window.impactScore(articleWithMany);
      const fewScore = window.impactScore(articleWithFew);
      
      expect(manyScore).toBeGreaterThanOrEqual(fewScore);
    });

    test('should return score between 0 and 5', () => {
      const article = {
        datetime: Date.now() / 1000,
        related: 'AAPL,MSFT,GOOGL'
      };
      
      const score = window.impactScore(article);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(5);
    });
  });

  describe('HTML Escaping', () => {
    test('should escape HTML entities', () => {
      const escaped = window.escHtml('<script>alert("xss")</script>');
      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    test('should escape ampersands', () => {
      const escaped = window.escHtml('A & B');
      expect(escaped).toBe('A &amp; B');
    });

    test('should handle multiple entities', () => {
      const escaped = window.escHtml('<div>"Test" & \'More\'</div>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&amp;');
    });
  });

  describe('Time Formatting', () => {
    test('should format seconds ago', () => {
      const date = new Date(Date.now() - 30000);
      const timeStr = window.timeAgo(date);
      expect(timeStr).toMatch(/\d+s ago/);
    });

    test('should format minutes ago', () => {
      const date = new Date(Date.now() - 300000);
      const timeStr = window.timeAgo(date);
      expect(timeStr).toMatch(/\d+m ago/);
    });

    test('should format hours ago', () => {
      const date = new Date(Date.now() - 7200000);
      const timeStr = window.timeAgo(date);
      expect(timeStr).toMatch(/\d+h ago/);
    });

    test('should format days ago', () => {
      const date = new Date(Date.now() - 172800000);
      const timeStr = window.timeAgo(date);
      expect(timeStr).toMatch(/\d+d ago/);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
    });

    test('should show error state on API failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      await window.fetchGeneralNews();
      
      const newsGrid = document.getElementById('newsGrid');
      expect(newsGrid.innerHTML).toContain('error-state');
    });

    test('should show auth error for 401 response', async () => {
      mockFetch.mockRejectedValueOnce(new Error('HTTP 401: Unauthorized'));
      
      await window.fetchGeneralNews();
      
      const newsGrid = document.getElementById('newsGrid');
      expect(newsGrid.innerHTML).toContain('Invalid or expired API key');
    });
  });

  describe('Loading States', () => {
    test('should show loading spinner during fetch', () => {
      window.setLoading(true);
      
      const newsGrid = document.getElementById('newsGrid');
      expect(newsGrid.innerHTML).toContain('loading-state');
      expect(newsGrid.innerHTML).toContain('spinner');
    });

    test('should hide loading spinner after fetch', () => {
      window.setLoading(false);
      
      const loadMoreWrap = document.getElementById('loadMoreWrap');
      expect(loadMoreWrap.style.display).toBe('none');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      mockLocalStorage.setItem('stockpulse_apikey', 'test-key');
      
      // Create many articles
      window.state = {
        allArticles: Array.from({ length: 50 }, (_, i) => ({
          id: i,
          headline: `Article ${i}`,
          datetime: Date.now() / 1000,
          sentiment: 'neutral',
          impact: 3,
          source: 'Test',
          url: '#'
        })),
        _filtered: [],
        displayed: 0,
        pageSize: 10
      };
    });

    test('should show load more button when more articles exist', () => {
      window.renderArticles();
      
      const loadMoreWrap = document.getElementById('loadMoreWrap');
      expect(loadMoreWrap.style.display).not.toBe('none');
    });

    test('should hide load more button when all articles shown', () => {
      window.state.pageSize = 100;
      window.renderArticles();
      
      const loadMoreWrap = document.getElementById('loadMoreWrap');
      expect(loadMoreWrap.style.display).toBe('none');
    });

    test('should load more articles on button click', () => {
      window.renderArticles();
      const initialCount = document.querySelectorAll('.news-card').length;
      
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      loadMoreBtn.click();
      
      const newCount = document.querySelectorAll('.news-card').length;
      expect(newCount).toBeGreaterThan(initialCount);
    });
  });
});
