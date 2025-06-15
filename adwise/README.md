# 🚀 AdWise - AI-Powered Facebook Ads Management Platform

**AdWise** is a comprehensive web platform that enables Facebook advertisers to manage and analyze their advertising campaigns using natural language conversations with AI.

## 🌟 Features

### 🤖 **AI-Powered Chat Interface**
- **Claude Sonnet 4** integration for intelligent ad management
- Natural language queries for complex advertising insights
- Real-time analysis and recommendations
- Conversational interface for non-technical users

### 📊 **Complete Ad Account Management**
- **Automatic pagination** - access ALL your ad accounts (not just the first 25)
- Comprehensive dashboard with performance metrics
- Support for agencies managing hundreds of accounts
- Real-time data from Facebook Graph API

### 🔐 **Secure Multi-User Platform**
- Facebook OAuth authentication
- **User data isolation** - each advertiser only sees their own data
- Secure session management with NextAuth
- Private database per user

### 🛠 **21 Powerful MCP Tools**
- List and manage ad accounts, campaigns, ad sets, and ads
- Get detailed performance insights and metrics
- Access change history and activity logs
- Fetch ad creatives and campaign details
- Pagination support for large datasets

## 🎯 **Who Can Use AdWise?**

### 🏢 **For Agencies**
- Manage multiple client accounts in one place
- Natural language queries across all accounts
- Comprehensive reporting and analytics
- Scale operations with AI assistance

### 🚀 **For Enterprise**
- Handle hundreds of ad accounts efficiently
- Advanced analytics and performance tracking
- Team collaboration and data sharing
- Automated reporting and insights

### 👤 **For Individual Advertisers**
- Simplified ad management interface
- AI-powered optimization recommendations
- Easy-to-understand performance metrics
- No technical expertise required

### 💼 **For Small Businesses**
- Cost-effective ad management solution
- AI guidance for better campaign performance
- Simple setup and intuitive interface
- Scale advertising efforts efficiently

## 🚀 **Getting Started**

### Prerequisites
- Node.js 18+ installed
- Facebook Developer App with Ads Management permissions
- Environment variables configured

### 1. **Clone the Repository**
```bash
git clone https://github.com/benbenlaterreur/facebook-ads-mcp-server-page.git
cd facebook-ads-mcp-server-page/adwise
```

### 2. **Install Dependencies**
```bash
npm install
```

### 3. **Environment Setup**
Create a `.env.local` file with:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
ANTHROPIC_API_KEY=your-claude-api-key
```

### 4. **Start the Development Server**
```bash
npm run dev
```

### 5. **Access the Platform**
Open [http://localhost:3000](http://localhost:3000) and log in with your Facebook account.

## 💡 **How It Works**

### 🔑 **Authentication Flow**
1. User logs in with Facebook OAuth
2. Platform requests Ads Management permissions
3. User data is isolated in private database
4. MCP server initialized with user's access token

### 📈 **Data Collection**
1. **Automatic pagination** fetches ALL user's ad accounts
2. Performance insights collected for last 30 and 90 days
3. Data stored locally for fast analytics
4. Real-time API calls for live data

### 💬 **AI Chat Interface**
1. User asks questions in natural language
2. Claude AI processes the query with context
3. MCP tools fetch live data from Facebook API
4. AI provides formatted insights and recommendations

## 🔧 **Technical Architecture**

### **Frontend**
- **Next.js 14** with App Router
- **React** with TypeScript
- **Tailwind CSS** for styling
- **NextAuth** for authentication

### **Backend**
- **Node.js** API routes
- **SQLite** database for user data
- **MCP Server** for Facebook API integration
- **Claude Sonnet 4** for AI processing

### **Key Components**
- `data-initializer.js` - Handles pagination and data collection
- `mcp-manager.js` - Manages MCP server lifecycle
- `chat/route.js` - AI chat API endpoint
- `db.js` - Database operations and schema

## 📊 **Example Use Cases**

### **For Advertisers:**
- *"Show me my top performing campaigns this month"*
- *"Which ad accounts have the highest ROAS?"*
- *"What's my total advertising spend across all accounts?"*
- *"Find campaigns with CTR above 2%"*

### **For Agencies:**
- *"Compare performance across all client accounts"*
- *"Show me which clients need attention"*
- *"Generate a report for accounts spending over $10k"*
- *"List all active campaigns by client"*

## 🛡️ **Privacy & Security**

- **User Data Isolation**: Each user only accesses their own Facebook data
- **Secure Authentication**: OAuth 2.0 with Facebook
- **No Data Sharing**: User data is never shared between accounts
- **Local Storage**: Analytics data stored locally per user
- **API Security**: Rate limiting and error handling

## 🤝 **Contributing**

We welcome contributions! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation
- Review example use cases

---

**AdWise** - Empowering advertisers with AI-driven Facebook Ads management 🚀
