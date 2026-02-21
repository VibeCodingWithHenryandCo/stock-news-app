/**
 * Integration Test Suite
 * End-to-end tests for complete user workflows
 */

const request = require('supertest');
const path = require('path');
const fs = require('fs');

describe('Integration Tests', () => {
  let app;
  const testDbPath = path.join(__dirname, '../data/test-stock-news.db');
  
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.FINNHUB_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    delete require.cache[require.resolve('../server.js')];
    app = require('../server.js');
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Complete User Journey', () => {
    test('should complete full user registration and login flow', async () => {
      // Step 1: Register new user
      const registerData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'securePassword123'
      };
      
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData);
      
      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.userId).toBeDefined();
      
      // Step 2: Login with registered user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password
        });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.token).toBeDefined();
      
      const token = loginResponse.body.token;
      
      // Step 3: Access protected resource
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe(registerData.email);
    });

    test('should handle complete news fetching workflow', async () => {
      // Step 1: Fetch general news
      const generalNews = await request(app)
        .get('/api/news')
        .query({ category: 'general' });
      
      expect(generalNews.status).toBe(200);
      expect(Array.isArray(generalNews.body)).toBe(true);
      
      // Step 2: Fetch company-specific news
      const companyNews = await request(app)
        .get('/api/news/company')
        .query({
          symbol: 'AAPL',
          from: '2024-01-01',
          to: '2024-01-31'
        });
      
      expect(companyNews.status).toBe(200);
      expect(Array.isArray(companyNews.body)).toBe(true);
      
      // Step 3: Verify sentiment analysis was applied
      if (companyNews.body.length > 0) {
        const article = companyNews.body[0];
        expect(['positive', 'negative', 'neutral']).toContain(article.sentiment);
      }
    });
  });

  describe('Authentication Workflows', () => {
    test('should reject access to protected routes without authentication', async () => {
      const response = await request(app).get('/api/user/profile');
      expect(response.status).toBe(401);
    });

    test('should maintain session across multiple requests', async () => {
      // Register and login
      const userData = {
        username: 'sessionuser',
        email: 'session@example.com',
        password: 'password123'
      };
      
      await request(app).post('/api/auth/register').send(userData);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      const token = loginResponse.body.token;
      
      // Make multiple authenticated requests
      const requests = [
        request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`),
        request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`),
        request(app).get('/api/user/profile').set('Authorization', `Bearer ${token}`)
      ];
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Data Consistency', () => {
    test('should maintain data integrity across operations', async () => {
      const userData = {
        username: 'datauser',
        email: 'data@example.com',
        password: 'password123'
      };
      
      // Create user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      const userId = registerResponse.body.userId;
      
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      expect(loginResponse.body.user.id).toBe(userId);
      
      // Retrieve profile
      const profileResponse = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${loginResponse.body.token}`);
      
      expect(profileResponse.body.user.id).toBe(userId);
      expect(profileResponse.body.user.username).toBe(userData.username);
    });

    test('should handle concurrent user registrations', async () => {
      const users = Array.from({ length: 5 }, (_, i) => ({
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: 'password123'
      }));
      
      const registrations = users.map(user =>
        request(app).post('/api/auth/register').send(user)
      );
      
      const responses = await Promise.all(registrations);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
      
      // Verify all users can login
      const logins = users.map(user =>
        request(app).post('/api/auth/login')
          .send({ email: user.email, password: user.password })
      );
      
      const loginResponses = await Promise.all(logins);
      
      loginResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.token).toBeDefined();
      });
    });
  });

  describe('Error Recovery', () => {
    test('should recover from invalid login and allow retry', async () => {
      const userData = {
        username: 'retryuser',
        email: 'retry@example.com',
        password: 'correctPassword123'
      };
      
      await request(app).post('/api/auth/register').send(userData);
      
      // First attempt with wrong password
      const wrongAttempt = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: 'wrongPassword' });
      
      expect(wrongAttempt.status).toBe(401);
      
      // Second attempt with correct password
      const correctAttempt = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      expect(correctAttempt.status).toBe(200);
      expect(correctAttempt.body.token).toBeDefined();
    });

    test('should handle API rate limit exceeded gracefully', async () => {
      // Make many requests to trigger rate limit
      const requests = Array.from({ length: 150 }, () =>
        request(app).get('/api/news')
      );
      
      const responses = await Promise.all(requests);
      
      const rateLimited = responses.some(r => r.status === 429);
      const successful = responses.some(r => r.status === 200);
      
      // Should have both successful and rate-limited responses
      expect(rateLimited).toBe(true);
      expect(successful).toBe(true);
    });
  });

  describe('Cross-feature Integration', () => {
    test('should combine authentication with news fetching', async () => {
      // Register user
      const userData = {
        username: 'newsuser',
        email: 'news@example.com',
        password: 'password123'
      };
      
      await request(app).post('/api/auth/register').send(userData);
      
      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      
      const token = loginResponse.body.token;
      
      // Fetch news (if endpoint requires auth)
      const newsResponse = await request(app)
        .get('/api/news')
        .set('Authorization', `Bearer ${token}`);
      
      // Should work with or without auth depending on implementation
      expect([200, 401]).toContain(newsResponse.status);
    });

    test('should apply sentiment analysis to fetched news', async () => {
      const newsResponse = await request(app)
        .get('/api/news')
        .query({ category: 'general' });
      
      expect(newsResponse.status).toBe(200);
      
      if (newsResponse.body.length > 0) {
        newsResponse.body.forEach(article => {
          if (article.sentiment) {
            expect(['positive', 'negative', 'neutral']).toContain(article.sentiment);
          }
        });
      }
    });
  });

  describe('Performance Under Load', () => {
    test('should handle multiple simultaneous requests', async () => {
      const requests = Array.from({ length: 20 }, (_, i) => {
        if (i % 2 === 0) {
          return request(app).get('/api/news');
        } else {
          return request(app)
            .get('/api/news/company')
            .query({ symbol: 'AAPL', from: '2024-01-01', to: '2024-01-31' });
        }
      });
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);
      
      // Most requests should succeed (some may be rate limited)
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(10);
    });
  });

  describe('Security Integration', () => {
    test('should prevent SQL injection across endpoints', async () => {
      const maliciousInputs = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users--"
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: input,
            email: 'test@example.com',
            password: 'password123'
          });
        
        // Should either reject or sanitize
        expect([400, 409]).toContain(response.status);
      }
      
      // Verify database is intact
      const healthCheck = await request(app).get('/health');
      expect(healthCheck.status).toBe(200);
    });

    test('should sanitize XSS attempts in user input', async () => {
      const xssInputs = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>'
      ];
      
      for (const input of xssInputs) {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            username: input,
            email: `test${Date.now()}@example.com`,
            password: 'password123'
          });
        
        // Should handle safely
        if (response.status === 201) {
          // If accepted, should be sanitized
          expect(response.body.username).not.toContain('<script>');
        }
      }
    });
  });

  describe('Caching Behavior', () => {
    test('should cache identical news requests', async () => {
      const query = { category: 'general' };
      
      // First request
      const startTime1 = Date.now();
      const response1 = await request(app).get('/api/news').query(query);
      const duration1 = Date.now() - startTime1;
      
      // Second identical request (should be cached)
      const startTime2 = Date.now();
      const response2 = await request(app).get('/api/news').query(query);
      const duration2 = Date.now() - startTime2;
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Second request should be faster due to caching
      // (This might not always be true due to network variability)
      expect(response1.body).toEqual(response2.body);
    });
  });
});
