const MCPManager = require('./mcp-manager.js');
const { 
  updateUserDataInitialized, 
  createAdAccount, 
  createAdAccountInsight 
} = require('./db.js');

class DataInitializer {
  constructor() {
    this.mcpManager = null;
  }

  async initializeUserData(user, accessToken) {
    try {
      // Initialize MCP manager
      this.mcpManager = new MCPManager();
      await this.mcpManager.initializeMCPServer(accessToken);
      
      // Step 1: Fetch all ad accounts with pagination
      const allAdAccounts = await this.fetchAllAdAccounts();
      
      // Step 2: Store ad accounts and fetch insights for each
      for (const account of allAdAccounts) {
        await this.processAdAccount(user.id, account);
      }
      
      // Step 3: Mark user as data initialized
      updateUserDataInitialized.run(user.id);
      
      return {
        success: true,
        accountsProcessed: allAdAccounts.length,
        message: `Successfully initialized data for ${allAdAccounts.length} ad accounts`
      };
      
    } catch (error) {
      // Silent error handling - don't expose to user
      throw error;
    } finally {
      if (this.mcpManager) {
        this.mcpManager.cleanup();
      }
    }
  }
  
  async processAdAccount(userId, account) {
    const accountId = account.id;
    const accountName = account.name || `Account ${accountId}`;
    
    try {
      // Step 1: Store ad account basic info
      createAdAccount.run(userId, accountId, accountName, 'USD'); // Default currency
      
      // Step 2: Get account details to fetch actual currency
      try {
        const accountDetailsResult = await this.mcpManager.callTool('get_details_of_ad_account', {
          act_id: accountId,
          fields: ['currency', 'account_status', 'balance']
        });
        
        // Parse account details response
        let accountDetails;
        if (accountDetailsResult && accountDetailsResult.content && accountDetailsResult.content[0] && accountDetailsResult.content[0].text) {
          try {
            accountDetails = JSON.parse(accountDetailsResult.content[0].text);
          } catch (parseError) {
            accountDetails = null;
          }
        }
        
        if (accountDetails && accountDetails.currency) {
          // Update with actual currency
          createAdAccount.run(userId, accountId, accountName, accountDetails.currency);
        }
      } catch (detailsError) {
        // Silent error handling
      }
      
      // Step 3: Fetch insights for last 30 days
      await this.fetchAndStoreInsights(userId, accountId, 'last_30d');
      
      // Step 4: Fetch insights for last 90 days  
      await this.fetchAndStoreInsights(userId, accountId, 'last_90d');
      
    } catch (error) {
      // Continue with other accounts even if one fails - silent error handling
    }
  }
  
  async fetchAndStoreInsights(userId, accountId, dateRange) {
    try {
      const insightsResult = await this.mcpManager.callTool('get_adaccount_insights', {
        act_id: accountId,
        fields: [
          'spend',
          'impressions', 
          'clicks',
          'ctr',
          'cpc',
          'cpm',
          'reach',
          'frequency'
        ],
        date_preset: dateRange,
        time_increment: 'all_days'
      });
      
      // Parse the insights response
      let insights;
      if (insightsResult && insightsResult.content && insightsResult.content[0] && insightsResult.content[0].text) {
        try {
          insights = JSON.parse(insightsResult.content[0].text);
        } catch (parseError) {
          insights = null;
        }
      }
      
      if (insights && insights.data && insights.data.length > 0) {
        const data = insights.data[0]; // Get aggregated data
        
        // Store insights in database
        createAdAccountInsight.run(
          userId,
          accountId,
          dateRange,
          parseFloat(data.spend || 0),
          parseInt(data.impressions || 0),
          parseInt(data.clicks || 0),
          parseFloat(data.ctr || 0),
          parseFloat(data.cpc || 0),
          parseFloat(data.cpm || 0),
          parseInt(data.reach || 0),
          parseFloat(data.frequency || 0)
        );
      } else {
        // Store empty record to mark as processed
        createAdAccountInsight.run(
          userId, accountId, dateRange, 0, 0, 0, 0, 0, 0, 0, 0
        );
      }
      
    } catch (error) {
      // Store empty record to mark as processed (avoid infinite retries)
      createAdAccountInsight.run(
        userId, accountId, dateRange, 0, 0, 0, 0, 0, 0, 0, 0
      );
    }
  }

