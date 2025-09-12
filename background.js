// Background service worker for ChromeAiAgent
// Import MCP-compliant provider interface
importScripts('mcp-provider-interface.js');

// Initialize MCP components with error handling
let mcpRequestHandler;
let mcpValidator;
let mcpInitialized = false;

try {
  mcpRequestHandler = new MCPRequestHandler();
  mcpValidator = new MCPValidator();
  mcpInitialized = true;
  console.log('[MCP] Components initialized successfully');
} catch (error) {
  console.error('[MCP] Failed to initialize components:', error);
  // Fallback to basic functionality
}

chrome.runtime.onInstalled.addListener(() => {
  if (mcpInitialized) {
    // Use console.log instead of mcpLogger during initialization to avoid connection errors
    console.log('[MCP] ChromeAiAgent installed with MCP compliance');
  } else {
    console.log('ChromeAiAgent installed (basic mode)');
  }
  
  // Enable sidepanel to open on action click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Failed to set panel behavior:', error));
  
  // Initialize default settings
  chrome.storage.sync.get(['aiSettings'], (result) => {
    if (!result.aiSettings) {
      const defaultSettings = {
        provider: 'openai',
        host: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 2048
      };
      
      chrome.storage.sync.set({ aiSettings: defaultSettings });
    }
  });
});

// Chat Logging System
class ChatLogger {
  constructor() {
    this.maxLogs = 1000; // Default max logs stored
    this.storageKey = 'chatLogs';
  }

  async logChatInteraction(data) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        id: this.generateLogId(),
        timestamp,
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        requestPayload: data.requestPayload,
        response: data.response,
        responseTime: data.responseTime,
        success: data.success,
        error: data.error,
        source: data.source // 'popup', 'sidepanel', or 'mcp'
      };

      // Get existing logs
      const result = await chrome.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];

      // Add new log
      logs.unshift(logEntry);

      // Maintain max logs limit
      if (logs.length > this.maxLogs) {
        logs = logs.slice(0, this.maxLogs);
      }

      // Store updated logs
      await chrome.storage.local.set({ [this.storageKey]: logs });
      
      console.log('[ChatLogger] Interaction logged:', {
        id: logEntry.id,
        provider: data.provider,
        model: data.model,
        success: data.success
      });
    } catch (error) {
      console.error('[ChatLogger] Failed to log interaction:', error);
    }
  }

  async getLogs(filters = {}) {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];

      // Apply filters
      if (filters.provider) {
        logs = logs.filter(log => log.provider === filters.provider);
      }
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        logs = logs.filter(log => 
          log.prompt?.toLowerCase().includes(searchLower) ||
          log.response?.toLowerCase().includes(searchLower)
        );
      }

      return logs;
    } catch (error) {
      console.error('[ChatLogger] Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await chrome.storage.local.remove(this.storageKey);
      console.log('[ChatLogger] All logs cleared');
    } catch (error) {
      console.error('[ChatLogger] Failed to clear logs:', error);
    }
  }

  async setMaxLogs(maxLogs) {
    this.maxLogs = maxLogs;
    // Trim existing logs if needed
    const result = await chrome.storage.local.get(this.storageKey);
    let logs = result[this.storageKey] || [];
    
    if (logs.length > maxLogs) {
      logs = logs.slice(0, maxLogs);
      await chrome.storage.local.set({ [this.storageKey]: logs });
    }
  }

  generateLogId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize global chat logger
const chatLogger = new ChatLogger();

// Handle side panel opening (fallback for older Chrome versions)
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle messages from content scripts and side panel with MCP compliance
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    // Only use MCP logging if properly initialized
    if (mcpInitialized && mcpLogger) {
      mcpLogger.debug('Received message', { action: request.action, sender: sender.tab?.url });
    } else {
      console.log('[BG] Received message:', request.action);
    }
    
    // Create MCP request wrapper if available
    let mcpRequest = null;
    if (mcpInitialized && mcpRequestHandler) {
      mcpRequest = mcpRequestHandler.createRequest(request.action, request);
    }
    
    if (request.action === 'sendMessage') {
      // Handle popup mini chat messages
      handlePopupMessage(request, sendResponse);
      return true;
    }
    
    if (request.action === 'sendAIMessage') {
      // Handle side panel chat messages with MCP validation if available
      if (mcpInitialized) {
        handleMCPAIMessage(request.data, sendResponse);
      } else {
        // Fallback to legacy handler
        handleAIMessage(request.data, sendResponse);
      }
      return true;
    }
    
    if (request.action === 'authenticateProvider') {
      authenticateProvider(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'refreshToken') {
      refreshProviderToken(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'getAuthToken') {
      getStoredAuthToken(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'getSettings') {
      chrome.storage.sync.get(['aiSettings'], (result) => {
        sendResponse(result.aiSettings || {});
      });
      return true;
    }
    
    if (request.action === 'saveSettings') {
      chrome.storage.sync.set({ aiSettings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
    
    if (request.action === 'testConnection') {
      testConnection(request.settings, sendResponse);
      return true;
    }
    
    if (request.action === 'fetchModels') {
      fetchAvailableModels(request.settings, sendResponse);
      return true;
    }
    
    if (request.action === 'openSidePanel') {
      // Store the view and page info for the sidebar
      chrome.storage.local.set({
        pendingAction: request.view || 'chat',
        pageInfo: request.pageInfo
      });
      return true;
    }
    
    if (request.action === 'openSettings') {
      // Forward message to side panel
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'showSettings'}).catch(() => {
            // If content script not available, store the request
            chrome.storage.local.set({pendingAction: 'showSettings'});
          });
        }
      });
      return true;
    }

    // Web Session Authentication handlers
    if (request.action === 'captureWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received captureWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received captureWebSession action for provider:', request.provider);
      }
      captureWebSession(request.provider, sendResponse);
      return true;
    }

    if (request.action === 'clearWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received clearWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received clearWebSession action for provider:', request.provider);
      }
      clearWebSession(request.provider, sendResponse);
      return true;
    }

    if (request.action === 'checkWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received checkWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received checkWebSession action for provider:', request.provider);
      }
      checkWebSession(request.provider, sendResponse);
      return true;
    }

    // MCP logging messages
    if (request.action === 'mcpLogMessage') {
      // Handle log messages from MCP components
      mcpLogger.log(request.level, request.message, request.data);
      return true;
    }

    // Chat logging actions
    if (request.action === 'getChatLogs') {
      chatLogger.getLogs(request.filters).then(logs => {
        sendResponse({ success: true, logs });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'clearChatLogs') {
      chatLogger.clearLogs().then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'setChatLogLimit') {
      chatLogger.setMaxLogs(request.maxLogs).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error in message handler', { error: error.message, action: request.action });
    } else {
      console.error('[BG] Error in message handler:', error.message, 'Action:', request.action);
    }
    
    // Send error response
    const errorResponse = {
      success: false,
      error: mcpInitialized ? createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, error.message) : error.message
    };
    sendResponse(errorResponse);
  }
});

