/**
 * API Endpoints Test Suite
 * Tests for REST API endpoints, authentication, and error handling
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Mock the server setup without starting it
let app;
let server;

describe('API Endpoints', () => {
  const testDbPath = path.join(__dirname, '../data/test-stock-news.db');
  
  beforeAll(() => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.FINNHUB_API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    // Clean test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    
    // Create fresh app instance
    delete require.cache[require.resolve('../server.js')];
    app = require('../server.js');
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Health Check', () => {
    test('GET /health should return 200 and status ok', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('User Registration', () => {
    test('POST /api/auth/register should create new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('registered');
      expect(response.body.userId).toBeDefined();
    });

    test('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });
      
      expect(response.status).toBe(400);
    });

    test('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
    });

    test('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        });
      
      expect(response.status).toBe(400);
    });

    test('should reject duplicate username', async () => {
      const userData = {
        username: 'testuser',
        email: 'test1@example.com',
        password: 'password123'
      };
      
      await request(app).post('/api/auth/register').send(userData);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test2@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(409);
    });

    test('should reject duplicate email', async () => {
      const userData = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'password123'
      };
      
      await request(app).post('/api/auth/register').send(userData);
      
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser2',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(409);
    });
  });

  describe('User Login', () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
    });

    test('POST /api/auth/login should return JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    test('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
    });

    test('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(401);
    });

    test('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Protected Routes', () => {
    let authToken;
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123'
    };

    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(userData);
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: userData.email, password: userData.password });
      authToken = loginResponse.body.token;
    });

    test('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
    });

    test('should reject access without token', async () => {
      const response = await request(app).get('/api/user/profile');
      
      expect(response.status).toBe(401);
    });

    test('should reject access with invalid token', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });

    test('should reject access with expired token', async () => {
      // This would require mocking JWT with short expiry
      // Placeholder for future implementation
    });
  });

  describe('News API Endpoints', () => {
    test('GET /api/news should return general news', async () => {
      const response = await request(app)
        .get('/api/news')
        .query({ category: 'general' });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('GET /api/news/company should return company news', async () => {
      const response = await request(app)
        .get('/api/news/company')
        .query({ 
          symbol: 'AAPL',
          from: '2024-01-01',
          to: '2024-01-31'
        });
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should reject company news without symbol', async () => {
      const response = await request(app)
        .get('/api/news/company')
        .query({ 
          from: '2024-01-01',
          to: '2024-01-31'
        });
      
      expect(response.status).toBe(400);
    });

    test('should handle invalid date format', async () => {
      const response = await request(app)
        .get('/api/news/company')
        .query({ 
          symbol: 'AAPL',
          from: 'invalid-date',
          to: '2024-01-31'
        });
      
      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits on API endpoints', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app).get('/api/news')
      );
      
      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('CORS', () => {
    test('should have CORS headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');
      
      expect(response.status).toBe(404);
    });

    test('should handle server errors gracefully', async () => {
      // This would require mocking a server error
      // Placeholder for future implementation
    });

    test('should sanitize error messages in production', () => {
      // Verify error messages don't leak sensitive info
      // Placeholder for future implementation
    });
  });

  describe('Input Validation', () => {
    test('should reject SQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
    });

    test('should reject XSS attempts in registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Should either sanitize or reject
      expect([400, 201]).toContain(response.status);
      if (response.status === 201) {
        // Verify username was sanitized
        expect(response.body.username).not.toContain('<script>');
      }
    });

    test('should handle excessively large payloads', async () => {
      const largePayload = {
        username: 'a'.repeat(100000),
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(largePayload);
      
      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Content Type Validation', () => {
    test('should require JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send('username=test&email=test@example.com&password=password123');
      
      expect([400, 415]).toContain(response.status);
    });
  });
});
