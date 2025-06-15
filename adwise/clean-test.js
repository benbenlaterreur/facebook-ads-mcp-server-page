const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'adwise.db');

try {
  const db = new Database(dbPath);
  
  // Check if tables exist and delete data if they do
  try {
    db.exec('DELETE FROM ad_accounts;');
    console.log('✅ Cleared ad_accounts table');
  } catch (e) {
    console.log('ℹ️ ad_accounts table not found or empty');
  }
  
  try {
    db.exec('DELETE FROM ad_account_insights;');
    console.log('✅ Cleared ad_account_insights table');
  } catch (e) {
    console.log('ℹ️ ad_account_insights table not found or empty');
  }
  
  try {
    db.exec('DELETE FROM users;');
    console.log('✅ Cleared users table');
  } catch (e) {
    console.log('ℹ️ users table not found or empty');
  }
  
  db.close();
  console.log('✅ Database cleanup completed');
} catch (error) {
  console.log('⚠️ Error accessing database:', error.message);
} 