// OAuth authentication functions
async function authenticateProvider(provider, sendResponse) {
  try {
    const authConfig = getOAuthConfig(provider);
    if (!authConfig) {
      sendResponse({ success: false, error: `OAuth not supported for ${provider}` });
      return;
    }

    if (provider === 'google') {
      // Use Chrome Identity API for Google
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        // Store the token
        chrome.storage.sync.set({ 
          [`${provider}_auth_token`]: token,
          [`${provider}_auth_method`]: 'oauth'
        }, () => {
          sendResponse({ success: true, token: token });
        });
      });
    } else {
      // Use launchWebAuthFlow for other providers
      const authUrl = buildAuthUrl(provider, authConfig);
      
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, (redirectUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        const token = extractTokenFromUrl(redirectUrl, provider);
        if (token) {
          // Store the token
          chrome.storage.sync.set({ 
            [`${provider}_auth_token`]: token,
            [`${provider}_auth_method`]: 'oauth'
          }, () => {
            sendResponse({ success: true, token: token });
          });
        } else {
          sendResponse({ success: false, error: 'Failed to extract token from redirect' });
        }
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function getOAuthConfig(provider) {
  const configs = {
    github: {
      authUrl: 'https://github.com/login/oauth/authorize',
      clientId: 'your-github-client-id', // Users need to configure this
      scope: 'read:user',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },
    google: {
      // Handled by Chrome Identity API
      scope: 'https://www.googleapis.com/auth/userinfo.email'
    },
    openai: {
      authUrl: 'https://platform.openai.com/oauth/authorize',
      clientId: 'your-openai-client-id', // Users need to configure this
      scope: 'api.read api.write',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },
    /*anthropic: {
      authUrl: 'https://console.anthropic.com/oauth/authorize',
      clientId: 'your-anthropic-client-id', // Users need to configure this
      scope: 'api.read api.write',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },*/
    claude: {
      // Claude.ai web interface - uses session-based authentication
      authUrl: 'https://claude.ai/login',
      requiresSession: true
    },
    gemini: {
      // Use Google OAuth via Chrome Identity API
      scope: 'https://www.googleapis.com/auth/generative-language'
    }
  };
  
  return configs[provider];
}

function buildAuthUrl(provider, config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: `${provider}_${Date.now()}`
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

function extractTokenFromUrl(redirectUrl, provider) {
  try {
    const url = new URL(redirectUrl);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (code) {
      // For simplicity, returning the code as token
      // In production, you'd exchange this for an access token
      return code;
    }
    
    // Try to get token from fragment (implicit flow)
    const hash = url.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    return hashParams.get('access_token');
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
}

async function refreshProviderToken(provider, sendResponse) {
  try {
    const result = await chrome.storage.sync.get([`${provider}_auth_token`, `${provider}_refresh_token`]);
    const refreshToken = result[`${provider}_refresh_token`];
    
    if (!refreshToken) {
      sendResponse({ success: false, error: 'No refresh token available' });
      return;
    }
    
    // Implementation would depend on each provider's refresh flow
    sendResponse({ success: false, error: 'Token refresh not implemented yet' });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function getStoredAuthToken(provider, sendResponse) {
  try {
    const result = await chrome.storage.sync.get([
      `${provider}_auth_token`, 
      `${provider}_auth_method`
    ]);
    
    sendResponse({ 
      success: true, 
      token: result[`${provider}_auth_token`],
      method: result[`${provider}_auth_method`] || 'api_key'
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// MCP-compliant provider configuration function (replaces getProviderConfig)
function getProviderConfig(provider) {
  // Legacy wrapper for MCP configuration
  const mcpConfig = getMCPProviderConfig(provider);
  if (!mcpConfig) {
    mcpLogger.error('Unsupported provider requested', { provider });
    return null;
  }
  
  // Convert MCP config to legacy format for backwards compatibility
  const legacyConfig = {
    host: mcpConfig.endpoints.chat,
    requiresApiKey: mcpConfig.authentication.methods.includes('api_key')
  };
  
  mcpLogger.debug('Retrieved provider config (legacy format)', { provider, legacyConfig });
  return legacyConfig;
}

function getMCPProviderConfiguration(provider) {
  const config = getMCPProviderConfig(provider);
  if (!config) {
    mcpLogger.error('Unsupported MCP provider requested', { provider });
    return null;
  }
  
  mcpLogger.debug('Retrieved MCP provider config', { provider, config: config.name });
  return config;
}

async function handlePopupMessage(request, sendResponse) {
  const startTime = Date.now();
  
  // Console logging for chat interaction
  console.log('🚀 === POPUP CHAT REQUEST ===');
  console.log('📝 Prompt:', request.message);
  console.log('🔧 Provider:', request.provider);
  console.log('🤖 Model:', request.model);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: request.message,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'popup'
  };

  try {
    // Get current settings or use the provided ones
    const savedSettings = await getStoredSettings();
    const provider = request.provider || savedSettings.provider || 'openai';
    const model = request.model || savedSettings.model;
    
    // Update log data
    logData.provider = provider;
    logData.model = model;
    
    if (!model) {
      sendResponse({ 
        success: false,
        error: 'Model not specified' 
      });
      return;
    }
    
    // Check for OAuth token first
    const authData = await chrome.storage.sync.get([
      `${provider}_auth_token`, 
      `${provider}_auth_method`
    ]);
    
    const hasOAuthToken = authData[`${provider}_auth_method`] === 'oauth' && authData[`${provider}_auth_token`];
    
    // Get provider configuration
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      sendResponse({ 
        success: false,
        error: `Unsupported provider: ${provider}` 
      });
      return;
    }
    
    // Check API key requirement
    if (providerConfig.requiresApiKey && !savedSettings.apiKey && !hasOAuthToken) {
      sendResponse({ 
        success: false,
        error: `API key or OAuth authentication required for ${provider}` 
      });
      return;
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use OAuth token if available, otherwise fall back to API key
    if (hasOAuthToken) {
      const oauthToken = authData[`${provider}_auth_token`];
      if (provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
    } else if (savedSettings.apiKey && savedSettings.apiKey !== 'local-no-key-required') {
      if (provider === 'azure') {
        headers['api-key'] = savedSettings.apiKey;
      } else if (provider === 'anthropic') {
        headers['x-api-key'] = savedSettings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = savedSettings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${savedSettings.apiKey}`;
      }
    }
    
    // Prepare messages with page context
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. The user is currently on the page: "${request.pageContext?.title || 'Unknown'}" (${request.pageContext?.url || 'Unknown URL'})`
      },
      {
        role: 'user',
        content: request.message
      }
    ];
    
    let host = providerConfig.host || savedSettings.host;
    
    // Prepare request body based on provider
    let requestBody;
    if (provider === 'anthropic') {
      // Anthropic uses a different message format
      requestBody = {
        model: model,
        max_tokens: 500,
        messages: messages.filter(msg => msg.role !== 'system'), // Remove system message for now
        system: messages.find(msg => msg.role === 'system')?.content || ''
      };
    } else if (provider === 'gemini') {
      // Gemini uses a different API format
      host = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      
      // For Gemini, we need to combine system message with user messages
      let combinedText = '';
      
      // Add system message first if it exists
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedText += systemMessage.content + '\n\n';
      }
      
      // Add user messages
      const userMessages = messages.filter(msg => msg.role === 'user');
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };
    } else if (provider === 'claude') {
      // Claude.ai web interface approach
      // Note: This is a simplified approach - actual implementation would need
      // to handle Claude.ai's web interface authentication and messaging
      sendResponse({ 
        success: false,
        error: 'Claude.ai web interface integration is experimental. Please try the API-based access through the settings page.'
      });
      return;
    } else {
      // Standard OpenAI-compatible format
      requestBody = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      };
    }
    
    // Update log data with request payload
    logData.requestPayload = {
      host,
      method: 'POST',
      headers: { ...headers },
      body: requestBody
    };
    
    // Console log the request payload
    console.log('📤 Request URL:', host);
    console.log('📤 Request Headers:', headers);
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const responseTime = Date.now() - startTime;
      
      // Log error
      logData.responseTime = responseTime;
      logData.error = `API Error ${response.status}: ${errorData}`;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ 
        success: false,
        error: `API Error ${response.status}: ${errorData}` 
      });
      return;
    }
    
    const data = await response.json();
    console.log('📥 Raw API Response:', JSON.stringify(data, null, 2));
    
    let aiResponse;
    
    if (provider === 'anthropic') {
      // Anthropic response format
      aiResponse = data.content?.[0]?.text || 'No response received';
    } else if (provider === 'gemini') {
      // Gemini response format
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
    } else {
      // Standard OpenAI-compatible format
      aiResponse = data.choices?.[0]?.message?.content || 'No response received';
    }
    
    const responseTime = Date.now() - startTime;
    
    // Console log the processed response
    console.log('💬 AI Response:', aiResponse);
    console.log('⏱️ Response Time:', responseTime + 'ms');
    console.log('✅ === POPUP CHAT COMPLETE ===\n');
    
    // Log successful interaction
    logData.response = aiResponse;
    logData.responseTime = responseTime;
    logData.success = true;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      success: true,
      response: aiResponse 
    });
    
  } catch (error) {
    console.error('❌ === POPUP CHAT ERROR ===');
    console.error('💥 Error:', error.message);
    console.error('🔍 Full Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log('⏱️ Error Response Time:', responseTime + 'ms');
    console.log('❌ === POPUP CHAT ERROR END ===\n');
    
    // Log error
    logData.responseTime = responseTime;
    logData.error = error.message;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      success: false,
      error: error.message 
    });
  }
}

// MCP-compliant AI message handler
async function handleMCPAIMessage(messageData, sendResponse) {
  const requestId = mcpRequestHandler.generateRequestId();
  const startTime = Date.now();
  
  // Console logging for MCP chat interaction
  console.log('🔧 === MCP CHAT REQUEST ===');
  console.log('🆔 Request ID:', requestId);
  console.log('📝 Messages:', messageData.messages);
  console.log('🔧 Provider:', messageData.provider);
  console.log('🤖 Model:', messageData.model);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: null,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'mcp'
  };
  
  try {
    mcpLogger.info('Processing MCP AI message', { requestId, provider: messageData.provider });
    
    const settings = await getStoredSettings();
    const provider = messageData.provider || settings.provider;
    
    // Update log data
    logData.provider = provider;
    logData.model = messageData.model || settings.model;
    logData.prompt = messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n') || 'Unknown prompt';
    
    // Get MCP provider configuration
    const mcpConfig = getMCPProviderConfiguration(provider);
    if (!mcpConfig) {
      const error = createMCPError(
        MCP_ERROR_CODES.INVALID_PARAMS, 
        `Unsupported provider: ${provider}`
      );
      sendResponse(mcpRequestHandler.createResponse(requestId, null, error));
      return;
    }
    
    // Validate authentication
    try {
      const authData = await getAuthenticationData(provider, settings);
      MCPValidator.validateAuthenticationData(authData, provider);
    } catch (authError) {
      mcpLogger.error('Authentication validation failed', { provider, error: authError.message });
      sendResponse(mcpRequestHandler.createResponse(requestId, null, authError));
      return;
    }
    
    // Check authentication method
    const authMode = settings.authMode || 'api';
    
    if (authMode === 'web') {
      // Use web session authentication
      return await handleWebSessionMessage(messageData, sendResponse, settings);
    }
    
    // Prepare chat request with MCP validation
    const chatRequest = {
      model: messageData.model || settings.model,
      messages: messageData.messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: messageData.stream || false
    };
    
    // Validate input with MCP validator
    try {
      MCPValidator.validateChatRequest(chatRequest, mcpConfig);
    } catch (validationError) {
      mcpLogger.error('Input validation failed', { provider, error: validationError.message });
      sendResponse(mcpRequestHandler.createResponse(requestId, null, validationError));
      return;
    }
    
    // Get authentication headers
    const headers = await buildAuthenticationHeaders(provider, settings);
    
    // Format request body based on provider message format
    let requestBody;
    let endpoint = mcpConfig.endpoints.chat;
    
    if (mcpConfig.messageFormat === 'anthropic') {
      // Anthropic uses a different message format
      requestBody = {
        model: chatRequest.model,
        max_tokens: chatRequest.max_tokens,
        messages: chatRequest.messages.filter(msg => msg.role !== 'system'),
        system: chatRequest.messages.find(msg => msg.role === 'system')?.content || ''
      };
    } else if (mcpConfig.messageFormat === 'gemini') {
      // Gemini uses a different API format
      endpoint = endpoint.replace('{model}', chatRequest.model);
      
      // Combine system message with user messages for Gemini
      const systemMessage = chatRequest.messages.find(msg => msg.role === 'system');
      const userMessages = chatRequest.messages.filter(msg => msg.role === 'user');
      
      let combinedText = '';
      if (systemMessage) {
        combinedText = systemMessage.content + '\n\n';
      }
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: chatRequest.temperature,
          maxOutputTokens: chatRequest.max_tokens
        }
      };
    } else {
      // Standard OpenAI-compatible format
      requestBody = chatRequest;
    }
    
    // Console log the MCP request payload
    console.log('📤 MCP Request Endpoint:', endpoint);
    console.log('📤 MCP Request Headers:', headers);
    console.log('📤 MCP Request Body:', JSON.stringify(requestBody, null, 2));
    
    // Handle custom endpoints
    if (endpoint.includes('{host}')) {
      endpoint = endpoint.replace('{host}', settings.host || mcpConfig.endpoints.chat);
    }
    
    mcpLogger.debug('Making API request', { 
      provider, 
      endpoint, 
      model: chatRequest.model,
      messageCount: chatRequest.messages.length 
    });
    
    // Update log data with request payload
    logData.requestPayload = {
      endpoint,
      method: 'POST',
      headers: { ...headers },
      body: requestBody
    };
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      const responseTime = Date.now() - startTime;
      
      // Log error
      logData.responseTime = responseTime;
      logData.error = `API request failed: ${response.status} ${response.statusText}`;
      await chatLogger.logChatInteraction(logData);
      
      const error = createMCPError(
        MCP_ERROR_CODES.PROVIDER_ERROR,
        `API request failed: ${response.status} ${response.statusText}`,
        { status: response.status, message: errorText }
      );
      mcpLogger.error('API request failed', { provider, status: response.status, error: errorText });
      sendResponse(mcpRequestHandler.createResponse(requestId, null, error));
      return;
    }
    
    const responseData = await response.json();
    console.log('📥 MCP Raw API Response:', JSON.stringify(responseData, null, 2));
    
    // Format response based on provider
    let formattedResponse;
    if (mcpConfig.messageFormat === 'anthropic') {
      formattedResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: responseData.content[0]?.text || ''
          }
        }]
      };
    } else if (mcpConfig.messageFormat === 'gemini') {
      formattedResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: responseData.candidates[0]?.content?.parts[0]?.text || ''
          }
        }]
      };
    } else {
      // Standard OpenAI format
      formattedResponse = responseData;
    }
    
    const responseTime = Date.now() - startTime;
    
    // Console log the processed MCP response
    console.log('💬 MCP AI Response:', formattedResponse.choices?.[0]?.message?.content);
    console.log('⏱️ MCP Response Time:', responseTime + 'ms');
    console.log('✅ === MCP CHAT COMPLETE ===\n');
    
    // Log successful interaction
    logData.response = formattedResponse.choices?.[0]?.message?.content || 'No response content';
    logData.responseTime = responseTime;
    logData.success = true;
    await chatLogger.logChatInteraction(logData);
    
    mcpLogger.info('AI request completed successfully', { 
      provider, 
      model: chatRequest.model,
      responseLength: formattedResponse.choices?.[0]?.message?.content?.length || 0
    });
    
    sendResponse(mcpRequestHandler.createResponse(requestId, formattedResponse));
    
  } catch (error) {
    console.error('❌ === MCP CHAT ERROR ===');
    console.error('💥 MCP Error:', error.message);
    console.error('🔍 MCP Full Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log('⏱️ MCP Error Response Time:', responseTime + 'ms');
    console.log('❌ === MCP CHAT ERROR END ===\n');
    
    // Log error
    logData.responseTime = responseTime;
    logData.error = `Internal error: ${error.message}`;
    await chatLogger.logChatInteraction(logData);
    
    mcpLogger.error('Error in MCP AI message handler', { 
      requestId, 
      error: error.message, 
      stack: error.stack 
    });
    
    const mcpError = createMCPError(
      MCP_ERROR_CODES.INTERNAL_ERROR,
      `Internal error: ${error.message}`,
      { originalError: error.message }
    );
    
    sendResponse(mcpRequestHandler.createResponse(requestId, null, mcpError));
  }
}

