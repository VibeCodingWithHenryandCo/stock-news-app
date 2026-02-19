# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2024-02-19

### Fixed
- **Critical**: Fixed SQLite "no such table: users" error on application startup
  - Database initialization now happens before prepared statements are created
  - Tables are guaranteed to exist before any queries are prepared
  - Removed duplicate `initDatabase()` call from server.js

### Added
- Added database test script (`test-db.js`) to verify schema and operations
- Added npm test scripts (`npm test` and `npm run test:db`)
- Added database directory and SQLite files to `.gitignore`

### Changed
- Database initialization is now automatic when the database module loads
- Improved error handling during database initialization

## [1.0.0] - 2024-02-19

### Added
- Initial release of Stock News Web Application
- User authentication (register/login)
- Stock news search functionality
- Saved searches feature
- Bookmark articles feature
- Sentiment analysis on news articles
- Rate limiting and security features
- Caching (in-memory and database)
- Integration with Finnhub API
