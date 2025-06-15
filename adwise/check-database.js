const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'adwise.db');

try {
  const db = new Database(dbPath);
  
  console.log('📊 DATABASE ANALYSIS REPORT');
  console.log('==========================\n');
  
  // Check users table
  try {
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`👤 USERS TABLE: ${users.length} records`);
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
        console.log(`    Facebook ID: ${user.facebook_id}, Data Initialized: ${user.data_initialized}`);
        console.log(`    Last Sync: ${user.last_sync_date}\n`);
      });
    }
  } catch (e) {
    console.log('👤 USERS TABLE: Not found or error:', e.message);
  }
  
  // Check ad_accounts table
  try {
    const accounts = db.prepare('SELECT * FROM ad_accounts').all();
    console.log(`🏢 AD ACCOUNTS TABLE: ${accounts.length} records`);
    
    if (accounts.length > 0) {
      // Group by user_id to show per user
      const accountsByUser = {};
      accounts.forEach(account => {
        if (!accountsByUser[account.user_id]) {
          accountsByUser[account.user_id] = [];
        }
        accountsByUser[account.user_id].push(account);
      });
      
      Object.keys(accountsByUser).forEach(userId => {
        const userAccounts = accountsByUser[userId];
        console.log(`  User ${userId}: ${userAccounts.length} ad accounts`);
        
        // Show first few accounts as sample
        userAccounts.slice(0, 5).forEach(account => {
          console.log(`    - ${account.account_id}: ${account.account_name} (${account.currency})`);
        });
        
        if (userAccounts.length > 5) {
          console.log(`    ... and ${userAccounts.length - 5} more accounts`);
        }
        console.log('');
      });
    }
  } catch (e) {
    console.log('🏢 AD ACCOUNTS TABLE: Not found or error:', e.message);
  }
  
  // Check ad_account_insights table
  try {
    const insights = db.prepare('SELECT * FROM ad_account_insights').all();
    console.log(`📈 AD ACCOUNT INSIGHTS TABLE: ${insights.length} records`);
    
    if (insights.length > 0) {
      // Calculate totals
      const totalSpend = insights.reduce((sum, insight) => sum + (insight.spend || 0), 0);
      const totalImpressions = insights.reduce((sum, insight) => sum + (insight.impressions || 0), 0);
      const totalClicks = insights.reduce((sum, insight) => sum + (insight.clicks || 0), 0);
      
      console.log(`  📊 TOTALS ACROSS ALL INSIGHTS:`);
      console.log(`    Total Spend: €${totalSpend.toLocaleString()}`);
      console.log(`    Total Impressions: ${totalImpressions.toLocaleString()}`);
      console.log(`    Total Clicks: ${totalClicks.toLocaleString()}`);
      
      // Show breakdown by date range
      const byDateRange = {};
      insights.forEach(insight => {
        const key = insight.date_range;
        if (!byDateRange[key]) {
          byDateRange[key] = { count: 0, spend: 0 };
        }
        byDateRange[key].count++;
        byDateRange[key].spend += insight.spend || 0;
      });
      
      console.log(`\n  📅 BREAKDOWN BY DATE RANGE:`);
      Object.keys(byDateRange).forEach(dateRange => {
        const data = byDateRange[dateRange];
        console.log(`    ${dateRange}: ${data.count} records, €${data.spend.toLocaleString()} spend`);
      });
    }
  } catch (e) {
    console.log('📈 AD ACCOUNT INSIGHTS TABLE: Not found or error:', e.message);
  }
  
  // Get unique account count per user
  try {
    const uniqueAccountsQuery = `
      SELECT user_id, COUNT(DISTINCT account_id) as unique_accounts 
      FROM ad_accounts 
      GROUP BY user_id
    `;
    const uniqueAccounts = db.prepare(uniqueAccountsQuery).all();
    
    if (uniqueAccounts.length > 0) {
      console.log(`\n🔢 UNIQUE AD ACCOUNTS PER USER:`);
      uniqueAccounts.forEach(result => {
        console.log(`  User ${result.user_id}: ${result.unique_accounts} unique ad accounts`);
      });
    }
  } catch (e) {
    console.log('🔢 UNIQUE ACCOUNTS QUERY: Error:', e.message);
  }
  
  // Check database file size
  const fs = require('fs');
  try {
    const stats = fs.statSync(dbPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`\n💾 DATABASE FILE SIZE: ${fileSizeInMB} MB`);
  } catch (e) {
    console.log('💾 DATABASE FILE SIZE: Could not determine');
  }
  
  db.close();
  console.log('\n✅ Database analysis complete');
  
} catch (error) {
  console.log('❌ Error accessing database:', error.message);
} 