// Helper function to get authentication data
async function getAuthenticationData(provider, settings) {
  const authData = await chrome.storage.sync.get([
    `${provider}_auth_token`, 
    `${provider}_auth_method`
  ]);
  
  return {
    apiKey: settings.apiKey,
    oauthToken: authData[`${provider}_auth_token`],
    authMethod: authData[`${provider}_auth_method`],
    webSession: settings.authMode === 'web'
  };
}

// Helper function to build authentication headers
async function buildAuthenticationHeaders(provider, settings) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Check for OAuth token first
  const authData = await chrome.storage.sync.get([
    `${provider}_auth_token`, 
    `${provider}_auth_method`
  ]);
  
  const hasOAuthToken = authData[`${provider}_auth_method`] === 'oauth' && authData[`${provider}_auth_token`];
  
  // Use OAuth token if available, otherwise fall back to API key
  if (hasOAuthToken) {
    const oauthToken = authData[`${provider}_auth_token`];
    if (provider === 'azure') {
      headers['api-key'] = oauthToken;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = oauthToken;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
      headers['x-goog-api-key'] = oauthToken;
    } else {
      headers['Authorization'] = `Bearer ${oauthToken}`;
    }
  } else if (settings.apiKey && settings.apiKey !== 'local-no-key-required') {
    if (provider === 'azure') {
      headers['api-key'] = settings.apiKey;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = settings.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
      headers['x-goog-api-key'] = settings.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }
  }
  
  return headers;
}

