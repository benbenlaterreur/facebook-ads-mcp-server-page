const { spawn } = require('child_process');
const path = require('path');

class MCPManager {
  constructor() {
    this.mcpProcess = null;
    this.initialized = false;
    this.requestId = 0;
    this.pendingRequests = new Map();
    this.responseBuffer = '';
  }

  async initializeMCPServer(token) {
    if (this.mcpProcess && this.initialized) {
      console.log('✅ MCP server already initialized');
      return;
    }

    try {
      const serverPath = path.join(process.cwd(), '..', 'server.py');
      console.log(`🔧 Starting MCP server: python3.11 ${serverPath} --fb-token ***`);
      
      this.mcpProcess = spawn('python3.11', [
        serverPath,
        '--fb-token',
        token
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      if (!this.mcpProcess.pid) {
        throw new Error('Failed to start MCP server process');
      }

      console.log(`✅ MCP server process started with PID: ${this.mcpProcess.pid}`);

      // Set up error handling
      this.mcpProcess.on('error', (error) => {
        console.error('❌ MCP server process error:', error);
      });

      this.mcpProcess.stderr.on('data', (data) => {
        const errorOutput = data.toString();
        console.error('📥 MCP server stderr:', errorOutput);
      });

      // Set up stdout data handler
      this.mcpProcess.stdout.on('data', (data) => {
        this.responseBuffer += data.toString();
        this.processResponses();
      });

      // Initialize the MCP protocol
      await this.initializeProtocol();
      
      console.log('✅ MCP server fully initialized and ready');
      
    } catch (error) {
      console.error('❌ Failed to initialize MCP server:', error);
      throw error;
    }
  }

  async initializeProtocol() {
    return new Promise((resolve, reject) => {
      let initTimeout;
      let initCompleted = false;

      const cleanup = () => {
        if (initTimeout) clearTimeout(initTimeout);
      };

      const completeInit = () => {
        if (initCompleted) return;
        initCompleted = true;
        cleanup();
        this.initialized = true;
        console.log('✅ MCP protocol initialization complete');
        resolve();
      };

      const failInit = (error) => {
        if (initCompleted) return;
        initCompleted = true;
        cleanup();
        reject(error);
      };

      // Set timeout for initialization
      initTimeout = setTimeout(() => {
        failInit(new Error('MCP server initialization timeout after 15 seconds'));
      }, 15000);

      try {
        // Step 1: Send initialize request
        console.log('📤 Sending initialize request...');
        const initRequest = {
          jsonrpc: '2.0',
          id: ++this.requestId,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {
              roots: {
                listChanged: true
              }
            },
            clientInfo: {
              name: 'AdWise MCP Client',
              version: '1.0.0'
            }
          }
        };

        // Store the request for response handling
        this.pendingRequests.set(initRequest.id, {
          resolve: (result) => {
            console.log('✅ Received initialize response:', result);
            
            // Step 2: Send initialized notification
            console.log('📤 Sending initialized notification...');
            const initNotification = {
              jsonrpc: '2.0',
              method: 'notifications/initialized'
            };
            
            this.mcpProcess.stdin.write(JSON.stringify(initNotification) + '\n');
            
            // Wait a bit for the server to process the notification
            setTimeout(() => {
              completeInit();
            }, 2000);
          },
          reject: failInit
        });

        this.mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

      } catch (error) {
        failInit(error);
      }
    });
  }

  processResponses() {
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || ''; // Keep the incomplete line

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response = JSON.parse(line);
        console.log('📥 Received MCP response:', JSON.stringify(response));

        if (response.id && this.pendingRequests.has(response.id)) {
          const { resolve, reject } = this.pendingRequests.get(response.id);
          this.pendingRequests.delete(response.id);

          if (response.error) {
            reject(new Error(`MCP Error: ${response.error.message}`));
          } else {
            resolve(response.result);
          }
        }
      } catch (error) {
        console.error('❌ Failed to parse MCP response:', error, 'Raw data:', line);
      }
    }
  }

  async callTool(toolName, args = {}) {
    if (!this.initialized || !this.mcpProcess) {
      throw new Error('MCP server not initialized');
    }

    console.log(`🔧 callTool called with: ${toolName} ${JSON.stringify(args)}`);

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestId;
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('⏰ MCP call timeout after 30 seconds'));
      }, 30000);

      const request = {
        jsonrpc: '2.0',
        id: requestId,
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        }
      };

      this.pendingRequests.set(requestId, {
        resolve: (result) => {
          clearTimeout(timeout);
          console.log('✅ MCP tool result:', JSON.stringify(result));
          resolve(result);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      console.log('📤 Sending MCP request:', JSON.stringify(request));
      this.mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async listAdAccounts() {
    console.log('🔍 Listing ad accounts via MCP...');
    return await this.callTool('list_ad_accounts', {});
  }

  cleanup() {
    if (this.mcpProcess) {
      console.log('🧹 Cleaning up MCP server process...');
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    this.initialized = false;
    this.pendingRequests.clear();
  }
}

module.exports = MCPManager; 