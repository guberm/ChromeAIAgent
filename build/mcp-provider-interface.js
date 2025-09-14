// ChromeAiAgent - MCP-Compliant Provider Interface
// Following Model Context Protocol specifications for standardized AI provider integration

// =============================================================================
// MCP-COMPLIANT PROVIDER SPECIFICATIONS
// =============================================================================

/**
 * MCP Tool Specification for AI Provider
 * Following MCP tool annotation standards
 */
class MCPProviderTool {
  constructor(name, description, inputSchema, annotations = {}) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.annotations = {
      title: annotations.title || name,
      readOnlyHint: annotations.readOnlyHint || false,
      destructiveHint: annotations.destructiveHint || false,
      idempotentHint: annotations.idempotentHint || true,
      openWorldHint: annotations.openWorldHint || true,
      ...annotations
    };
  }
}

/**
 * MCP-Compliant Provider Configuration
 * Standardized provider definitions following MCP resource and tool patterns
 */
function getMCPProviderConfig(provider) {
  const configs = {
    openai: {
      name: "OpenAI",
      description: "OpenAI GPT models with chat completions",
      version: "1.0.0",
      capabilities: {
        tools: ["chat_completion", "model_list", "test_connection"],
        resources: ["api_documentation", "model_specifications"],
        prompts: ["chat_template", "system_prompt"]
      },
      endpoints: {
        chat: "https://api.openai.com/v1/chat/completions",
        models: "https://api.openai.com/v1/models"
      },
      authentication: {
        methods: ["api_key", "oauth"],
        oauth: {
          authUrl: "https://platform.openai.com/oauth/authorize",
          scope: "api.read api.write",
          clientId: null // Set in manifest
        },
        webSession: {
          domains: [".openai.com", "chat.openai.com", ".chatgpt.com", "chatgpt.com"],
          tabPatterns: ["*://chat.openai.com/*", "*://chatgpt.com/*"],
          authCookies: ["__Secure-next-auth.session-token", "_cfuvid", "cf_clearance", "__cflb"],
          displayDomain: "chat.openai.com"
        }
      },
      inputValidation: {
        model: { type: "string", required: true },
        messages: { type: "array", required: true, minItems: 1 },
        maxTokens: { type: "number", minimum: 1, maximum: 32768 },
        temperature: { type: "number", minimum: 0, maximum: 2 }
      },
      errorHandling: {
        retryableErrors: [429, 500, 502, 503, 504],
        maxRetries: 3,
        backoffMultiplier: 2
      }
    },
    anthropic: {
      name: "Anthropic",
      description: "Anthropic Claude models with advanced reasoning",
      version: "1.0.0",
      capabilities: {
        tools: ["chat_completion", "model_list", "test_connection"],
        resources: ["api_documentation", "model_specifications"],
        prompts: ["chat_template", "system_prompt"]
      },
      endpoints: {
        chat: "https://api.anthropic.com/v1/messages",
        models: "https://api.anthropic.com/v1/models"
      },
      authentication: {
        methods: ["api_key", "oauth", "web_session"],
        headers: {
          "x-api-key": "{api_key}",
          "anthropic-version": "2023-06-01"
        },
        oauth: {
          authUrl: "https://console.anthropic.com/oauth/authorize",
          scope: "read write",
          clientId: null
        },
        webSession: {
          domains: [".claude.ai", "claude.ai"],
          tabPatterns: ["*://claude.ai/*"],
          authCookies: ["sessionKey", "auth-token", "_cfuvid", "cf_clearance"],
          displayDomain: "claude.ai"
        }
      },
      inputValidation: {
        model: { type: "string", required: true },
        messages: { type: "array", required: true, minItems: 1 },
        max_tokens: { type: "number", minimum: 1, maximum: 8192 },
        temperature: { type: "number", minimum: 0, maximum: 1 }
      },
      messageFormat: "anthropic", // Special handling required
      errorHandling: {
        retryableErrors: [429, 500, 502, 503, 504],
        maxRetries: 3,
        backoffMultiplier: 2
      }
    },
    gemini: {
      name: "Google Gemini",
      description: "Google Gemini models with multimodal capabilities",
      version: "1.0.0",
      capabilities: {
        tools: ["chat_completion", "model_list", "test_connection"],
        resources: ["api_documentation", "model_specifications"],
        prompts: ["chat_template", "system_prompt"]
      },
      endpoints: {
        chat: "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        models: "https://generativelanguage.googleapis.com/v1beta/models"
      },
      authentication: {
        methods: ["api_key", "oauth", "web_session"],
        oauth: {
          scope: "https://www.googleapis.com/auth/generative-language"
        },
        webSession: {
          domains: [".google.com", "gemini.google.com", ".aistudio.google.com"],
          tabPatterns: ["*://gemini.google.com/*", "*://aistudio.google.com/*"],
          authCookies: ["__Secure-1PSID", "__Secure-3PSID", "SAPISID", "HSID", "SSID", "1P_JAR"],
          displayDomain: "gemini.google.com"
        }
      },
      inputValidation: {
        model: { type: "string", required: true },
        contents: { type: "array", required: true, minItems: 1 },
        generationConfig: { 
          type: "object",
          properties: {
            maxOutputTokens: { type: "number", minimum: 1, maximum: 8192 },
            temperature: { type: "number", minimum: 0, maximum: 2 }
          }
        }
      },
      messageFormat: "gemini", // Special handling required
      errorHandling: {
        retryableErrors: [429, 500, 502, 503, 504],
        maxRetries: 3,
        backoffMultiplier: 2
      }
    },
    github: {
      name: "GitHub Models",
      description: "GitHub-hosted AI models with various capabilities",
      version: "1.0.0",
      capabilities: {
        tools: ["chat_completion", "model_list", "test_connection"],
        resources: ["api_documentation", "model_specifications"],
        prompts: ["chat_template", "system_prompt"]
      },
      endpoints: {
        chat: "https://models.inference.ai.azure.com/chat/completions",
        models: "https://models.inference.ai.azure.com/models"
      },
      authentication: {
        methods: ["oauth", "web_session"],
        oauth: {
          authUrl: "https://github.com/login/oauth/authorize",
          scope: "read:user",
          clientId: null
        },
        webSession: {
          domains: [".github.com", "github.com"],
          tabPatterns: ["*://github.com/*"],
          authCookies: ["user_session", "_gh_sess", "__Host-user_session_same_site"],
          displayDomain: "github.com"
        }
      },
      inputValidation: {
        model: { type: "string", required: true },
        messages: { type: "array", required: true, minItems: 1 },
        max_tokens: { type: "number", minimum: 1, maximum: 16384 },
        temperature: { type: "number", minimum: 0, maximum: 2 }
      },
      errorHandling: {
        retryableErrors: [429, 500, 502, 503, 504],
        maxRetries: 3,
        backoffMultiplier: 2
      }
    }
  };
  
  // Add remaining providers with similar structure
  configs.groq = createStandardProviderConfig("Groq", "https://api.groq.com/openai/v1", {
    domains: [".groq.com", "groq.com", "console.groq.com"],
    tabPatterns: ["*://groq.com/*", "*://console.groq.com/*"],
    authCookies: ["session", "auth_token", "_cfuvid"],
    displayDomain: "console.groq.com"
  });
  
  configs.deepseek = createStandardProviderConfig("DeepSeek", "https://api.deepseek.com/v1", {
    domains: [".deepseek.com", "chat.deepseek.com"],
    tabPatterns: ["*://chat.deepseek.com/*"],
    authCookies: ["session", "token", "_cfuvid"],
    displayDomain: "chat.deepseek.com"
  });
  
  configs.perplexity = createStandardProviderConfig("Perplexity", "https://api.perplexity.ai", {
    domains: [".perplexity.ai", "www.perplexity.ai", "perplexity.ai"],
    tabPatterns: ["*://www.perplexity.ai/*", "*://perplexity.ai/*"],
    authCookies: ["session", "auth_token", "_cfuvid"],
    displayDomain: "www.perplexity.ai"
  });
  
  // Claude.ai web interface - special configuration for web-only access
  configs['claude.ai'] = {
    name: "Claude.ai",
    description: "Claude.ai web interface with experimental web session support",
    version: "1.0.0",
    capabilities: {
      tools: ["chat_completion", "test_connection"],
      resources: ["web_interface"],
      prompts: ["chat_template"]
    },
    endpoints: {
      chat: "https://claude.ai", // Web interface, no API
      models: null // No public API endpoint
    },
    authentication: {
      methods: ["web_session"],
      webSession: {
        domains: [".claude.ai", "claude.ai"],
        tabPatterns: ["*://claude.ai/*"],
        authCookies: ["sessionKey", "auth-token", "_cfuvid", "cf_clearance"],
        displayDomain: "claude.ai"
      }
    },
    inputValidation: {
      messages: { type: "array", required: true, minItems: 1 }
    },
    errorHandling: {
      retryableErrors: [],
      maxRetries: 1,
      backoffMultiplier: 1
    }
  };
  
  configs.azure = createAzureProviderConfig();
  configs.local = createLocalProviderConfig();
  
  return configs[provider];
}