async function handleAIMessage(messageData, sendResponse) {
  const startTime = Date.now();
  
  // Console logging for sidepanel chat interaction
  console.log('🎯 === SIDEPANEL CHAT REQUEST ===');
  console.log('📝 Messages:', messageData.messages);
  console.log('💬 Prompt:', messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n'));
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: null,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'sidepanel'
  };

  try {
    const settings = await getStoredSettings();
    
    // Update log data
    logData.provider = settings.provider;
    logData.model = settings.model;
    logData.prompt = messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n') || 'Unknown prompt';
    
    // Check authentication method
    const authMode = settings.authMode || 'api';
    
    if (authMode === 'web') {
      // Use web session authentication
      return await handleWebSessionMessage(messageData, sendResponse, settings);
    }
    
    // Continue with existing API/OAuth authentication
    // Check for OAuth token first
    const authData = await chrome.storage.sync.get([
      `${settings.provider}_auth_token`, 
      `${settings.provider}_auth_method`
    ]);
    
    const hasOAuthToken = authData[`${settings.provider}_auth_method`] === 'oauth' && authData[`${settings.provider}_auth_token`];
    
    if (!settings.apiKey && !hasOAuthToken && settings.provider !== 'local' && settings.provider !== 'custom') {
      sendResponse({ 
        error: 'API key or OAuth authentication required. Please set up your AI provider in settings.' 
      });
      return;
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use OAuth token if available, otherwise fall back to API key
    if (hasOAuthToken) {
      const oauthToken = authData[`${settings.provider}_auth_token`];
      if (settings.provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
    } else if (settings.apiKey && settings.apiKey !== 'local-no-key-required') {
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
    }
    
    // Prepare request body based on provider
    let requestBody;
    let host = settings.host;
    
    if (settings.provider === 'anthropic') {
      // Anthropic uses a different message format
      requestBody = {
        model: settings.model,
        max_tokens: settings.maxTokens,
        messages: messageData.messages.filter(msg => msg.role !== 'system'),
        system: messageData.messages.find(msg => msg.role === 'system')?.content || ''
      };
    } else if (settings.provider === 'gemini') {
      // Gemini uses a different API format
      host = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`;
      
      // For Gemini, we need to combine system message with user messages
      let combinedText = '';
      
      // Add system message first if it exists
      const systemMessage = messageData.messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedText += systemMessage.content + '\n\n';
      }
      
      // Add user messages
      const userMessages = messageData.messages.filter(msg => msg.role === 'user');
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens
        }
      };
    } else if (settings.provider === 'claude.ai') {
      // Claude.ai experimental web interface
      sendResponse({ 
        error: 'Claude.ai provider is experimental and requires web interface integration. Please use the Anthropic provider instead for API access.' 
      });
      return;
    } else {
      // Standard OpenAI-compatible format
      requestBody = {
        model: settings.model,
        messages: messageData.messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: messageData.stream || false
      };
    }
    
    // Update log data with request payload
    logData.requestPayload = {
      host,
      method: 'POST',
      headers: { ...headers },
      body: requestBody
    };
    
    // Console log the sidepanel request payload
    console.log('🔧 Provider:', settings.provider);
    console.log('🤖 Model:', settings.model);
    console.log('📤 Sidepanel Request URL:', host);
    console.log('📤 Sidepanel Request Headers:', headers);
    console.log('📤 Sidepanel Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const responseTime = Date.now() - startTime;
      
      // Log error
      logData.responseTime = responseTime;
      logData.error = `API Error ${response.status}: ${errorData}`;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ 
        error: `API Error ${response.status}: ${errorData}` 
      });
      return;
    }
    
    if (messageData.stream) {
      // Handle streaming response
      console.log('📡 Starting streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let responseText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                responseText += content;
                // Send partial response
                chrome.runtime.sendMessage({
                  action: 'streamChunk',
                  content: content,
                  fullText: responseText
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      // Console log the streaming response completion
      console.log('💬 Sidepanel Streaming Response Complete:', responseText);
      console.log('⏱️ Sidepanel Streaming Response Time:', responseTime + 'ms');
      console.log('✅ === SIDEPANEL STREAMING CHAT COMPLETE ===\n');
      
      // Log streaming response
      logData.response = responseText;
      logData.responseTime = responseTime;
      logData.success = true;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ content: responseText, streaming: true });
    } else {
      // Handle regular response
      const data = await response.json();
      console.log('📥 Sidepanel Raw API Response:', JSON.stringify(data, null, 2));
      
      let content;
      
      if (settings.provider === 'anthropic') {
        // Anthropic response format
        content = data.content?.[0]?.text || 'No response received';
      } else if (settings.provider === 'gemini') {
        // Gemini response format
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
      } else if (settings.provider === 'claude.ai') {
        // Claude.ai experimental - should not reach here
        content = 'Claude.ai experimental provider not implemented';
      } else {
        // Standard OpenAI-compatible format
        content = data.choices?.[0]?.message?.content || 'No response received';
      }
      
      const responseTime = Date.now() - startTime;
      
      // Console log the processed sidepanel response
      console.log('💬 Sidepanel AI Response:', content);
      console.log('⏱️ Sidepanel Response Time:', responseTime + 'ms');
      console.log('📤 Sending response object:', { content });
      console.log('✅ === SIDEPANEL CHAT COMPLETE ===\n');
      
      // Log regular response
      logData.response = content;
      logData.responseTime = responseTime;
      logData.success = true;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ content });
    }
    
  } catch (error) {
    console.error('❌ === SIDEPANEL CHAT ERROR ===');
    console.error('💥 Sidepanel Error:', error.message);
    console.error('🔍 Sidepanel Full Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log('⏱️ Sidepanel Error Response Time:', responseTime + 'ms');
    console.log('❌ === SIDEPANEL CHAT ERROR END ===\n');
    
    // Log error
    logData.responseTime = responseTime;
    logData.error = `Network error: ${error.message}`;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      error: `Network error: ${error.message}` 
    });
  }
}

async function testConnection(settings, sendResponse) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only if API key is provided and not local
    if (settings.apiKey && settings.apiKey !== 'local-no-key-required') {
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
    }
    
    const response = await fetch(settings.host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });
    
    if (response.ok || response.status === 400) {
      // 400 is also acceptable as it means the endpoint is reachable
      sendResponse({ status: 'Connected', success: true });
    } else {
      sendResponse({ 
        status: `Error ${response.status}`, 
        success: false,
        message: await response.text()
      });
    }
  } catch (error) {
    sendResponse({ 
      status: 'Connection Failed', 
      success: false,
      message: error.message 
    });
  }
}

function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aiSettings'], (result) => {
      resolve(result.aiSettings || {});
    });
  });
}

async function fetchAvailableModels(settings, sendResponse) {
  console.log('fetchAvailableModels called with settings:', settings);
  try {
    // Special handling for local providers - check multiple endpoints
    if (settings.provider === 'local') {
      console.log('Fetching local models...');
      const localModels = await fetchLocalModels(settings.host);
      const result = {
        success: true,
        models: localModels,
        source: 'local-scan'
      };
      console.log('Sending local models result:', result);
      sendResponse(result);
      return;
    }

    // Always try to fetch from API first, regardless of API key presence
    let modelsUrl = getModelsEndpoint(settings.provider, settings.host);
    if (!modelsUrl) {
      console.log('No models endpoint for provider:', settings.provider);
      const result = {
        success: false,
        error: 'Models endpoint not available for this provider',
        models: []
      };
      console.log('Sending no-endpoint result:', result);
      sendResponse(result);
      return;
    }

    // Special handling for Gemini API - now uses x-goog-api-key header (official method)
    // First check if we have an API key
    const hasApiKey = settings.apiKey && settings.apiKey.trim() !== '' && settings.apiKey !== 'local-no-key-required';

    // Check authentication - consider both API key and OAuth/web session
    const authData = await chrome.storage.sync.get([
      `${settings.provider}_auth_token`, 
      `${settings.provider}_auth_method`,
      'aiSettings'
    ]);
    
    // Also check if web session exists
    const webSessionKey = `webSession_${settings.provider}`;
    const webSessionResult = await chrome.storage.local.get(webSessionKey);
    const hasWebSessionData = !!webSessionResult[webSessionKey];
    
    const hasOAuthToken = authData[`${settings.provider}_auth_method`] === 'oauth' && authData[`${settings.provider}_auth_token`];
    const hasWebSession = settings.authMode === 'web' && hasWebSessionData;
    
    console.log('Authentication check:', {
      provider: settings.provider,
      hasApiKey,
      hasOAuthToken,
      hasWebSession,
      hasWebSessionData,
      authMode: settings.authMode,
      apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
      webSessionKey
    });

    // For providers that require authentication for live model fetching
    if (!hasApiKey && !hasOAuthToken && settings.provider !== 'local') {
      console.log('No API authentication available for:', settings.provider);
      
      // Special message for web-only providers
      if (settings.provider === 'claude.ai') {
        const result = {
          success: false, 
          error: 'Claude.ai is web-interface only. No models API available. Use the web interface directly.',
          models: []
        };
        sendResponse(result);
        return;
      }
      
      // For all other providers, require API key for both model fetching and API communication
      const result = {
        success: false,
        error: `API key required. Without authentication, cannot fetch models or send requests to ${settings.provider}.`,
        models: []
      };
      console.log('Sending no-auth result:', result);
      sendResponse(result);
      return;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header based on available authentication
    if (hasOAuthToken) {
      // Use OAuth token first if available
      const oauthToken = authData[`${settings.provider}_auth_token`];
      if (settings.provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
      console.log('Using OAuth authentication for models fetch');
    } else if (hasApiKey) {
      // Fall back to API key
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
      console.log('Using API key authentication for models fetch');
    }

    console.log(`Fetching models from ${modelsUrl} for provider ${settings.provider}`);
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      console.log(`Models API returned ${response.status}: ${response.statusText}`);
      
      // Provide helpful error messages for common authentication issues
      let errorMessage = `API returned ${response.status}: ${response.statusText}`;
      
      if (response.status === 401) {
        if (settings.provider === 'openai' && settings.apiKey && settings.apiKey.startsWith('AIza')) {
          errorMessage = 'Invalid API key: You are using a Google API key for OpenAI. Please get an OpenAI API key from platform.openai.com';
        } else if (settings.provider === 'gemini' && settings.apiKey && settings.apiKey.startsWith('sk-')) {
          errorMessage = 'Invalid API key: You are using an OpenAI API key for Gemini. Please get a Google AI API key from aistudio.google.com';
        } else {
          errorMessage = `Authentication failed: Invalid API key for ${settings.provider}`;
        }
      } else if (response.status === 403) {
        errorMessage = `Access denied: API key may not have permission to list models for ${settings.provider}`;
      }
      
      const result = {
        success: false,
        error: errorMessage,
        models: []
      };
      console.log('Sending API error result:', result);
      sendResponse(result);
      return;
    }

    const data = await response.json();
    console.log('API response data:', data);
    const models = parseModelsResponse(data, settings.provider);
    console.log('Parsed models:', models);

    if (models.length === 0) {
      const result = {
        success: false,
        error: 'No models found in API response',
        models: []
      };
      console.log('Sending no-models result:', result);
      sendResponse(result);
      return;
    }

    const result = {
      success: true,
      models: models,
      source: 'api'
    };
    console.log('Sending API models result:', result);
    sendResponse(result);

  } catch (error) {
    console.error('Error fetching models:', error);
    const result = {
      success: false,
      error: error.message,
      models: []
    };
    console.log('Sending error result:', result);
    sendResponse(result);
  }
}

// Fetch locally installed models from various AI servers
async function fetchLocalModels(customHost) {
  const localEndpoints = [
    // User-specified host first
    customHost ? `${customHost}/v1/models` : null,
    customHost ? `${customHost}/api/tags` : null,
    // Ollama default
    'http://localhost:11434/api/tags',
    // LM Studio default
    'http://localhost:1234/v1/models',
    // Text-generation-webui default
    'http://localhost:7860/v1/models',
    // LocalAI default
    'http://localhost:8080/v1/models',
    // Oobabooga default
    'http://localhost:5000/v1/models',
    // KoboldCpp default
    'http://localhost:5001/v1/models',
    // Jan.ai default
    'http://localhost:1337/v1/models',
    // GPT4All default
    'http://localhost:4891/v1/models'
  ].filter(Boolean);

  const allModels = [];
  
  for (const endpoint of localEndpoints) {
    try {
      console.log(`Checking local endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        let models = [];
        
        // Parse different response formats
        if (endpoint.includes('/api/tags')) {
          // Ollama format
          if (data.models && Array.isArray(data.models)) {
            models = data.models.map(m => m.name || m.model || m).filter(Boolean);
          }
        } else {
          // OpenAI-compatible format
          if (data.data && Array.isArray(data.data)) {
            models = data.data.map(m => m.id || m.model || m.name).filter(Boolean);
          } else if (Array.isArray(data)) {
            models = data.map(m => m.id || m.model || m.name || m).filter(Boolean);
          }
        }
        
        if (models.length > 0) {
          console.log(`Found ${models.length} models at ${endpoint}:`, models);
          allModels.push(...models);
        }
      }
    } catch (error) {
      // Silently ignore connection errors for local endpoints
      console.log(`Local endpoint ${endpoint} not available:`, error.message);
    }
  }

  // Remove duplicates and sort
  const uniqueModels = [...new Set(allModels)].sort();
  console.log(`Total unique local models found: ${uniqueModels.length}`, uniqueModels);
  
  return uniqueModels;
}

function getModelsEndpoint(provider, host) {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/models';
    case 'github':
      return 'https://models.inference.ai.azure.com/models';
    case 'groq':
      return 'https://api.groq.com/openai/v1/models';
    case 'deepseek':
      return 'https://api.deepseek.com/v1/models';
    case 'perplexity':
      return 'https://api.perplexity.ai/models';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/models';
    case 'claude.ai':
      // Claude.ai doesn't have a public models endpoint
      // We'll return null to trigger an error
      return null;
    case 'gemini':
      // Gemini API uses x-goog-api-key header (official method)
      return 'https://generativelanguage.googleapis.com/v1beta/models';
    case 'azure':
      // Azure doesn't have a standard models endpoint, use default models
      return null;
    case 'local':
      // Try common local AI server endpoints
      return host ? `${host}/v1/models` : 'http://localhost:11434/api/tags';
    case 'custom':
      return host ? `${host}/v1/models` : null;
    default:
      return null;
  }
}

