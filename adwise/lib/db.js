const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'adwise.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create users table
const createUsersTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    facebook_id TEXT UNIQUE NOT NULL,
    email TEXT,
    name TEXT,
    access_token TEXT NOT NULL,
    data_initialized BOOLEAN DEFAULT FALSE,
    last_data_sync DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create ad_accounts table
const createAdAccountsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS ad_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT,
    currency TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, account_id)
  )
`);

// Create ad_account_insights table for storing performance data
const createAdAccountInsightsTable = db.prepare(`
  CREATE TABLE IF NOT EXISTS ad_account_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id TEXT NOT NULL,
    date_range TEXT NOT NULL, -- 'last_30d' or 'last_90d'
    spend REAL,
    impressions INTEGER,
    clicks INTEGER,
    ctr REAL,
    cpc REAL,
    cpm REAL,
    reach INTEGER,
    frequency REAL,
    synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, account_id, date_range)
  )
`);

// Create the tables
createUsersTable.run();
createAdAccountsTable.run();
createAdAccountInsightsTable.run();

// Add data_initialized column if it doesn't exist (for existing users)
try {
  db.prepare('ALTER TABLE users ADD COLUMN data_initialized BOOLEAN DEFAULT FALSE').run();
} catch (error) {
  // Column already exists, ignore
}

try {
  db.prepare('ALTER TABLE users ADD COLUMN last_data_sync DATETIME').run();
} catch (error) {
  // Column already exists, ignore
}

// Prepared statements for users
const createUser = db.prepare(`
  INSERT OR REPLACE INTO users (facebook_id, email, name, access_token)
  VALUES (?, ?, ?, ?)
`);

const getUserByFacebookId = db.prepare(`
  SELECT * FROM users WHERE facebook_id = ?
`);

const updateUserDataInitialized = db.prepare(`
  UPDATE users SET data_initialized = TRUE, last_data_sync = CURRENT_TIMESTAMP WHERE id = ?
`);

// Prepared statements for ad accounts
const createAdAccount = db.prepare(`
  INSERT OR REPLACE INTO ad_accounts (user_id, account_id, account_name, currency)
  VALUES (?, ?, ?, ?)
`);

const getAdAccountsByUserId = db.prepare(`
  SELECT * FROM ad_accounts WHERE user_id = ?
`);

// Prepared statements for ad account insights
const createAdAccountInsight = db.prepare(`
  INSERT OR REPLACE INTO ad_account_insights 
  (user_id, account_id, date_range, spend, impressions, clicks, ctr, cpc, cpm, reach, frequency)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getAdAccountInsights = db.prepare(`
  SELECT * FROM ad_account_insights WHERE user_id = ? AND account_id = ? AND date_range = ?
`);

const getAllAdAccountInsights = db.prepare(`
  SELECT * FROM ad_account_insights WHERE user_id = ?
`);

module.exports = {
  db,
  createUser,
  getUserByFacebookId,
  updateUserDataInitialized,
  createAdAccount,
  getAdAccountsByUserId,
  createAdAccountInsight,
  getAdAccountInsights,
  getAllAdAccountInsights
}; 