function createStandardProviderConfig(name, baseUrl, webSession) {
  return {
    name: name,
    description: `${name} AI models with chat completions`,
    version: "1.0.0",
    capabilities: {
      tools: ["chat_completion", "model_list", "test_connection"],
      resources: ["api_documentation", "model_specifications"],
      prompts: ["chat_template", "system_prompt"]
    },
    endpoints: {
      chat: `${baseUrl}/chat/completions`,
      models: `${baseUrl}/models`
    },
    authentication: {
      methods: ["api_key", "web_session"],
      webSession: webSession
    },
    inputValidation: {
      model: { type: "string", required: true },
      messages: { type: "array", required: true, minItems: 1 },
      max_tokens: { type: "number", minimum: 1, maximum: 8192 },
      temperature: { type: "number", minimum: 0, maximum: 2 }
    },
    errorHandling: {
      retryableErrors: [429, 500, 502, 503, 504],
      maxRetries: 3,
      backoffMultiplier: 2
    }
  };
}

function createAzureProviderConfig() {
  return {
    name: "Azure OpenAI",
    description: "Azure-hosted OpenAI models with enterprise features",
    version: "1.0.0",
    capabilities: {
      tools: ["chat_completion", "model_list", "test_connection"],
      resources: ["api_documentation", "model_specifications"],
      prompts: ["chat_template", "system_prompt"]
    },
    endpoints: {
      chat: "{host}", // Custom host required
      models: "{host}/models"
    },
    authentication: {
      methods: ["api_key"],
      headerName: "api-key" // Azure uses different header
    },
    inputValidation: {
      model: { type: "string", required: true },
      messages: { type: "array", required: true, minItems: 1 },
      max_tokens: { type: "number", minimum: 1, maximum: 16384 },
      temperature: { type: "number", minimum: 0, maximum: 2 }
    },
    errorHandling: {
      retryableErrors: [429, 500, 502, 503, 504],
      maxRetries: 3,
      backoffMultiplier: 2
    }
  };
}