function parseModelsResponse(data, provider) {
  let models = [];

  // Handle different response formats per provider
  switch (provider) {
    case 'openai':
    case 'groq':
    case 'deepseek':
      // Standard OpenAI-compatible format
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id).filter(id => id);
      }
      break;

    case 'github':
      // GitHub Models API format
      if (Array.isArray(data)) {
        models = data.map(model => model.name || model.id).filter(id => id);
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.name || model.id).filter(id => id);
      }
      break;

    case 'perplexity':
      // Perplexity API format
      if (Array.isArray(data)) {
        models = data.map(model => model.id || model.name || model).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name || model).filter(id => id);
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      }
      break;

    case 'claude.ai':
      // Claude.ai: try to parse any potential API response
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name).filter(id => id);
      }
      break;

    case 'gemini':
      // Gemini API format - returns models with 'name' field
      if (data.models && Array.isArray(data.models)) {
        models = data.models
          .map(model => model.name || model.id)
          .filter(name => name && name.includes('gemini'))
          .map(name => name.replace('models/', '')); // Remove 'models/' prefix
      } else if (Array.isArray(data)) {
        models = data
          .map(model => model.name || model.id)
          .filter(name => name && name.includes('gemini'))
          .map(name => name.replace('models/', ''));
      }
      break;

    default:
      // Fallback: try multiple common formats
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name || model).filter(id => id);
      } else if (Array.isArray(data)) {
        models = data.map(model => model.id || model.name || model).filter(id => id);
      }
      break;
  }

  // Sort models
  models = models.sort();

  // Apply minimal filtering to remove obviously non-chat models
  switch (provider) {
    case 'openai':
      // Remove embeddings, audio, and vision-only models
      models = models.filter(id => 
        !id.includes('embedding') && 
        !id.includes('whisper') && 
        !id.includes('dall-e') &&
        !id.includes('tts') &&
        !id.includes('vision')
      );
      break;
    case 'github':
      // Remove embeddings, audio models
      models = models.filter(id => 
        !id.includes('embedding') && 
        !id.includes('whisper') &&
        !id.includes('dall-e') &&
        !id.includes('tts')
      );
      break;
    case 'groq':
      // Remove whisper and other non-chat models
      models = models.filter(id => 
        !id.includes('whisper') &&
        !id.includes('embedding')
      );
      break;
    case 'deepseek':
    case 'perplexity':
    case 'claude.ai':
    case 'gemini':
      // Keep all models for these providers
      break;
  }

  return models;
}

