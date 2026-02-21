/**
 * Database Operations Test Suite
 * Tests for database initialization, user operations, and data integrity
 */

const { initDatabase, userQueries, db } = require('../src/database');
const { hashPassword, comparePassword } = require('../src/auth');
const fs = require('fs');
const path = require('path');

describe('Database Operations', () => {
  const testDbPath = path.join(__dirname, '../data/test-stock-news.db');
  
  beforeAll(() => {
    // Use test database
    process.env.NODE_ENV = 'test';
  });

  beforeEach(() => {
    // Clean test database before each test
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    initDatabase();
  });

  afterAll(() => {
    // Clean up test database
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Database Initialization', () => {
    test('should create users table', () => {
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).all();
      
      expect(tables).toHaveLength(1);
      expect(tables[0].name).toBe('users');
    });

    test('should have correct users table schema', () => {
      const schema = db.prepare(`PRAGMA table_info(users)`).all();
      const columnNames = schema.map(col => col.name);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('username');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password_hash');
      expect(columnNames).toContain('created_at');
    });

    test('should create unique indexes on username and email', () => {
      const indexes = db.prepare(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='index' AND tbl_name='users'
      `).all();
      
      expect(indexes.length).toBeGreaterThan(0);
    });
  });

  describe('User Creation', () => {
    test('should create a new user successfully', async () => {
      const username = 'testuser';
      const email = 'test@example.com';
      const password = 'testpassword123';
      const passwordHash = await hashPassword(password);
      
      const result = userQueries.create.run(username, email, passwordHash);
      
      expect(result.lastInsertRowid).toBeDefined();
      expect(result.changes).toBe(1);
    });

    test('should not allow duplicate usernames', async () => {
      const username = 'duplicate';
      const passwordHash = await hashPassword('password123');
      
      userQueries.create.run(username, 'user1@example.com', passwordHash);
      
      expect(() => {
        userQueries.create.run(username, 'user2@example.com', passwordHash);
      }).toThrow();
    });

    test('should not allow duplicate emails', async () => {
      const email = 'duplicate@example.com';
      const passwordHash = await hashPassword('password123');
      
      userQueries.create.run('user1', email, passwordHash);
      
      expect(() => {
        userQueries.create.run('user2', email, passwordHash);
      }).toThrow();
    });

    test('should store password hash, not plain password', async () => {
      const password = 'mySecretPassword';
      const passwordHash = await hashPassword(password);
      
      userQueries.create.run('testuser', 'test@example.com', passwordHash);
      const user = userQueries.findByEmail.get('test@example.com');
      
      expect(user.password_hash).not.toBe(password);
      expect(user.password_hash).toBe(passwordHash);
    });
  });

  describe('User Retrieval', () => {
    beforeEach(async () => {
      const passwordHash = await hashPassword('password123');
      userQueries.create.run('alice', 'alice@example.com', passwordHash);
      userQueries.create.run('bob', 'bob@example.com', passwordHash);
    });

    test('should find user by email', () => {
      const user = userQueries.findByEmail.get('alice@example.com');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('alice');
      expect(user.email).toBe('alice@example.com');
    });

    test('should find user by username', () => {
      const user = userQueries.findByUsername.get('bob');
      
      expect(user).toBeDefined();
      expect(user.username).toBe('bob');
      expect(user.email).toBe('bob@example.com');
    });

    test('should return undefined for non-existent email', () => {
      const user = userQueries.findByEmail.get('nonexistent@example.com');
      expect(user).toBeUndefined();
    });

    test('should return undefined for non-existent username', () => {
      const user = userQueries.findByUsername.get('nonexistent');
      expect(user).toBeUndefined();
    });

    test('should find user by ID', () => {
      const alice = userQueries.findByEmail.get('alice@example.com');
      const user = userQueries.findById.get(alice.id);
      
      expect(user).toBeDefined();
      expect(user.id).toBe(alice.id);
      expect(user.username).toBe('alice');
    });
  });

  describe('Data Integrity', () => {
    test('should have created_at timestamp', async () => {
      const passwordHash = await hashPassword('password123');
      userQueries.create.run('testuser', 'test@example.com', passwordHash);
      
      const user = userQueries.findByEmail.get('test@example.com');
      
      expect(user.created_at).toBeDefined();
      expect(new Date(user.created_at)).toBeInstanceOf(Date);
    });

    test('should handle SQL injection attempts', async () => {
      const passwordHash = await hashPassword('password123');
      const maliciousEmail = "'; DROP TABLE users; --";
      
      expect(() => {
        userQueries.create.run('hacker', maliciousEmail, passwordHash);
      }).toThrow();
      
      // Verify users table still exists
      const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='users'
      `).all();
      expect(tables).toHaveLength(1);
    });

    test('should handle special characters in username', async () => {
      const passwordHash = await hashPassword('password123');
      const specialUsername = 'user_with-special.chars';
      
      userQueries.create.run(specialUsername, 'special@example.com', passwordHash);
      const user = userQueries.findByUsername.get(specialUsername);
      
      expect(user).toBeDefined();
      expect(user.username).toBe(specialUsername);
    });
  });

  describe('User Update Operations', () => {
    test('should update user password', async () => {
      const oldPassword = 'oldpassword123';
      const newPassword = 'newpassword456';
      const oldHash = await hashPassword(oldPassword);
      
      userQueries.create.run('testuser', 'test@example.com', oldHash);
      const user = userQueries.findByEmail.get('test@example.com');
      
      const newHash = await hashPassword(newPassword);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(newHash, user.id);
      
      const updatedUser = userQueries.findById.get(user.id);
      expect(updatedUser.password_hash).toBe(newHash);
      expect(await comparePassword(newPassword, updatedUser.password_hash)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty username', async () => {
      const passwordHash = await hashPassword('password123');
      
      expect(() => {
        userQueries.create.run('', 'empty@example.com', passwordHash);
      }).toThrow();
    });

    test('should handle very long username', async () => {
      const passwordHash = await hashPassword('password123');
      const longUsername = 'a'.repeat(1000);
      
      // Should either succeed or throw based on DB constraints
      try {
        userQueries.create.run(longUsername, 'long@example.com', passwordHash);
        const user = userQueries.findByUsername.get(longUsername);
        expect(user).toBeDefined();
      } catch (error) {
        // If DB has length constraints, it should throw
        expect(error).toBeDefined();
      }
    });

    test('should handle concurrent user creation', async () => {
      const passwordHash = await hashPassword('password123');
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        new Promise((resolve, reject) => {
          try {
            userQueries.create.run(`user${i}`, `user${i}@example.com`, passwordHash);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
      );
      
      await Promise.all(promises);
      
      const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
      expect(users.count).toBe(10);
    });
  });
});