function createLocalProviderConfig() {
  return {
    name: "Local AI Server",
    description: "Local AI server (Ollama, LM Studio, etc.)",
    version: "1.0.0",
    capabilities: {
      tools: ["chat_completion", "model_list", "test_connection"],
      resources: ["api_documentation", "model_specifications"],
      prompts: ["chat_template", "system_prompt"]
    },
    endpoints: {
      chat: "{host}/v1/chat/completions", // Custom host required
      models: "{host}/v1/models"
    },
    authentication: {
      methods: ["none", "api_key"],
      optional: true
    },
    inputValidation: {
      model: { type: "string", required: true },
      messages: { type: "array", required: true, minItems: 1 },
      max_tokens: { type: "number", minimum: 1, maximum: 32768 },
      temperature: { type: "number", minimum: 0, maximum: 2 }
    },
    errorHandling: {
      retryableErrors: [429, 500, 502, 503, 504],
      maxRetries: 2,
      backoffMultiplier: 1.5
    }
  };
}

// =============================================================================
// MCP-COMPLIANT ERROR HANDLING
// =============================================================================

class MCPError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.name = 'MCPError';
    this.code = code;
    this.data = data;
  }
  
  toJSON() {
    return {
      jsonrpc: "2.0",
      error: {
        code: this.code,
        message: this.message,
        data: this.data
      }
    };
  }
}

// MCP Error Codes following JSON-RPC 2.0 specification
const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
  AUTHENTICATION_FAILED: -32001,
  AUTHORIZATION_FAILED: -32002,
  PROVIDER_ERROR: -32003,
  VALIDATION_ERROR: -32004,
  NETWORK_ERROR: -32005,
  TIMEOUT_ERROR: -32006
};

function createMCPError(code, message, data = null) {
  return new MCPError(code, message, data);
}

// =============================================================================
// MCP-COMPLIANT INPUT VALIDATION
// =============================================================================