  async fetchAllAdAccounts() {
    const allAccounts = [];
    let hasNextPage = true;
    let currentPage = 1;
    
    console.log('🔍 Starting to fetch all ad accounts with pagination...');
    
    // First, get the initial page
    const firstPageResult = await this.mcpManager.callTool('list_ad_accounts', {});
    
    // Parse the first page response
    let parsedResult;
    if (firstPageResult && firstPageResult.content && firstPageResult.content[0] && firstPageResult.content[0].text) {
      try {
        parsedResult = JSON.parse(firstPageResult.content[0].text);
      } catch (parseError) {
        throw new Error('Failed to parse ad accounts response: ' + parseError.message);
      }
    } else {
      throw new Error('Invalid ad accounts response format');
    }
    
    if (!parsedResult || !parsedResult.adaccounts || !parsedResult.adaccounts.data) {
      throw new Error('No ad accounts found in parsed response');
    }
    
    // Add first page accounts
    const firstPageAccounts = parsedResult.adaccounts.data;
    allAccounts.push(...firstPageAccounts);
    console.log(`📄 Page ${currentPage}: Found ${firstPageAccounts.length} ad accounts`);
    
    // Check if there are more pages to fetch
    let nextPageUrl = null;
    if (parsedResult.adaccounts.paging && parsedResult.adaccounts.paging.next) {
      nextPageUrl = parsedResult.adaccounts.paging.next;
    }
    
    // Fetch additional pages using pagination
    while (nextPageUrl && hasNextPage) {
      currentPage++;
      console.log(`🔄 Fetching page ${currentPage}...`);
      
      try {
        const nextPageResult = await this.mcpManager.callTool('fetch_pagination_url', {
          url: nextPageUrl
        });
        
        // Parse the next page response
        let nextPageParsed;
        if (nextPageResult && nextPageResult.content && nextPageResult.content[0] && nextPageResult.content[0].text) {
          try {
            nextPageParsed = JSON.parse(nextPageResult.content[0].text);
          } catch (parseError) {
            console.log(`⚠️ Failed to parse page ${currentPage}, stopping pagination: ${parseError.message}`);
            break;
          }
        } else {
          console.log(`⚠️ Invalid response format for page ${currentPage}, stopping pagination`);
          break;
        }
        
        if (nextPageParsed && nextPageParsed.data && nextPageParsed.data.length > 0) {
          allAccounts.push(...nextPageParsed.data);
          console.log(`📄 Page ${currentPage}: Found ${nextPageParsed.data.length} ad accounts`);
          
          // Check if there's another page
          if (nextPageParsed.paging && nextPageParsed.paging.next) {
            nextPageUrl = nextPageParsed.paging.next;
          } else {
            hasNextPage = false;
          }
        } else {
          console.log(`📄 Page ${currentPage}: No more accounts found, stopping pagination`);
          hasNextPage = false;
        }
        
        // Safety check: prevent infinite loops (max 50 pages)
        if (currentPage > 50) {
          console.log('⚠️ Reached maximum page limit (50), stopping pagination');
          break;
        }
        
      } catch (error) {
        console.log(`⚠️ Error fetching page ${currentPage}: ${error.message}, stopping pagination`);
        break;
      }
    }
    
    console.log(`✅ Pagination complete! Total ad accounts found: ${allAccounts.length} across ${currentPage} pages`);
    return allAccounts;
  }
}

module.exports = DataInitializer; 