// Web Session Authentication Functions
// Legacy web session configuration for fallback when MCP is not available
function getLegacyWebSessionConfig(provider) {
  const configs = {
    'openai': {
      tabPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*'],
      domains: ['.openai.com', 'chat.openai.com', '.chatgpt.com', 'chatgpt.com'],
      authCookies: ['__Secure-next-auth.session-token', '_cfuvid', 'cf_clearance', '__cflb'],
      displayDomain: 'chat.openai.com'
    },
    'claude.ai': {
      tabPatterns: ['*://claude.ai/*'],
      domains: ['.claude.ai', 'claude.ai'],
      authCookies: ['sessionKey', 'auth-token', '_cfuvid', 'cf_clearance'],
      displayDomain: 'claude.ai'
    },
    'gemini': {
      tabPatterns: ['*://gemini.google.com/*', '*://aistudio.google.com/*'],
      domains: ['.google.com', 'gemini.google.com', '.aistudio.google.com'],
      authCookies: ['__Secure-1PSID', '__Secure-3PSID', 'SAPISID', 'HSID', 'SSID', '1P_JAR'],
      displayDomain: 'gemini.google.com'
    },
    'github': {
      tabPatterns: ['*://github.com/*'],
      domains: ['.github.com', 'github.com'],
      authCookies: ['user_session', '_gh_sess', '__Host-user_session_same_site'],
      displayDomain: 'github.com'
    },
    'groq': {
      tabPatterns: ['*://groq.com/*', '*://console.groq.com/*'],
      domains: ['.groq.com', 'groq.com', 'console.groq.com'],
      authCookies: ['session', 'auth_token', '_cfuvid'],
      displayDomain: 'console.groq.com'
    },
    'deepseek': {
      tabPatterns: ['*://chat.deepseek.com/*'],
      domains: ['.deepseek.com', 'chat.deepseek.com'],
      authCookies: ['session', 'token', '_cfuvid'],
      displayDomain: 'chat.deepseek.com'
    },
    'perplexity': {
      tabPatterns: ['*://www.perplexity.ai/*', '*://perplexity.ai/*'],
      domains: ['.perplexity.ai', 'www.perplexity.ai', 'perplexity.ai'],
      authCookies: ['session', 'auth_token', '_cfuvid'],
      displayDomain: 'www.perplexity.ai'
    }
  };
  
  return configs[provider];
}