class MCPValidator {
  static validateChatRequest(request, providerConfig) {
    const errors = [];
    
    // Validate required fields
    if (!request.model) {
      errors.push("model is required");
    }
    
    if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
      errors.push("messages must be a non-empty array");
    }
    
    // Validate against provider schema
    if (providerConfig?.inputValidation) {
      const validation = providerConfig.inputValidation;
      
      if (validation.maxTokens && request.max_tokens) {
        if (request.max_tokens < validation.maxTokens.minimum || 
            request.max_tokens > validation.maxTokens.maximum) {
          errors.push(`max_tokens must be between ${validation.maxTokens.minimum} and ${validation.maxTokens.maximum}`);
        }
      }
      
      if (validation.temperature && request.temperature !== undefined) {
        if (request.temperature < validation.temperature.minimum || 
            request.temperature > validation.temperature.maximum) {
          errors.push(`temperature must be between ${validation.temperature.minimum} and ${validation.temperature.maximum}`);
        }
      }
    }
    
    if (errors.length > 0) {
      throw createMCPError(MCP_ERROR_CODES.VALIDATION_ERROR, "Input validation failed", { errors });
    }
    
    return true;
  }
  
  static validateAuthenticationData(authData, provider) {
    const providerConfig = getMCPProviderConfig(provider);
    
    if (!providerConfig) {
      throw createMCPError(MCP_ERROR_CODES.INVALID_PARAMS, `Unsupported provider: ${provider}`);
    }
    
    const authMethods = providerConfig.authentication?.methods || [];
    
    if (authMethods.includes("none")) {
      return true; // No authentication required
    }
    
    if (!authData.apiKey && !authData.oauthToken && !authData.webSession) {
      throw createMCPError(
        MCP_ERROR_CODES.AUTHENTICATION_FAILED, 
        `Authentication required for ${provider}. Supported methods: ${authMethods.join(", ")}`
      );
    }
    
    return true;
  }
}

// =============================================================================
// MCP-COMPLIANT REQUEST/RESPONSE HANDLERS
// =============================================================================

class MCPRequestHandler {
  constructor() {
    this.requestId = 0;
  }
  
  generateRequestId() {
    return ++this.requestId;
  }
  
  createRequest(method, params, id = null) {
    return {
      jsonrpc: "2.0",
      id: id || this.generateRequestId(),
      method: method,
      params: params
    };
  }
  
  createResponse(id, result = null, error = null) {
    const response = {
      jsonrpc: "2.0",
      id: id
    };
    
    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }
    
    return response;
  }
  
  createNotification(method, params) {
    return {
      jsonrpc: "2.0",
      method: method,
      params: params
    };
  }
}

// =============================================================================
// MCP-COMPLIANT LOGGING
// =============================================================================

class MCPLogger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      'error': 0,
      'warn': 1,
      'info': 2,
      'debug': 3
    };
  }
  
  log(level, message, data = null) {
    if (this.levels[level] <= this.levels[this.level]) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        data
      };
      
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
      
      // Send to MCP client if available
      this.sendLogMessage(level, message, data);
    }
  }
  
  error(message, data = null) {
    this.log('error', message, data);
  }
  
  warn(message, data = null) {
    this.log('warn', message, data);
  }
  
  info(message, data = null) {
    this.log('info', message, data);
  }
  
  debug(message, data = null) {
    this.log('debug', message, data);
  }
  
  sendLogMessage(level, message, data) {
    // Implementation for sending log messages to MCP client
    // This would integrate with the actual MCP transport layer
    // Only attempt to send if we're not in the background script context
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        // Check if we have active listeners before sending
        chrome.runtime.sendMessage({
          action: 'mcpLogMessage',
          level: level,
          message: message,
          data: data,
          timestamp: new Date().toISOString()
        }).catch(() => {
          // Silently ignore - no listeners available
        });
      } catch (error) {
        // Silently ignore errors when no listeners or in background context
      }
    }
  }
}

// Global MCP logger instance
const mcpLogger = new MCPLogger('debug');

// =============================================================================
// EXPORTS FOR USE IN BACKGROUND SCRIPT
// =============================================================================

// Export classes and functions for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MCPProviderTool,
    getMCPProviderConfig,
    MCPError,
    MCP_ERROR_CODES,
    createMCPError,
    MCPValidator,
    MCPRequestHandler,
    MCPLogger,
    mcpLogger
  };
}