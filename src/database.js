const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dataDir, 'stocknews.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Saved searches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      query TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Bookmarked articles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookmarked_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      article_url TEXT NOT NULL,
      article_title TEXT NOT NULL,
      article_source TEXT,
      article_published_at TEXT,
      bookmarked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, article_url)
    )
  `);

  // News cache table
  db.exec(`
    CREATE TABLE IF NOT EXISTS news_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT NOT NULL,
      response_data TEXT NOT NULL,
      sentiment TEXT,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarked_articles(user_id);
    CREATE INDEX IF NOT EXISTS idx_news_cache_query ON news_cache(query, expires_at);
  `);

  console.log('✅ Database initialized successfully');
}

// Initialize database immediately to ensure tables exist before preparing statements
initDatabase();

// User operations
const userQueries = {
  create: db.prepare(`
    INSERT INTO users (username, email, password_hash)
    VALUES (?, ?, ?)
  `),
  
  findByEmail: db.prepare(`
    SELECT * FROM users WHERE email = ?
  `),
  
  findByUsername: db.prepare(`
    SELECT * FROM users WHERE username = ?
  `),
  
  findById: db.prepare(`
    SELECT id, username, email, created_at FROM users WHERE id = ?
  `)
};

// Saved search operations
const savedSearchQueries = {
  create: db.prepare(`
    INSERT INTO saved_searches (user_id, query)
    VALUES (?, ?)
  `),
  
  getByUser: db.prepare(`
    SELECT * FROM saved_searches 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `),
  
  delete: db.prepare(`
    DELETE FROM saved_searches WHERE id = ? AND user_id = ?
  `)
};

// Bookmark operations
const bookmarkQueries = {
  create: db.prepare(`
    INSERT INTO bookmarked_articles (user_id, article_url, article_title, article_source, article_published_at)
    VALUES (?, ?, ?, ?, ?)
  `),
  
  getByUser: db.prepare(`
    SELECT * FROM bookmarked_articles 
    WHERE user_id = ? 
    ORDER BY bookmarked_at DESC
  `),
  
  delete: db.prepare(`
    DELETE FROM bookmarked_articles WHERE id = ? AND user_id = ?
  `),
  
  checkExists: db.prepare(`
    SELECT id FROM bookmarked_articles WHERE user_id = ? AND article_url = ?
  `)
};

// Cache operations
const cacheQueries = {
  get: db.prepare(`
    SELECT response_data, sentiment FROM news_cache 
    WHERE query = ? AND expires_at > datetime('now')
    ORDER BY cached_at DESC LIMIT 1
  `),
  
  set: db.prepare(`
    INSERT INTO news_cache (query, response_data, sentiment, expires_at)
    VALUES (?, ?, ?, datetime('now', '+' || ? || ' seconds'))
  `),
  
  cleanup: db.prepare(`
    DELETE FROM news_cache WHERE expires_at < datetime('now')
  `)
};

// Cleanup old cache entries periodically
setInterval(() => {
  try {
    const result = cacheQueries.cleanup.run();
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired cache entries`);
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}, 5 * 60 * 1000); // Every 5 minutes

module.exports = {
  db,
  initDatabase,
  userQueries,
  savedSearchQueries,
  bookmarkQueries,
  cacheQueries
};
