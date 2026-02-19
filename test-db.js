/**
 * Simple test script to verify database initialization and schema
 */

const { initDatabase, userQueries, db } = require('./src/database');
const { hashPassword } = require('./src/auth');

console.log('🧪 Testing database initialization...\n');

try {
  // Initialize the database
  initDatabase();
  
  // Verify tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('📊 Tables found:');
  tables.forEach(table => console.log(`  ✓ ${table.name}`));
  console.log('');
  
  // Check users table schema
  const usersSchema = db.prepare(`PRAGMA table_info(users)`).all();
  console.log('👤 Users table schema:');
  usersSchema.forEach(col => {
    console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });
  console.log('');
  
  // Test user creation
  console.log('🧪 Testing user creation...');
  const testUsername = `test_user_${Date.now()}`;
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'test123456';
  
  hashPassword(testPassword).then(passwordHash => {
    const result = userQueries.create.run(testUsername, testEmail, passwordHash);
    console.log(`  ✓ Created test user with ID: ${result.lastInsertRowid}`);
    
    // Verify user was created
    const user = userQueries.findByEmail.get(testEmail);
    if (user) {
      console.log(`  ✓ Successfully retrieved user: ${user.username}`);
    } else {
      console.log('  ✗ Failed to retrieve created user');
      process.exit(1);
    }
    
    // Test finding by username
    const userByUsername = userQueries.findByUsername.get(testUsername);
    if (userByUsername) {
      console.log(`  ✓ Successfully found user by username: ${userByUsername.username}`);
    } else {
      console.log('  ✗ Failed to find user by username');
      process.exit(1);
    }
    
    // Clean up test user
    db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
    console.log('  ✓ Cleaned up test user');
    console.log('');
    
    console.log('✅ All database tests passed!\n');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error during testing:', error);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Database test failed:', error);
  process.exit(1);
}