async function captureWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.info('Capturing web session', { provider });
    } else {
      console.log('[BG] Capturing web session for provider:', provider);
    }
    
    // Get MCP provider configuration for web session if available
    let config;
    if (mcpInitialized) {
      const mcpConfig = getMCPProviderConfiguration(provider);
      if (!mcpConfig || !mcpConfig.authentication.webSession) {
        if (useLogger) {
          mcpLogger.error('Provider not supported for web session', { provider });
        } else {
          console.error('[BG] Provider not supported for web session:', provider);
        }
        sendResponse({ success: false, error: 'Provider not supported for web session' });
        return;
      }
      config = mcpConfig.authentication.webSession;
    } else {
      // Fallback to legacy configuration
      config = getLegacyWebSessionConfig(provider);
      if (!config) {
        console.error('[BG] Provider not supported for web session:', provider);
        sendResponse({ success: false, error: 'Provider not supported for web session' });
        return;
      }
    }
    
    if (useLogger) {
      mcpLogger.debug('Using web session config', { provider, config });
    } else {
      console.log('[BG] Using web session config for provider:', provider);
    }
    
    // Query for tabs using multiple patterns
    let tabs = [];
    for (const pattern of config.tabPatterns) {
      if (useLogger) {
        mcpLogger.debug('Querying for tabs with pattern', { provider, pattern });
      } else {
        console.log('[BG] Querying for tabs with pattern:', pattern);
      }
      const patternTabs = await chrome.tabs.query({ url: pattern });
      tabs.push(...patternTabs);
    }
    
    // Remove duplicates
    tabs = tabs.filter((tab, index, self) => self.findIndex(t => t.id === tab.id) === index);
    
    if (useLogger) {
      mcpLogger.debug('Found tabs for provider', { 
        provider, 
        tabCount: tabs.length, 
        tabs: tabs.map(t => ({ id: t.id, url: t.url })) 
      });
    } else {
      console.log('[BG] Found tabs:', tabs.length, tabs.map(t => ({ id: t.id, url: t.url })));
    }
    
    if (tabs.length === 0) {
      if (useLogger) {
        mcpLogger.warn('No tabs found for provider', { provider, displayDomain: config.displayDomain });
      } else {
        console.warn('[BG] No tabs found for provider:', provider);
      }
      sendResponse({ 
        success: false, 
        error: `No ${provider} tabs found. Please open ${config.displayDomain} and sign in first.` 
      });
      return;
    }
    
    // Get cookies from all potential domains
    let allCookies = [];
    for (const domain of config.domains) {
      if (useLogger) {
        mcpLogger.debug('Getting cookies for domain', { provider, domain });
      } else {
        console.log('[BG] Getting cookies for domain:', domain);
      }
      
      // Try different approaches to get cookies
      const domainCookies = await chrome.cookies.getAll({ domain: domain });
      
      if (useLogger) {
        mcpLogger.debug('Found cookies for domain', { 
          provider, 
          domain, 
          cookieCount: domainCookies.length,
          cookies: domainCookies.map(c => ({ name: c.name, domain: c.domain, valueLength: c.value.length }))
        });
      } else {
        console.log(`[BG] Found ${domainCookies.length} cookies for domain ${domain}`);
      }
      
      allCookies.push(...domainCookies);
    }
    
    // Also try getting cookies by URL (more comprehensive)
    for (const tab of tabs) {
      if (useLogger) {
        mcpLogger.debug('Getting cookies for URL', { provider, url: tab.url });
      } else {
        console.log('[BG] Getting cookies for URL:', tab.url);
      }
      const urlCookies = await chrome.cookies.getAll({ url: tab.url });
      
      if (useLogger) {
        mcpLogger.debug('Found cookies for URL', {
          provider,
          url: tab.url,
          cookieCount: urlCookies.length,
          cookies: urlCookies.map(c => ({ name: c.name, domain: c.domain, valueLength: c.value.length }))
        });
      } else {
        console.log(`[BG] Found ${urlCookies.length} cookies for URL ${tab.url}`);
      }
      
      allCookies.push(...urlCookies);
    }
    
    // Remove duplicate cookies (same name + domain)
    const uniqueCookies = allCookies.filter((cookie, index, self) => 
      self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain) === index
    );
    
    if (useLogger) {
      mcpLogger.info('Collected unique cookies', { provider, cookieCount: uniqueCookies.length });
    } else {
      console.log('[BG] Total unique cookies found:', uniqueCookies.length);
    }
    
    if (uniqueCookies.length === 0) {
      if (useLogger) {
        mcpLogger.warn('No cookies found for provider', { provider, displayDomain: config.displayDomain });
      } else {
        console.warn('[BG] No cookies found for provider:', provider);
      }
      sendResponse({ 
        success: false, 
        error: `No session cookies found for ${config.displayDomain}. Please sign in to the website first.` 
      });
      return;
    }
    
    // Look for authentication cookies
    const authCookies = uniqueCookies.filter(cookie => 
      config.authCookies.some(authName => cookie.name.includes(authName))
    );
    
    if (useLogger) {
      mcpLogger.debug('Authentication cookies identified', { 
        provider, 
        authCookieCount: authCookies.length,
        authCookies: authCookies.map(c => ({ name: c.name, domain: c.domain }))
      });
    } else {
      console.log('[BG] Authentication cookies found:', authCookies.length);
    }
    
    // If no specific auth cookies found, use all cookies (fallback)
    const cookiesToStore = authCookies.length > 0 ? authCookies : uniqueCookies;
    
    // Store the session data
    const sessionData = {
      provider: provider,
      domain: config.displayDomain,
      cookies: cookiesToStore,
      capturedAt: new Date().toISOString(),
      tabUrl: tabs[0].url,
      cookieStats: {
        total: uniqueCookies.length,
        auth: authCookies.length,
        stored: cookiesToStore.length
      }
    };
    
    // Save to local storage (more secure than sync for session data)
    const storageKey = `webSession_${provider}`;
    if (useLogger) {
      mcpLogger.debug('Saving session data', { provider, storageKey });
    } else {
      console.log('[BG] Saving session data with key:', storageKey);
    }
    await chrome.storage.local.set({ [storageKey]: sessionData });
    
    if (useLogger) {
      mcpLogger.info('Web session captured successfully', {
        provider,
        domain: config.displayDomain,
        cookieStats: sessionData.cookieStats,
        capturedAt: sessionData.capturedAt
      });
    } else {
      console.log(`[BG] Web session captured for ${provider}:`, {
        domain: config.displayDomain,
        cookieStats: sessionData.cookieStats
      });
    }
    
    const responseData = { 
      success: true, 
      sessionInfo: `${cookiesToStore.length} cookies captured (${authCookies.length} auth cookies)`,
      capturedAt: sessionData.capturedAt,
      cookieStats: sessionData.cookieStats
    };
    
    if (useLogger) {
      mcpLogger.debug('Sending success response', { provider, responseData });
    } else {
      console.log('[BG] Sending success response for provider:', provider);
    }
    sendResponse(responseData);
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error capturing web session', { provider, error: error.message, stack: error.stack });
    } else {
      console.error('[BG] Error capturing web session:', error.message);
    }
    sendResponse({ success: false, error: error.message });
  }
}

