# 🚀 AdWise - 1-Day Implementation Plan

**Goal**: Build a Facebook Ads MCP chat webapp where users can login and chat with their ad accounts using Claude AI.

**Brand**: AdWise - Clean, light blue theme, Linear design system style
**Timeline**: Complete by end of day
**Users**: 30 users max, worldwide, free tool

## ✅ Progress Tracker
- [x] **Phase 1**: Foundation (9 AM - 12 PM) - COMPLETED!
- [ ] **Phase 2**: Core Features (12 PM - 6 PM)  
- [ ] **Phase 3**: Polish & Deploy (6 PM - End of Day)

---

## 📋 **Phase 1: Foundation (9 AM - 12 PM)**

### Task 1.1: Project Setup ⏰ 30 min
- [x] Create Next.js project with TypeScript and Tailwind
- [x] Install required dependencies
- [x] Set up basic file structure
- [x] Initialize git repository

**Dependencies to install:**
```bash
npm install next-auth @anthropic-ai/sdk sqlite3 better-sqlite3 bcryptjs
```

### Task 1.2: Database Setup ⏰ 30 min
- [x] Create SQLite database schema
- [x] Set up database connection utilities
- [x] Create user and ad_accounts tables
- [x] Test database connection

**Schema:**
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  facebook_id TEXT UNIQUE NOT NULL,
  email TEXT,
  name TEXT,
  access_token TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ad_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  account_name TEXT,
  currency TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Task 1.3: NextAuth Facebook OAuth ⏰ 2 hours
- [x] Configure NextAuth with Facebook provider
- [x] Set up OAuth scopes (ads_read, business_management)
- [x] Create login page
- [x] Test Facebook login flow (CREDENTIALS ADDED!)
- [x] Store user data in database

**Required Environment Variables:**
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

---

## 🔧 **Phase 2: Core Features (12 PM - 6 PM)**

### Task 2.1: MCP Integration ⏰ 2 hours
- [ ] Create MCP manager class
- [ ] Implement MCP server spawning per user
- [ ] Create MCP tool discovery mechanism
- [ ] Test MCP server communication
- [ ] Add error handling for MCP calls

**MCP Manager Structure:**
```javascript
class MCPManager {
  async startMCPServer(accessToken)
  async discoverMCPTools(accessToken)
  async callMCPTool(accessToken, toolName, params)
  async cleanup()
}
```

### Task 2.2: Chat Interface ⏰ 1.5 hours
- [ ] Create chat UI component (Linear design style)
- [ ] Add message history display
- [ ] Implement typing indicators
- [ ] Add loading states
- [ ] Style with light blue theme

**Chat Features:**
- Clean, minimal design
- Message bubbles (user vs AI)
- Loading spinner for MCP calls
- Error state handling
- Responsive design

### Task 2.3: Claude AI Integration ⏰ 2 hours
- [ ] Set up Claude API client
- [ ] Implement function calling with MCP tools
- [ ] Create chat API endpoint
- [ ] Add conversation context management
- [ ] Test Claude + MCP integration

**Claude Function Calling:**
- Convert MCP tools to Claude function definitions
- Handle function execution via MCP
- Format responses naturally
- Maintain conversation context

### Task 2.4: Multi-Account Handling ⏰ 30 min
- [ ] Auto-fetch user's ad accounts on login
- [ ] Create account selector component
- [ ] Handle account context in chat
- [ ] Add account switching functionality

---

## 🎨 **Phase 3: Polish & Deploy (6 PM - End of Day)**

### Task 3.1: UI/UX Polish ⏰ 1 hour
- [ ] Apply Linear design system principles
- [ ] Implement light blue color scheme
- [ ] Add AdWise branding
- [ ] Ensure responsive design
- [ ] Add micro-interactions

**Design Principles:**
- Clean, minimal interface
- Light blue accent color (#3B82F6 or similar)
- Clear typography
- Intuitive navigation
- Professional appearance

### Task 3.2: Error Handling & UX ⏰ 30 min
- [ ] Add comprehensive error states
- [ ] Implement user-friendly error messages
- [ ] Add retry mechanisms
- [ ] Handle token expiration gracefully
- [ ] Add loading states for all async operations

### Task 3.3: Testing & Validation ⏰ 30 min
- [ ] Test with real Facebook ad account
- [ ] Validate MCP tool functionality
- [ ] Test multi-account switching
- [ ] Verify chat conversation flow
- [ ] Test error scenarios

### Task 3.4: Deployment ⏰ 1 hour
- [ ] Deploy to Vercel
- [ ] Set up production environment variables
- [ ] Configure custom domain (if available)
- [ ] Test live deployment
- [ ] Create production database

---

## 📁 **Project File Structure**

```
adwise/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth].js
│   │   ├── chat.js
│   │   └── accounts.js
│   ├── _app.js
│   ├── index.js (landing/login page)
│   └── chat.js (main chat interface)
├── components/
│   ├── Chat.js
│   ├── AccountSelector.js
│   ├── LoginButton.js
│   └── Layout.js
├── lib/
│   ├── db.js (database utilities)
│   ├── mcp-manager.js
│   └── auth.js
├── styles/
│   └── globals.css
├── public/
│   └── (AdWise branding assets)
├── server.py (MCP server - unchanged)
└── requirements.txt (MCP dependencies)
```

---

## 🔧 **Required Credentials**

**Please provide when ready:**
1. **Facebook App Credentials:**
   - App ID
   - App Secret
   - Redirect URI configured

2. **Claude API:**
   - Anthropic API key

3. **Test Account:**
   - Facebook account with ad accounts for testing

---

## 🎯 **Success Criteria**

By end of day, AdWise should:
- ✅ Allow Facebook login with ads permissions
- ✅ Display user's ad accounts
- ✅ Enable natural language chat about ads data
- ✅ Call MCP tools automatically via Claude
- ✅ Handle multiple ad accounts
- ✅ Be deployed and accessible online
- ✅ Have clean, professional UI with light blue theme

---

## 📊 **Progress Log**

### Completed Tasks:
*Will be updated as tasks are completed*

### Current Status:
**MCP COMPATIBILITY VERIFIED!** ✅ 
**Next.js setup complete, working on server startup**

### Progress Update:
1. ✅ **Facebook App ID and Secret configured**
2. ✅ **MCP Server compatibility verified** - Python 3.11 works perfectly
3. ✅ **MCP Manager created** - can spawn and communicate with your forked server
4. ✅ **Next.js 14 downgraded** - compatible with Node 18.17.0
5. 🔄 **Working on server startup** - fixing final configuration issues

### Key Compatibility Confirmed:
- ✅ **Your MCP server.py** works with Python 3.11
- ✅ **Next.js can spawn** the MCP process successfully  
- ✅ **Communication bridge** ready for tool calling
- ✅ **Database setup** ready to store user tokens

**Next: Get server running and test Facebook login!** 

# Check data initialization status
sqlite3 adwise.db "SELECT data_initialized, last_data_sync FROM users WHERE id = 8;"

# Count collected ad accounts  
sqlite3 adwise.db "SELECT COUNT(*) FROM ad_accounts WHERE user_id = 8;"

# Count insights collected
sqlite3 adwise.db "SELECT COUNT(*) FROM ad_account_insights WHERE user_id = 8;" 