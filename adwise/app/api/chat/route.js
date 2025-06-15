import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { getUserByFacebookId } from '../../../lib/db';
import MCPManager from '../../../lib/mcp-manager.js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    console.log('🚀 CHAT API STARTED');
    
    // Step 1: Check session
    console.log('Step 1: Getting session...');
    const session = await getServerSession(authOptions);
    
    if (!session?.facebookId) {
      console.error('❌ No session or Facebook ID found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { facebookId, accessToken } = session;
    console.log('✅ Session found for Facebook ID:', facebookId);

    // Step 2: Get user from database
    console.log('Step 2: Looking up user in database...');
    const user = getUserByFacebookId.get(facebookId);
    
    if (!user) {
      console.error('❌ User not found in database');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('✅ User from DB:', { id: user.id, name: user.name, facebook_id: user.facebook_id });

    // Step 3: Get request data
    console.log('Step 3: Parsing request data...');
    const { message, account, context = [] } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log('✅ User message:', message);
    console.log('✅ Selected account:', account);
    console.log('✅ Context messages:', context.length);

    // Step 4: Initialize MCP manager
    console.log('Step 4: Initializing MCP manager...');
    const mcpManager = new MCPManager();

    try {
      // Step 5: Initialize MCP server
      console.log('Step 5: Initializing MCP server...');
      await mcpManager.initializeMCPServer(accessToken);

      // Step 6: Prepare tools for Claude - ALL 21 MCP TOOLS AVAILABLE
      console.log('Step 6: Preparing tools for Claude...');
      const tools = [
        // Account & Object Read Tools
        {
          name: 'list_ad_accounts',
          description: 'Lists ad accounts linked to the token',
          input_schema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'get_details_of_ad_account',
          description: 'Retrieves details for a specific ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_campaign_by_id',
          description: 'Retrieves details for a specific campaign',
          input_schema: {
            type: 'object',
            properties: {
              campaign_id: { type: 'string', description: 'Campaign ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              date_format: { type: 'string', description: 'Date format' }
            },
            required: ['campaign_id']
          }
        },
        {
          name: 'get_adset_by_id',
          description: 'Retrieves details for a specific ad set',
          input_schema: {
            type: 'object',
            properties: {
              adset_id: { type: 'string', description: 'Ad set ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' }
            },
            required: ['adset_id']
          }
        },
        {
          name: 'get_ad_by_id',
          description: 'Retrieves details for a specific ad',
          input_schema: {
            type: 'object',
            properties: {
              ad_id: { type: 'string', description: 'Ad ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' }
            },
            required: ['ad_id']
          }
        },
        {
          name: 'get_ad_creative_by_id',
          description: 'Retrieves details for a specific ad creative',
          input_schema: {
            type: 'object',
            properties: {
              creative_id: { type: 'string', description: 'Creative ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              thumbnail_width: { type: 'integer', description: 'Thumbnail width' },
              thumbnail_height: { type: 'integer', description: 'Thumbnail height' }
            },
            required: ['creative_id']
          }
        },
        {
          name: 'get_adsets_by_ids',
          description: 'Retrieves details for multiple ad sets by their IDs',
          input_schema: {
            type: 'object',
            properties: {
              adset_ids: { type: 'array', items: { type: 'string' }, description: 'List of ad set IDs' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              date_format: { type: 'string', description: 'Date format' }
            },
            required: ['adset_ids']
          }
        },

        // Fetching Collections Tools
        {
          name: 'get_campaigns_by_adaccount',
          description: 'Retrieves campaigns within an ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              after: { type: 'string', description: 'Pagination cursor' },
              before: { type: 'string', description: 'Pagination cursor' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Campaign status filter' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_adsets_by_adaccount',
          description: 'Retrieves ad sets within an ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Ad set status filter' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_ads_by_adaccount',
          description: 'Retrieves ads within an ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Ad status filter' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_adsets_by_campaign',
          description: 'Retrieves ad sets within a campaign',
          input_schema: {
            type: 'object',
            properties: {
              campaign_id: { type: 'string', description: 'Campaign ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Ad set status filter' }
            },
            required: ['campaign_id']
          }
        },
        {
          name: 'get_ads_by_campaign',
          description: 'Retrieves ads within a campaign',
          input_schema: {
            type: 'object',
            properties: {
              campaign_id: { type: 'string', description: 'Campaign ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Ad status filter' }
            },
            required: ['campaign_id']
          }
        },
        {
          name: 'get_ads_by_adset',
          description: 'Retrieves ads within an ad set',
          input_schema: {
            type: 'object',
            properties: {
              adset_id: { type: 'string', description: 'Ad set ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              filtering: { type: 'array', description: 'Filter conditions' },
              limit: { type: 'integer', description: 'Number of results to return' },
              effective_status: { type: 'array', items: { type: 'string' }, description: 'Ad status filter' }
            },
            required: ['adset_id']
          }
        },
        {
          name: 'get_ad_creatives_by_ad_id',
          description: 'Retrieves creatives associated with an ad',
          input_schema: {
            type: 'object',
            properties: {
              ad_id: { type: 'string', description: 'Ad ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              limit: { type: 'integer', description: 'Number of results to return' },
              after: { type: 'string', description: 'Pagination cursor' },
              before: { type: 'string', description: 'Pagination cursor' }
            },
            required: ['ad_id']
          }
        },

        // Insights & Performance Data Tools
        {
          name: 'get_adaccount_insights',
          description: 'Retrieves performance insights for an ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Metrics to retrieve like spend, impressions, clicks, ctr, cpc, cpm' },
              date_preset: { type: 'string', description: 'Date range: today, yesterday, last_7d, last_14d, last_30d, last_90d, this_month, last_month' },
              time_increment: { type: 'string', description: 'Time breakdown: all_days, daily, monthly' },
              breakdowns: { type: 'array', items: { type: 'string' }, description: 'Breakdown dimensions' },
              filtering: { type: 'array', description: 'Filter conditions' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_campaign_insights',
          description: 'Retrieves performance insights for a campaign',
          input_schema: {
            type: 'object',
            properties: {
              campaign_id: { type: 'string', description: 'Campaign ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Metrics to retrieve' },
              date_preset: { type: 'string', description: 'Date range preset' },
              time_increment: { type: 'string', description: 'Time breakdown' },
              breakdowns: { type: 'array', items: { type: 'string' }, description: 'Breakdown dimensions' }
            },
            required: ['campaign_id']
          }
        },
        {
          name: 'get_adset_insights',
          description: 'Retrieves performance insights for an ad set',
          input_schema: {
            type: 'object',
            properties: {
              adset_id: { type: 'string', description: 'Ad set ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Metrics to retrieve' },
              date_preset: { type: 'string', description: 'Date range preset' },
              time_increment: { type: 'string', description: 'Time breakdown' },
              breakdowns: { type: 'array', items: { type: 'string' }, description: 'Breakdown dimensions' }
            },
            required: ['adset_id']
          }
        },
        {
          name: 'get_ad_insights',
          description: 'Retrieves performance insights for an ad',
          input_schema: {
            type: 'object',
            properties: {
              ad_id: { type: 'string', description: 'Ad ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Metrics to retrieve' },
              date_preset: { type: 'string', description: 'Date range preset' },
              time_increment: { type: 'string', description: 'Time breakdown' },
              breakdowns: { type: 'array', items: { type: 'string' }, description: 'Breakdown dimensions' }
            },
            required: ['ad_id']
          }
        },
        {
          name: 'fetch_pagination_url',
          description: 'Fetches data from a pagination URL (e.g., from insights)',
          input_schema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'Pagination URL to fetch' }
            },
            required: ['url']
          }
        },

        // Activity/Change History Tools
        {
          name: 'get_activities_by_adaccount',
          description: 'Retrieves change history for an ad account',
          input_schema: {
            type: 'object',
            properties: {
              act_id: { type: 'string', description: 'Ad account ID (format: act_XXXXXXXXX)' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              limit: { type: 'integer', description: 'Number of results to return' },
              time_range: { type: 'object', description: 'Time range for activities' }
            },
            required: ['act_id']
          }
        },
        {
          name: 'get_activities_by_adset',
          description: 'Retrieves change history for an ad set',
          input_schema: {
            type: 'object',
            properties: {
              adset_id: { type: 'string', description: 'Ad set ID' },
              fields: { type: 'array', items: { type: 'string' }, description: 'Fields to retrieve' },
              limit: { type: 'integer', description: 'Number of results to return' },
              time_range: { type: 'object', description: 'Time range for activities' }
            },
            required: ['adset_id']
          }
        }
      ];

      console.log('✅ Tools prepared:', tools.map(t => t.name));

      // Step 7: Build conversation messages with context
      console.log('Step 7: Building conversation messages...');
      const conversationMessages = [];
      
      // Add context messages (conversation history)
      for (const contextMsg of context) {
        conversationMessages.push({
          role: contextMsg.role,
          content: contextMsg.content
        });
      }
      
      // Add current message
      conversationMessages.push({
        role: 'user',
        content: message
      });

      // Step 8: Call Claude with MCP tools
      console.log('Step 8: Calling Claude API...');
      const claudeResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        system: `You are AdWise, an AI assistant specialized in Facebook advertising analytics and management.

🚨 **CRITICAL FORMATTING RULES:**
- **NEVER show tool calls or raw JSON data to the user**
- **ALWAYS provide clean, final answers only**
- **Use Markdown formatting with tables and headers**
- **Present data in an organized, professional manner**

🎯 **RESPONSE REQUIREMENTS:**
- **Direct answers only** - no tool execution details
- **Clean tables** for performance data and metrics
- **Professional headers** (##, ###) to organize content
- **Bullet points** for lists and recommendations
- **Bold formatting** for important metrics and values
- **Emojis** for visual appeal and categorization

📊 **TABLE FORMAT EXAMPLE:**
| Creative Name | Spend | Impressions | Clicks | CTR | CPC |
|---------------|-------|-------------|--------|-----|-----|
| Creative A | €1,234 | 45,678 | 890 | 1.95% | €1.39 |

You have access to 21 Facebook Ads MCP tools for comprehensive analysis:

## 📊 ACCOUNT & OBJECT READ TOOLS
- **list_ad_accounts**: Lists all ad accounts
- **get_details_of_ad_account**: Get detailed account information
- **get_campaign_by_id**: Get specific campaign details
- **get_adset_by_id**: Get specific ad set details  
- **get_ad_by_id**: Get specific ad details
- **get_ad_creative_by_id**: Get creative details
- **get_adsets_by_ids**: Get multiple ad sets at once

## 📈 COLLECTION TOOLS
- **get_campaigns_by_adaccount**: Get all campaigns in an account
- **get_adsets_by_adaccount**: Get all ad sets in an account
- **get_ads_by_adaccount**: Get all ads in an account
- **get_adsets_by_campaign**: Get ad sets within a campaign
- **get_ads_by_campaign**: Get ads within a campaign
- **get_ads_by_adset**: Get ads within an ad set
- **get_ad_creatives_by_ad_id**: Get creatives for an ad

## 💰 INSIGHTS & PERFORMANCE TOOLS
- **get_adaccount_insights**: Account-level performance data
- **get_campaign_insights**: Campaign-level performance data
- **get_adset_insights**: Ad set-level performance data
- **get_ad_insights**: Ad-level performance data
- **fetch_pagination_url**: Get more data from paginated results

## 📋 ACTIVITY & HISTORY TOOLS
- **get_activities_by_adaccount**: Account change history
- **get_activities_by_adset**: Ad set change history

## ⚡ TECHNICAL GUIDELINES
1. **Account IDs**: Format as "act_XXXXXXXXX"
2. **Date presets**: "yesterday", "last_7d", "last_14d", "last_30d", "this_month", "last_month"
3. **Key metrics**: 'spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'reach', 'frequency'
4. **Breakdowns**: 'age', 'gender', 'country', 'device_platform'
5. **Status filters**: ['ACTIVE', 'PAUSED', 'DELETED', 'ARCHIVED']

Current user: **${user.name}** (Facebook ID: ${user.facebook_id})
${account ? `🎯 **Current focus**: ${account}` : '🌟 **Multi-account access available**'}

**REMEMBER: Provide clean, professional responses with no technical details visible to the user!**`,
        messages: conversationMessages,
        tools: tools,
        tool_choice: { type: 'auto' }
      });

      console.log('✅ Claude response received');

      // Step 9: Handle tool calls if any
      let finalResponse = '';
      const toolCalls = claudeResponse.content.filter(content => content.type === 'tool_use');
      
      if (toolCalls.length > 0) {
        console.log('Step 9: Processing tool calls...');
        
        // Execute all tool calls
        const toolResults = [];
        for (const toolCall of toolCalls) {
          console.log(`🔧 Tool call: ${toolCall.name}`, toolCall.input);
          
          try {
            const toolResult = await mcpManager.callTool(toolCall.name, toolCall.input);
            console.log('✅ Tool result received');
            
            toolResults.push({
              tool: toolCall.name,
              input: toolCall.input,
              result: toolResult
            });
            
          } catch (toolError) {
            console.error('❌ Tool call failed:', toolError);
            toolResults.push({
              tool: toolCall.name,
              input: toolCall.input,
              error: toolError.message
            });
          }
        }
        
        // Build clean context for final response
        const toolContext = toolResults.map(tr => {
          if (tr.error) {
            return `Error: ${tr.error}`;
          }
          // Extract just the data content, not the full tool result structure
          const result = tr.result;
          if (result && result.content && Array.isArray(result.content)) {
            const textContent = result.content.find(c => c.type === 'text');
            if (textContent && textContent.text) {
              try {
                // Try to parse and clean the JSON
                const parsed = JSON.parse(textContent.text);
                return JSON.stringify(parsed, null, 2);
              } catch {
                return textContent.text;
              }
            }
          }
          return JSON.stringify(result, null, 2);
        }).join('\n\n');
        
        // Get final response from Claude with all tool results
        const followUpResponse = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          system: `You are AdWise. Based on the Facebook Ads data provided, give a clean, professional response.

🚨 **CRITICAL REQUIREMENTS:**
- **NEVER mention tool names, calls, or technical execution details**
- **NEVER show raw JSON data or API responses**
- **ALWAYS provide clean, final answers only**
- **Present data as if you naturally have access to this Facebook Ads data**

🎯 **RESPONSE FORMAT:**
- **Use Markdown formatting** with headers, tables, and bullet points
- **Create clean tables** for performance data and metrics
- **Use emojis** for visual organization and appeal
- **Bold important** numbers and metrics
- **Structure content** with clear sections

📊 **DATA PRESENTATION:**
- Present data in **clean, organized tables**
- Use **currency formatting** (€1,234.56) for spend amounts
- Show **percentages** with 2 decimal places (1.23%)
- Include **insights and analysis** of the data
- Provide **actionable recommendations**

🎯 **USER QUESTION:** "${message}"

**Based on the Facebook Ads data below, provide a helpful analysis and answer:**`,
          messages: [
            ...conversationMessages,
            {
              role: 'assistant',
              content: `Based on your Facebook Ads data:\n\n${toolContext}\n\nLet me provide you with the analysis:`
            }
          ]
        });
        
        finalResponse = followUpResponse.content[0].text;
        
      } else {
        // No tool calls, use direct response
        const textContent = claudeResponse.content.find(content => content.type === 'text');
        finalResponse = textContent ? textContent.text : 'I apologize, but I was unable to process your request.';
      }

      // Clean up
      mcpManager.cleanup();

      return NextResponse.json({
        response: finalResponse
      });

    } catch (mcpError) {
      console.error('❌ MCP Error:', mcpError);
      mcpManager.cleanup();
      
      return NextResponse.json({
        error: 'Failed to process chat request via MCP',
        details: mcpError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Chat API Error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 