async function clearWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.info('Clearing web session', { provider });
    } else {
      console.log('[BG] Clearing web session for provider:', provider);
    }
    
    const storageKey = `webSession_${provider}`;
    
    if (useLogger) {
      mcpLogger.debug('Removing storage key', { provider, storageKey });
    } else {
      console.log('[BG] Removing storage key:', storageKey);
    }
    
    await chrome.storage.local.remove(storageKey);
    
    if (useLogger) {
      mcpLogger.info('Web session cleared successfully', { provider });
    } else {
      console.log('[BG] Web session cleared successfully for provider:', provider);
    }
    
    sendResponse({ success: true });
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error clearing web session', { provider, error: error.message });
    } else {
      console.error('[BG] Error clearing web session:', error.message);
    }
    sendResponse({ success: false, error: error.message });
  }
}

async function checkWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.debug('Checking web session', { provider });
    } else {
      console.log('[BG] Checking web session for provider:', provider);
    }
    
    const storageKey = `webSession_${provider}`;
    
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (useLogger) {
      mcpLogger.debug('Session data check result', { provider, hasSession: !!sessionData });
    } else {
      console.log('[BG] Session data found:', !!sessionData);
    }
    
    if (!sessionData) {
      if (useLogger) {
        mcpLogger.debug('No session data found', { provider });
      } else {
        console.log('[BG] No session data found for provider:', provider);
      }
      sendResponse({ hasSession: false });
      return;
    }
    
    // Check if session is still valid (within last 24 hours)
    const capturedTime = new Date(sessionData.capturedAt);
    const now = new Date();
    const hoursSinceCapture = (now - capturedTime) / (1000 * 60 * 60);
    
    if (useLogger) {
      mcpLogger.debug('Session age check', { 
        provider, 
        capturedTime: capturedTime.toISOString(), 
        hoursSinceCapture 
      });
    } else {
      console.log('[BG] Session age:', { capturedTime, now, hoursSinceCapture });
    }
    
    if (hoursSinceCapture > 24) {
      if (useLogger) {
        mcpLogger.info('Session expired, removing', { provider, hoursSinceCapture });
      } else {
        console.log('[BG] Session expired, removing for provider:', provider);
      }
      // Session is too old, clear it
      await chrome.storage.local.remove(storageKey);
      sendResponse({ hasSession: false, reason: 'Session expired' });
      return;
    }
    
    const responseData = { 
      hasSession: true, 
      sessionInfo: sessionData.cookieStats ? 
        `${sessionData.cookieStats.stored} cookies (${sessionData.cookieStats.auth} auth), captured ${Math.round(hoursSinceCapture)}h ago` :
        `${sessionData.cookies.length} cookies, captured ${Math.round(hoursSinceCapture)}h ago`,
      capturedAt: sessionData.capturedAt,
      domain: sessionData.domain,
      cookieStats: sessionData.cookieStats
    };
    
    if (useLogger) {
      mcpLogger.debug('Session status response', { provider, responseData });
    } else {
      console.log('[BG] Sending session status response for provider:', provider);
    }
    sendResponse(responseData);
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error checking web session', { provider, error: error.message });
    } else {
      console.error('[BG] Error checking web session:', error.message);
    }
    sendResponse({ hasSession: false, error: error.message });
  }
}

// Function to use web session for API calls
async function makeWebSessionRequest(url, options, provider) {
  try {
    const storageKey = `webSession_${provider}`;
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (!sessionData) {
      throw new Error('No web session found. Please capture session first.');
    }
    
    // Add cookies to the request
    const cookieString = sessionData.cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    // Update headers with session cookies
    const sessionOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': sessionData.domain
      }
    };
    
    return fetch(url, sessionOptions);
    
  } catch (error) {
    console.error('Error making web session request:', error);
    throw error;
  }
}

// Handle AI messages using web session authentication
async function handleWebSessionMessage(messageData, sendResponse, settings) {
  try {
    // Check if web session exists
    const storageKey = `webSession_${settings.provider}`;
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (!sessionData) {
      sendResponse({ 
        error: 'No web session found. Please capture a web session first in settings.' 
      });
      return;
    }
    
    // For web session, we need to simulate the web interface API calls
    // This is experimental and depends on the provider's web API structure
    const webApiUrls = {
      'openai': 'https://chat.openai.com/backend-api/conversation',
      'anthropic': 'https://claude.ai/api/organizations/*/chat_conversations',
      'claude.ai': 'https://claude.ai/api/organizations/*/chat_conversations',
      'gemini': 'https://gemini.google.com/api/chat',
      // Add more providers as needed
    };
    
    const apiUrl = webApiUrls[settings.provider];
    if (!apiUrl) {
      sendResponse({ 
        error: `Web session API not implemented for ${settings.provider}. This feature is experimental.` 
      });
      return;
    }
    
    // Note: This is a simplified implementation
    // Real web session integration would require reverse engineering each provider's web API
    sendResponse({ 
      error: `Web session authentication for ${settings.provider} is experimental and requires additional implementation. Please use API mode for now.` 
    });
    
  } catch (error) {
    console.error('Error handling web session message:', error);
    sendResponse({ 
      error: `Web session error: ${error.message}` 
    });
  }
}