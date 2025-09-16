// Side panel script for ChromeAiAgent
class ChromeAiAgent {
  constructor() {
    console.log('ChromeAiAgent constructor called');
    this.currentView = 'chat';
    this.settings = {};
    this.messages = [];
    this.isStreaming = false;
    this.providerDefaults = null; // Initialize as null to track setup
    this.pageInfo = null; // Store current page information
    
    this.init();
  }

  async init() {
    try {
      console.log('Initializing ChromeAiAgent...');
      this.setupProviderDefaults();
      this.setupEventListeners();
      await this.loadSettings();
      await this.loadPageContext();
      this.updateConnectionStatus();
      this.checkPendingActions();
      console.log('ChromeAiAgent initialization complete');
    } catch (error) {
      console.error('Error during initialization:', error);
    }
  }

  setupEventListeners() {
    // Navigation
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.showSettings();
      });
    }
    
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showChat();
      });
    }

    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        this.showChat();
      });
    }

    const logsBtn = document.getElementById('logsBtn');
    if (logsBtn) {
      logsBtn.addEventListener('click', () => {
        this.showLogs();
      });
    }

    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
      newChatBtn.addEventListener('click', () => {
        this.startNewChat();
      });
    }

    const closeLogsBtn = document.getElementById('closeLogsBtn');
    if (closeLogsBtn) {
      closeLogsBtn.addEventListener('click', () => {
        this.showChat();
      });
    }

    // Chat
    const sendBtn = document.getElementById('sendBtn');
    if (sendBtn) {
      sendBtn.addEventListener('click', () => {
        this.sendMessage();
      });
    }
    
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        this.stopStreaming();
      });
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      messageInput.addEventListener('input', (e) => {
        this.adjustTextareaHeight(e.target);
        this.updateSendButton();
      });
    }

    // Settings
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }

    const testConnectionBtn = document.getElementById('testConnectionBtn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => {
        this.testConnection();
      });
    }

    const providerSelect = document.getElementById('providerSelect');
    if (providerSelect) {
      providerSelect.addEventListener('change', async (e) => {
        console.log('Provider changed to:', e.target.value);
        this.updateProviderDefaults(e.target.value);
        this.updateDefaultProviderIndicator();
        
        // Automatically save the new provider setting
        try {
          await this.saveSettings();
          console.log('🔧 Provider settings auto-saved');
        } catch (error) {
          console.error('🔧 Failed to auto-save provider settings:', error);
        }
        
        // Update web session status for the new provider
        const authModeSelect = document.getElementById('authModeSelect');
        if (authModeSelect && authModeSelect.value === 'web') {
          console.log('🔄 Provider changed in web session mode, checking new provider session status...');
          this.checkWebSessionStatus();
        }
      });
    }

    const setDefaultProviderBtn = document.getElementById('setDefaultProviderBtn');
    if (setDefaultProviderBtn) {
      setDefaultProviderBtn.addEventListener('click', () => {
        this.setDefaultProvider();
      });
    }

    const refreshModelsBtn = document.getElementById('refreshModelsBtn');
    if (refreshModelsBtn) {
      refreshModelsBtn.addEventListener('click', () => {
        this.fetchModels();
      });
    }

    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
      modelSelect.addEventListener('change', (e) => {
        // Save selected model immediately
        const model = e.target.value;
        chrome.storage.sync.set({ model: model });
        console.log('Model changed to:', model);
        
        // Update provider status display
        const providerSelect = document.getElementById('providerSelect');
        const currentProvider = providerSelect ? providerSelect.value : this.settings.provider;
        this.updateProviderStatus(currentProvider, model);
      });
    }

    const temperatureInput = document.getElementById('temperatureInput');
    if (temperatureInput) {
      temperatureInput.addEventListener('input', (e) => {
        const temperatureValue = document.getElementById('temperatureValue');
        if (temperatureValue) {
          temperatureValue.textContent = e.target.value;
        }
      });
    }

    // Authentication mode switching
    const authModeSelect = document.getElementById('authModeSelect');
    if (authModeSelect) {
      authModeSelect.addEventListener('change', (e) => {
        this.handleAuthModeChange(e.target.value);
      });
    }

    // OAuth authentication
    const oauthSignInBtn = document.getElementById('oauthSignInBtn');
    if (oauthSignInBtn) {
      oauthSignInBtn.addEventListener('click', () => {
        this.authenticateWithProvider();
      });
    }

    const oauthSignOutBtn = document.getElementById('oauthSignOutBtn');
    if (oauthSignOutBtn) {
      oauthSignOutBtn.addEventListener('click', () => {
        this.signOutFromProvider();
      });
    }

    // Web session authentication
    const openWebAuthBtn = document.getElementById('openWebAuthBtn');
    if (openWebAuthBtn) {
      openWebAuthBtn.addEventListener('click', () => {
        this.openProviderWebsite();
      });
    }

    const captureSessionBtn = document.getElementById('captureSessionBtn');
    if (captureSessionBtn) {
      captureSessionBtn.addEventListener('click', () => {
        this.captureWebSession();
      });
    }

    const clearSessionBtn = document.getElementById('clearSessionBtn');
    if (clearSessionBtn) {
      clearSessionBtn.addEventListener('click', () => {
        this.clearWebSession();
      });
    }

    const refreshSessionBtn = document.getElementById('refreshSessionBtn');
    if (refreshSessionBtn) {
      refreshSessionBtn.addEventListener('click', () => {
        this.checkWebSessionStatus();
      });
    }

    const refreshPageContextBtn = document.getElementById('refreshPageContextBtn');
    if (refreshPageContextBtn) {
      refreshPageContextBtn.addEventListener('click', () => {
        this.loadPageContext();
      });
    }

    // Listen for streaming messages
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === 'streamChunk') {
        this.handleStreamChunk(message.content, message.fullText);
      }
      if (message.action === 'showSettings') {
        this.showSettings();
      }
    });

    // Check for pending actions
    chrome.storage.local.get(['pendingAction'], (result) => {
      if (result.pendingAction === 'showSettings') {
        this.showSettings();
        chrome.storage.local.remove(['pendingAction']);
      }
    });
  }

  async loadPageContext() {
    try {
      // Get current tab information
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        this.pageInfo = {
          url: tabs[0].url,
          title: tabs[0].title,
          isRestricted: this.isRestrictedPage(tabs[0].url)
        };
        
        // Extract page content if on a valid webpage
        if (tabs[0].url && !this.isRestrictedPage(tabs[0].url)) {
          try {
            const results = await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              function: extractPageContent
            });
            
            if (results && results[0] && results[0].result) {
              this.pageInfo.content = results[0].result;
              console.log('📄 Page content extracted:', this.pageInfo.content.substring(0, 200) + '...');
            }
          } catch (contentError) {
            console.log('Could not extract page content:', contentError.message);
            this.pageInfo.contentError = contentError.message;
            // Mark as restricted if content extraction fails
            this.pageInfo.isRestricted = true;
          }
        } else {
          console.log('📄 Skipping content extraction for restricted page:', tabs[0].url);
          this.pageInfo.content = `Page type: ${this.getPageType(tabs[0].url)}
This page cannot be automated or analyzed due to browser security restrictions.
Available actions are limited to basic navigation commands.`;
        }
      }
      
      // Check for stored page info from popup
      chrome.storage.local.get(['pageInfo'], (result) => {
        if (result.pageInfo) {
          // Merge stored page info with current page info
          this.pageInfo = { ...this.pageInfo, ...result.pageInfo };
          chrome.storage.local.remove(['pageInfo']);
        }
        this.updatePageContext();
      });
    } catch (error) {
      console.error('Error loading page context:', error);
    }
  }

  isRestrictedPage(url) {
    if (!url) return true;
    
    const restrictedPatterns = [
      // /^chrome:\/\//,
      // /^chrome-extension:\/\//,
      // /^edge:\/\//,
      // /^firefox:\/\//,
      // /^moz-extension:\/\//,
      // /^addons\.mozilla\.org/,
      // /^microsoftedge\.microsoft\.com/
    ];
    
    return restrictedPatterns.some(pattern => pattern.test(url));
  }

  getPageType(url) {
    if (!url) return 'Unknown';
    
    // if (url.startsWith('chrome://')) return 'Chrome Internal Page';
    // if (url.startsWith('chrome-extension://')) return 'Chrome Extension Page';
    // if (url.includes('addons.mozilla.org')) return 'Firefox Add-ons Store';
    // if (url.startsWith('edge://')) return 'Edge Internal Page';
    // if (url.startsWith('firefox://')) return 'Firefox Internal Page';
    // if (url.startsWith('moz-extension://')) return 'Firefox Extension Page';
    // if (url.startsWith('https://')) return 'Regular Website';
    
    
    return 'Regular Website';
  }

  updatePageContext() {
    const pageContextEl = document.documentElement.outerHTML;
    const pageTitleEl = document.getElementById('pageTitle');
    
    if (this.pageInfo && this.pageInfo.title) {
      let displayTitle = this.pageInfo.title;
      if (displayTitle.length > 40) {
        displayTitle = displayTitle.substring(0, 37) + '...';
      }
      
      // Add restriction indicator if page is restricted
      if (this.pageInfo.isRestricted) {
        displayTitle += ' 🔒';
        pageTitleEl.title = `${this.pageInfo.title} (Restricted Page - Limited functionality available)`;
      } else {
        pageTitleEl.title = this.pageInfo.title; // Full title on hover
      }
      
      pageTitleEl.textContent = displayTitle;
      pageContextEl.style.display = 'flex';
      
      console.log('📄 Page context updated:', {
        title: this.pageInfo.title,
        url: this.pageInfo.url,
        isRestricted: this.pageInfo.isRestricted,
        hasContent: !!this.pageInfo.content,
        contentLength: this.pageInfo.content?.length || 0
      });
    } else {
      pageContextEl.style.display = 'none';
      console.log('📄 No page context available');
    }
  }

  checkPendingActions() {
    chrome.storage.local.get(['pendingAction'], (result) => {
      if (result.pendingAction) {
        console.log('Pending action found:', result.pendingAction);
        
        if (result.pendingAction === 'settings') {
          this.showSettings();
        } else if (result.pendingAction === 'chat') {
          this.showChat();
        }
        
        chrome.storage.local.remove(['pendingAction']);
      }
    });

    // Page context refresh
    const refreshPageContextBtn = document.getElementById('refreshPageContextBtn');
    if (refreshPageContextBtn) {
      refreshPageContextBtn.addEventListener('click', async () => {
        await this.loadPageContext();
      });
    }

    // Tab navigation
    const chatTab = document.getElementById('chatTab');
    if (chatTab) {
      chatTab.addEventListener('click', () => this.switchTab('chat'));
    }

    const automationTab = document.getElementById('automationTab');
    if (automationTab) {
      automationTab.addEventListener('click', () => this.switchTab('automation'));
    }

    const notesTab = document.getElementById('notesTab');
    if (notesTab) {
      notesTab.addEventListener('click', () => this.switchTab('notes'));
    }

    const automationBtn = document.getElementById('automationBtn');
    if (automationBtn) {
      automationBtn.addEventListener('click', () => this.switchTab('automation'));
    }

    // Automation controls
    const executeBtn = document.getElementById('executeBtn');
    if (executeBtn) {
      executeBtn.addEventListener('click', () => this.executeAutomationCommand());
    }

    const automationInput = document.getElementById('automationInput');
    if (automationInput) {
      automationInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          this.executeAutomationCommand();
        }
      });
    }

    const clearResultsBtn = document.getElementById('clearResultsBtn');
    if (clearResultsBtn) {
      clearResultsBtn.addEventListener('click', () => this.clearAutomationResults());
    }

    // Quick action buttons
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('quick-action-btn')) {
        const command = e.target.getAttribute('data-command');
        if (command) {
          this.executeQuickAction(command);
        }
      }
    });

    // Notes controls
    const refreshNotesBtn = document.getElementById('refreshNotesBtn');
    if (refreshNotesBtn) {
      refreshNotesBtn.addEventListener('click', () => this.loadNotes());
    }

    // Listen for automation focus messages
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'focusAutomation') {
        this.switchTab('automation');
        const automationInput = document.getElementById('automationInput');
        if (automationInput) {
          automationInput.focus();
        }
      }
    });
  }

  async loadSettings() {
    try {
      console.log('🔧 Loading settings from background...');
      const response = await chrome.runtime.sendMessage({ action: 'getProviderSettings' });
      console.log('🔧 Settings response:', response);
      
      this.settings = response?.settings;
      console.log('🔧 Loaded settings:', this.settings);

      // Initialize settings if they don't exist
      if (!this.settings) {
        console.log('🔧 No settings found, initializing defaults...');
        this.settings = {
          provider: 'openai',
          apiKey: '',
          host: 'https://api.openai.com/v1/chat/completions',
          model: '',
          temperature: 0.7,
          maxTokens: 800,
          authMode: 'api'
        };
      }

      // Load default provider preference
      const defaultProvider = await new Promise((resolve) => {
        chrome.storage.sync.get(['defaultProvider'], (result) => {
          resolve(result.defaultProvider);
        });
      });

      if (this.settings && this.settings.provider) {
        await this.populateSettingsForm();
        // Update provider status display with current settings
        this.updateProviderStatus(this.settings.provider, this.settings.model);
      } else {
        // Set default to saved default provider or OpenAI if no settings
        const provider = defaultProvider || 'openai';
        this.updateProviderDefaults(provider);
        // Update display with default
        this.updateProviderStatus(provider, '-');
      }

      // Update the default provider indicator
      this.updateDefaultProviderIndicator();
      
      // Update connection status
      this.updateConnectionStatus();
    } catch (error) {
      console.error('🔧 Error loading settings:', error);
      // Initialize with defaults if loading fails
      this.settings = {
        provider: 'openai',
        apiKey: '',
        host: 'https://api.openai.com/v1/chat/completions',
        model: '',
        temperature: 0.7,
        maxTokens: 800,
        authMode: 'api'
      };
      this.updateProviderDefaults('openai');
      this.updateProviderStatus('openai', '-');
    }
  }

  async populateSettingsForm() {
    const form = document.getElementById('settingsForm');
    const elements = form.elements;

    // Get default provider preference
    const defaultProvider = await new Promise((resolve) => {
      chrome.storage.sync.get(['defaultProvider'], (result) => {
        resolve(result.defaultProvider);
      });
    });

    const provider = this.settings.provider || defaultProvider || 'openai';
    
    elements.providerSelect.value = provider;
    elements.temperatureInput.value = this.settings.temperature || 0.7;
    elements.maxTokensInput.value = this.settings.maxTokens || 800;
    document.getElementById('temperatureValue').textContent = this.settings.temperature || 0.7;
    
    // Load authentication mode
    const authMode = this.settings.authMode || 'api';
    console.log('🔐 Loading auth mode from settings:', authMode);
    console.log('🔐 Available settings:', this.settings);
    
    const authModeSelect = elements.authModeSelect;
    if (authModeSelect) {
      authModeSelect.value = authMode;
      console.log('🔐 Set authModeSelect value to:', authMode);
    } else {
      console.error('🔐 authModeSelect element not found!');
    }
    
    console.log('🔐 Calling handleAuthModeChange with:', authMode);
    this.handleAuthModeChange(authMode);
    
    // Load API key first
    if (this.settings.apiKey) {
      elements.apiKeyInput.value = this.settings.apiKey;
    }
    
    // Update provider defaults first (this will set correct host and model)
    this.updateProviderDefaults(provider);
    
    // Update default provider indicator
    this.updateDefaultProviderIndicator();
    
    // Then override with saved values if they exist
    const defaults = this.providerDefaults[provider];
    if (defaults) {
      // Only keep the saved host if it matches the provider
      if (this.settings.host && this.settings.host === defaults.host) {
        elements.hostInput.value = this.settings.host;
      }
      
      // Always restore the saved model (will be validated when models are fetched)
      if (this.settings.model) {
        elements.modelSelect.value = this.settings.model;
      }
    }
    
    // Fetch models after a short delay to ensure settings are loaded
    setTimeout(() => this.fetchModels(), 500);
  }

  setupProviderDefaults() {
    console.log('Setting up provider defaults...');
    this.providerDefaults = {
      openai: {
        host: 'https://api.openai.com/v1/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'OpenAI GPT models. Requires OpenAI API key. Models fetched dynamically from API.'
      },
      gemini: {
        host: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
        models: [], // Dynamic - fetched from API
        info: 'Google Gemini models provide multimodal capabilities and strong reasoning. Uses x-goog-api-key header authentication.'
      },
      'claude.ai': {
        host: 'https://claude.ai',
        models: [], // Dynamic - no public API available
        info: 'Claude.ai experimental web interface provider. Currently experimental - uses web interface integration.'
      },
      github: {
        host: 'https://models.inference.ai.azure.com/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'GitHub Models provides free access to various AI models. Requires GitHub Personal Access Token.'
      },
      groq: {
        host: 'https://api.groq.com/openai/v1/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'Groq provides ultra-fast inference speeds. Great for quick responses and cost-effective usage.'
      },
      deepseek: {
        host: 'https://api.deepseek.com/v1/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'DeepSeek models are cost-effective and perform well on reasoning and coding tasks.'
      },
      perplexity: {
        host: 'https://api.perplexity.ai/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'Perplexity provides online-capable models that can search the web for up-to-date information.'
      },
      openrouter: {
        host: 'https://openrouter.ai/api/v1/chat/completions',
        models: [], // Dynamic - fetched from API
        info: 'OpenRouter provides access to multiple AI models from different providers through a unified API. Cost-effective with pay-per-use pricing.'
      },
      azure: {
        host: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2024-02-01',
        models: [], // Manual - enter your deployed model name
        info: 'Azure OpenAI provides enterprise-grade security and compliance. Requires Azure subscription.'
      },
      local: {
        host: 'http://127.0.0.1:11434/api/chat',
        models: [], // Dynamic - auto-detected from local servers
        info: 'Local AI models running on your machine (Ollama, LM Studio, etc.). No API key required - auto-detects models.'
      },
      custom: {
        host: 'http://localhost:8000/v1/chat/completions',
        models: [], // Dynamic - fetched from custom endpoint
        info: 'Custom OpenAI-compatible endpoint. Configure your own host and model.'
      }
    };
    console.log('Provider defaults set up:', Object.keys(this.providerDefaults));
  }

  updateProviderDefaults(provider) {
    console.log('updateProviderDefaults called with provider:', provider);
    console.log('Available providers:', Object.keys(this.providerDefaults || {}));
    
    if (!this.providerDefaults) {
      console.error('providerDefaults not initialized');
      return;
    }
    
    const defaults = this.providerDefaults[provider];
    if (!defaults) {
      console.error('No defaults found for provider:', provider);
      return;
    }

    const hostInput = document.getElementById('hostInput');
    const modelSelect = document.getElementById('modelSelect');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const providerDetails = document.getElementById('providerDetails');

    // Always update host when switching providers
    hostInput.value = defaults.host;

    // Force correct host for local provider (in case old settings are cached)
    if (provider === 'local') {
      hostInput.value = 'http://127.0.0.1:11434/api/chat';
      console.log('🔧 Forced local provider host to Ollama default');
    }

    // Clear the model dropdown initially - will be populated when models are fetched
    const currentModel = modelSelect.value;
    if (!currentModel || currentModel === 'undefined') {
      modelSelect.innerHTML = '<option value="">Loading models...</option>';
      modelSelect.disabled = true;
    }

    // Update provider status display
    this.updateProviderStatus(provider, currentModel);

    // For local and custom providers, clear API key requirement
    if (provider === 'local' || provider === 'custom') {
      apiKeyInput.placeholder = 'Not required for local models';
      if (!apiKeyInput.value || apiKeyInput.value === '' || apiKeyInput.value === 'local-no-key-required') {
        apiKeyInput.value = ''; // Keep empty for local provider
      }
    } else {
      apiKeyInput.placeholder = 'Enter your API key';
      if (apiKeyInput.value === 'local-no-key-required') {
        apiKeyInput.value = '';
      }
    }

    // Update provider information
    providerDetails.innerHTML = `
      <p><strong>Default Host:</strong> ${defaults.host}</p>
      <p><strong>Models:</strong> Fetched dynamically from provider API</p>
      <p><strong>Description:</strong> ${defaults.info}</p>
      ${provider === 'local' ? '<p><strong>Note:</strong> Make sure your local AI server is running on the specified host.</p>' : ''}
      ${provider === 'custom' ? '<p><strong>Note:</strong> Configure your custom OpenAI-compatible endpoint above.</p>' : ''}
    `;
    
    console.log(`Updated provider to ${provider}: host=${defaults.host}, model=${modelSelect.value}`);
    
    // Update OAuth UI based on provider support
    const oauthSignInBtn = document.getElementById('oauthSignInBtn');
    const oauthSignOutBtn = document.getElementById('oauthSignOutBtn');
    
    if (this.supportsOAuth(provider)) {
      oauthSignInBtn.style.display = 'flex';
      this.updateOAuthUI(provider, false); // Will be updated by checkOAuthStatus
      this.checkOAuthStatus();
    } else {
      oauthSignInBtn.style.display = 'none';
      oauthSignOutBtn.style.display = 'none';
      document.getElementById('apiKeyInput').disabled = false;
      document.getElementById('apiKeyInput').placeholder = 'Enter your API key';
    }
    
    // Update web session UI based on provider support and current auth mode
    const authMode = document.getElementById('authModeSelect').value;
    if (authMode === 'web') {
      console.log('🔄 Provider changed, updating web session status for:', provider);
      this.checkWebSessionStatus();
    }
    
    // Fetch available models for this provider
    this.fetchModels();
  }

  updateProviderStatus(provider, model) {
    console.log('🔍 updateProviderStatus called with:', { provider, model });
    
    const currentProviderEl = document.getElementById('currentProvider');
    const currentModelEl = document.getElementById('currentModel');
    
    if (currentProviderEl) {
      currentProviderEl.textContent = provider || '-';
      console.log('🔍 Set provider display to:', provider || '-');
    } else {
      console.error('🔍 currentProvider element not found');
    }
    
    if (currentModelEl) {
      currentModelEl.textContent = model || '-';
      console.log('🔍 Set model display to:', model || '-');
    } else {
      console.error('🔍 currentModel element not found');
    }
    
    // Add dynamic token status for all providers
    this.updateTokenStatus();
  }
  
  async updateTokenStatus() {
    try {
      // Check if we have a token status element, if not create one
      let tokenStatusEl = document.getElementById('tokenStatus');
      if (!tokenStatusEl) {
        tokenStatusEl = document.createElement('div');
        tokenStatusEl.id = 'tokenStatus';
        tokenStatusEl.style.cssText = `
          margin: 8px 0;
          padding: 8px;
          background: #f8f9fa;
          border-radius: 6px;
          font-size: 12px;
          color: #666;
        `;
        
        // Try multiple possible containers
        const possibleContainers = [
          document.querySelector('.status-section'),
          document.querySelector('.settings-container'),
          document.querySelector('.provider-status'),
          document.getElementById('settingsPanel'),
          document.body
        ];
        
        let targetContainer = null;
        for (const container of possibleContainers) {
          if (container) {
            targetContainer = container;
            break;
          }
        }
        
        if (targetContainer) {
          targetContainer.appendChild(tokenStatusEl);
        } else {
          console.log('No suitable container found for token status');
          return;
        }
      }
      
      // Get current provider for specific messaging
      const provider = this.settings?.provider || 'openrouter';
      const providerInfo = this.getProviderTokenInfo(provider);
      
      tokenStatusEl.innerHTML = `🧠 ${providerInfo.name}: ${providerInfo.description}`;
      
    } catch (error) {
      console.log('Could not update token status:', error);
    }
  }
  
  getProviderTokenInfo(provider) {
    const providerData = {
      'openrouter': {
        name: 'OpenRouter Dynamic Tokens',
        description: 'Real-time credit checking + smart optimization'
      },
      'openai': {
        name: 'OpenAI Smart Tokens', 
        description: 'Subscription-optimized with 1.5x limits'
      },
      'anthropic': {
        name: 'Claude Long Context',
        description: 'Optimized for long documents (2x tokens)'
      },
      'groq': {
        name: 'Groq Speed Tokens',
        description: 'Fast inference with efficiency focus'
      },
      'deepseek': {
        name: 'DeepSeek Balanced',
        description: 'Smart balance of context and efficiency'
      },
      'perplexity': {
        name: 'Perplexity Research',
        description: 'Optimized for research and analysis'
      },
      'azure': {
        name: 'Azure Enterprise',
        description: 'Enterprise-grade with high limits (1.8x)'
      },
      'github': {
        name: 'GitHub Models Preview',
        description: 'Preview generosity (2.5x token limits)'
      },
      'gemini': {
        name: 'Gemini Multimodal',
        description: 'Google\'s generous free tier (2x tokens)'
      },
      'google': {
        name: 'Google AI',
        description: 'Google\'s generous free tier (2x tokens)'
      },
      'local': {
        name: 'Local Unlimited',
        description: 'No limits - use as much as needed'
      },
      'ollama': {
        name: 'Ollama Unlimited',
        description: 'Local inference - no token constraints'
      }
    };
    
    return providerData[provider] || {
      name: 'Custom Provider',
      description: 'Dynamic optimization enabled'
    };
  }

  async saveSettings() {
    const form = document.getElementById('settingsForm');
    
    const provider = document.getElementById('providerSelect').value;
    const host = document.getElementById('hostInput').value.trim();
    const apiKey = document.getElementById('apiKeyInput').value.trim();
    const model = document.getElementById('modelSelect').value.trim();
    const temperature = parseFloat(document.getElementById('temperatureInput').value);
    const maxTokens = parseInt(document.getElementById('maxTokensInput').value);
    const authMode = document.getElementById('authModeSelect').value;
    
    const newSettings = {
      provider: provider,
      host: host,
      apiKey: apiKey,
      model: model,
      temperature: temperature,
      maxTokens: maxTokens,
      authMode: authMode
    };

    console.log('Saving settings:', newSettings);

    // Validate settings
    if (!newSettings.host) {
      this.showError('Please enter an API host URL');
      return;
    }

    // Only require API key in API mode (not web session mode)
    if (newSettings.authMode === 'api' && !newSettings.apiKey && newSettings.provider !== 'local' && newSettings.provider !== 'custom') {
      this.showError('Please enter an API key for API authentication mode');
      return;
    }

    if (!newSettings.model) {
      this.showError('Please select or enter a model name');
      return;
    }

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'setProviderSettings',
          settings: newSettings
        }, (response) => {
          if (response && response.success) {
            resolve();
          } else {
            reject(new Error('Failed to save settings'));
          }
        });
      });

      this.settings = newSettings;
      this.showSuccess('Settings saved successfully!');
      this.updateConnectionStatus();
      this.updateProviderStatus(newSettings.provider, newSettings.model);
      
      // Auto-test connection after saving
      setTimeout(() => this.testConnection(), 500);
      
    } catch (error) {
      this.showError('Failed to save settings: ' + error.message);
    }
  }

  async testConnection() {
    const testBtn = document.getElementById('testConnectionBtn');
    const originalText = testBtn.textContent;
    
    testBtn.textContent = 'Testing...';
    testBtn.disabled = true;

    try {
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'testConnection',
          settings: this.getCurrentFormSettings()
        }, resolve);
      });

      if (result.success) {
        this.showSuccess('Connection successful!');
        this.updateConnectionStatus('Connected', 'connected');
      } else {
        this.showError(`Connection failed: ${result.message || result.status}`);
        this.updateConnectionStatus('Error', 'error');
      }
    } catch (error) {
      this.showError('Test failed: ' + error.message);
      this.updateConnectionStatus('Error', 'error');
    } finally {
      testBtn.textContent = originalText;
      testBtn.disabled = false;
    }
  }

  getCurrentFormSettings() {
    const providerSelect = document.getElementById('providerSelect');
    const hostInput = document.getElementById('hostInput');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const modelSelect = document.getElementById('modelSelect');
    const temperatureInput = document.getElementById('temperatureInput');
    const maxTokensInput = document.getElementById('maxTokensInput');
    const authModeSelect = document.getElementById('authModeSelect');
    
    return {
      provider: providerSelect?.value || 'openai',
      host: hostInput?.value?.trim() || '',
      apiKey: apiKeyInput?.value?.trim() || '',
      model: modelSelect?.value?.trim() || '',
      temperature: parseFloat(temperatureInput?.value) || 0.7,
      maxTokens: parseInt(maxTokensInput?.value) || 800,
      authMode: authModeSelect?.value || 'api'
    };
  }

  async setDefaultProvider() {
    const providerSelect = document.getElementById('providerSelect');
    if (!providerSelect) {
      this.showError('Provider selection not available');
      return;
    }
    
    const currentProvider = providerSelect.value;
    
    try {
      await new Promise((resolve) => {
        chrome.storage.sync.set({ defaultProvider: currentProvider }, resolve);
      });
      
      this.updateDefaultProviderIndicator();
      this.showSuccess(`${this.getProviderDisplayName(currentProvider)} set as default provider`);
    } catch (error) {
      console.error('Error setting default provider:', error);
      this.showError('Failed to set default provider');
    }
  }

  async updateDefaultProviderIndicator() {
    const providerSelect = document.getElementById('providerSelect');
    const indicator = document.getElementById('defaultProviderIndicator');
    const setDefaultBtn = document.getElementById('setDefaultProviderBtn');
    
    // Check if elements exist before proceeding
    if (!providerSelect || !indicator || !setDefaultBtn) {
      return;
    }
    
    const currentProvider = providerSelect.value;
    
    try {
      const defaultProvider = await new Promise((resolve) => {
        chrome.storage.sync.get(['defaultProvider'], (result) => {
          resolve(result.defaultProvider);
        });
      });

      if (defaultProvider === currentProvider) {
        indicator.style.display = 'block';
        setDefaultBtn.disabled = true;
        setDefaultBtn.textContent = 'Current Default';
      } else {
        indicator.style.display = 'none';
        setDefaultBtn.disabled = false;
        setDefaultBtn.textContent = 'Set Default';
      }
    } catch (error) {
      console.error('Error updating default provider indicator:', error);
    }
  }

  getProviderDisplayName(provider) {
    const displayNames = {
      'openai': 'OpenAI',
      'gemini': 'Google Gemini',
      'claude.ai': 'Claude',
      'github': 'GitHub Models',
      'groq': 'Groq',
      'deepseek': 'DeepSeek',
      'perplexity': 'Perplexity',
      'azure': 'Azure OpenAI',
      'local': 'Local Models',
      'custom': 'Custom Endpoint'
    };
    return displayNames[provider] || provider;
  }

  async fetchModels() {
    console.log('fetchModels() called');
    const refreshBtn = document.getElementById('refreshModelsBtn');
    const modelSelect = document.getElementById('modelSelect');
    const modelHelpText = document.getElementById('modelHelpText');
    const modelLoader = document.getElementById('modelLoader');

    // Show loading state
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳';
    modelLoader.style.display = 'flex';
    modelHelpText.style.display = 'none';
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option value="">Loading models...</option>';

    try {
      const settings = this.getCurrentFormSettings();
      console.log('Fetching models with settings:', settings);
      console.log('Current provider for status:', settings.provider);
      
      const result = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'getModels',
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.host
        }, (response) => {
          console.log('Received getModels response:', response);
          console.log('Response models array:', response?.models);
          console.log('Response models length:', response?.models?.length);
          resolve(response);
        });
      });

      if (result && result.success) {
        console.log('🔍 Debug - result.models:', result.models);
        console.log('🔍 Debug - result.models type:', typeof result.models);
        console.log('🔍 Debug - result.models is array:', Array.isArray(result.models));
        console.log('🔍 Debug - result.models length:', result.models?.length);
        console.log('🔍 Debug - length > 0:', (result.models?.length > 0));
        console.log('🔍 Debug - models condition:', (result.models && result.models.length > 0));
        
        if (result.models && result.models.length > 0) {
          console.log('✅ Populating dropdown with', result.models.length, 'models');
          // Clear dropdown and populate with models
          modelSelect.innerHTML = '<option value="">Select a model...</option>';
          result.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelSelect.appendChild(option);
            console.log('📝 Added model option:', model);
          });
          
          console.log('📋 Dropdown now has', modelSelect.children.length, 'options');
          console.log('📋 Model select element:', modelSelect);
          
          // Try to restore previously selected model
          const currentSettings = await chrome.storage.sync.get(['model']);
          if (currentSettings.model && result.models.includes(currentSettings.model)) {
            modelSelect.value = currentSettings.model;
            console.log('🔄 Restored previous model:', currentSettings.model);
            // Update provider status display
            console.log('🔍 Updating status with provider:', settings.provider, 'model:', currentSettings.model);
            this.updateProviderStatus(settings.provider, currentSettings.model);
          } else if (!modelSelect.value) {
            // Set first model as default if no model is selected
            modelSelect.value = result.models[0];
            console.log('🎯 Set default model:', result.models[0]);
            // Update provider status display  
            console.log('🔍 Updating status with provider:', settings.provider, 'model:', result.models[0]);
            this.updateProviderStatus(settings.provider, result.models[0]);
          }
          
          // Show models information in help text
          let sourceText = '';
          switch (result.source) {
            case 'local-scan':
              sourceText = 'local server scan';
              break;
            case 'api':
              sourceText = `${settings.provider} API`;
              break;
            default:
              sourceText = `${settings.provider} API`;
          }
          
          let helpText = `Found ${result.models.length} models from ${sourceText}: ${result.models.slice(0, 3).join(', ')}${result.models.length > 3 ? '...' : ''}`;
          
          // Add message if present
          if (result.message) {
            helpText = result.message;
          }
          
          modelHelpText.textContent = helpText;
        } else {
          console.log('No models in successful response:', result);
          modelSelect.innerHTML = '<option value="">No models available</option>';
          modelHelpText.textContent = 'No models found. Please check your authentication settings.';
        }
      } else {
        console.error('fetchModels failed:', result);
        modelSelect.innerHTML = '<option value="">Authentication required</option>';
        
        // Show specific error message
        if (result && result.error) {
          const errorMessage = typeof result.error === 'string' ? result.error : JSON.stringify(result.error);
          if (errorMessage.includes('API key required')) {
            modelHelpText.textContent = `API key required for ${settings.provider}. Without authentication, cannot fetch models or send requests.`;
          } else if (errorMessage.includes('web-interface only')) {
            modelHelpText.textContent = `${settings.provider} only supports web interface. Use the website directly.`;
          } else if (errorMessage.includes('not available')) {
            modelHelpText.textContent = `Model API not available for ${settings.provider}.`;
          } else {
            modelHelpText.textContent = `Error: ${errorMessage}`;
          }
        } else {
          const authModeSelect = document.getElementById('authModeSelect');
          const currentAuthMode = authModeSelect ? authModeSelect.value : 'api';
          
          if (currentAuthMode === 'web') {
            modelHelpText.textContent = `Unable to fetch models in web session mode. Please capture web session first.`;
          } else {
            modelHelpText.textContent = 'Failed to fetch models. Please check your settings.';
          }
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      modelHelpText.textContent = `Error fetching models: ${error.message}. Please check your settings.`;
      modelSelect.innerHTML = '<option value="">Error loading models</option>';
    } finally {
      // Reset loading state
      refreshBtn.disabled = false;
      refreshBtn.textContent = '🔄';
      modelLoader.style.display = 'none';
      modelSelect.disabled = false;
      modelHelpText.style.display = 'inline';
    }
  }

  async sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || this.isStreaming) return;

    // Always refresh page context before sending message
    await this.loadPageContext();

    // Check if message is an automation command first
    if (await this.isAutomationCommand(message)) {
      return await this.executeAutomationFromChat(message);
    }

    // Ensure settings exist
    if (!this.settings) {
      console.error('🔧 Settings not loaded');
      this.showError('Settings not loaded. Please refresh the page.');
      return;
    }

    if (!this.settings.apiKey && this.settings.provider !== 'local') {
      this.showError('Please configure your AI provider in settings first.');
      this.showSettings();
      return;
    }

    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';
    this.adjustTextareaHeight(input);
    this.updateSendButton();

    // Show typing indicator
    const typingId = this.addTypingIndicator();
    
    this.isStreaming = true;
    this.updateStreamingUI(true);

    try {
      // Prepare messages with enhanced page context
      const messages = [...this.messages];
      
      // Get current provider and model settings
      const providerSelect = document.getElementById('providerSelect');
      const modelSelect = document.getElementById('modelSelect');
      const currentProvider = providerSelect ? providerSelect.value : this.settings.provider;
      const currentModel = (modelSelect && modelSelect.value) ? modelSelect.value : this.settings.model;
      
      console.log('🔧 Current provider for AI request:', currentProvider);
      console.log('🔧 Current model for AI request:', currentModel);
      console.log('🔧 DEBUG - modelSelect element:', modelSelect);
      console.log('🔧 DEBUG - modelSelect.value:', modelSelect?.value);
      console.log('🔧 DEBUG - modelSelect.selectedIndex:', modelSelect?.selectedIndex);
      console.log('🔧 DEBUG - modelSelect options count:', modelSelect?.options?.length);
      console.log('🔧 DEBUG - this.settings.model:', this.settings.model);
      console.log('🔧 DEBUG - Final currentModel after fallback:', currentModel);
      
      // Ensure model is not empty
      if (!currentModel) {
        console.error('🚨 No model selected! Using settings fallback.');
        console.error('🚨 Settings model:', this.settings.model);
        this.showError('No model selected. Please select a model in settings first.');
        this.showSettings();
        return;
      }
      
      // Add comprehensive system message with page context
      if (this.pageInfo && (this.pageInfo.title || this.pageInfo.content)) {
        let systemMessage = "You are a helpful AI assistant with browser automation capabilities.";
        
        if (this.pageInfo.title && this.pageInfo.url) {
          systemMessage += ` The user is currently viewing a webpage titled "${this.pageInfo.title}" at ${this.pageInfo.url}.`;
        }
        
        // Add page restriction information
        if (this.pageInfo.isRestricted) {
          systemMessage += `\n\n⚠️ IMPORTANT: This page is RESTRICTED for automation. This is a ${this.getPageType(this.pageInfo.url)} which cannot be automated due to browser security restrictions. You can only provide general information and suggest navigation to regular websites for automation.`;
        }
        
        if (this.pageInfo.content) {
          // DISABLED: Page content truncation - using full page source for analysis
          // User requested to always analyze complete page content
          let pageContent = this.pageInfo.content;
          console.log(`📄 Page content truncation DISABLED - using full content: ${pageContent.length} chars`);
          
          // ORIGINAL TRUNCATION CODE DISABLED:
          // const maxContentLength = 3000; // Limit page content to ~3000 chars to save tokens
          // if (pageContent.length > maxContentLength) {
          //   const keepStart = Math.floor(maxContentLength * 0.6); // 60% from start
          //   const keepEnd = Math.floor(maxContentLength * 0.3);   // 30% from end
          //   const startContent = pageContent.substring(0, keepStart);
          //   const endContent = pageContent.substring(pageContent.length - keepEnd);
          //   pageContent = `${startContent}
          //
          // [... Content truncated to save tokens. Original length: ${this.pageInfo.content.length} characters ...]
          //
          // ${endContent}`;
          //   console.log(`📄 Page content truncated: ${pageContent.length} chars (was ${this.pageInfo.content.length})`);
          // }
          
          // Include FULL page source for analysis
          systemMessage += ` Here is the page source and content:\n\n=== PAGE SOURCE ===\n${pageContent}\n=== END PAGE SOURCE ===`;
        }
        
        // Add automation capabilities context
        if (!this.pageInfo.isRestricted) {
          systemMessage += `\n\nAVAILABLE AUTOMATION ACTIONS:
You can help automate browser interactions using these advanced XPath-based actions:
- Mouse Events: click, hover, doubleClick, rightClick, mouseDown, mouseUp, scroll
- Keyboard Events: type, keyDown, keyUp, sendKeys (for key combinations like Ctrl+C)
- Form Actions: focus, blur, select, check, submit, reset, clearInput, uploadFile
- Drag & Drop: dragAndDrop, dragStart, drop
- Touch Events: touchStart, touchMove, touchEnd (mobile)
- Page Actions: refresh, goBack, goForward, navigate, newTab
- Content Manipulation: getText, setText, getAttribute, setAttribute, addClass, removeClass
- Visual Actions: highlight, hide, show, setStyle
- Waiting: wait, waitForElement, waitForText, waitForUrl
- Extract: extractPageElements (get all interactive elements)
- XPath Analysis: analyzePage (analyze all page elements and create XPath memory map for precise automation)

🔬 ENHANCED XPATH AUTOMATION SYSTEM:
The system automatically analyzes the page before each automation action:
1. Scans all interactive elements (buttons, inputs, links, forms)
2. Generates XPath selectors for each element with automation scoring
3. Creates a memory map of elements for precise targeting
4. Executes actions using XPath for maximum reliability

When user asks for automation, the system will automatically find the best XPath selector for the target element. You can also suggest using 'analyzePage' command to manually inspect all available interactive elements on the page.`;
        } else {
          systemMessage += `\n\n🚫 AUTOMATION DISABLED: Browser automation is not available on this page type. You can help with general questions but cannot perform any automation actions. Suggest navigating to a regular website for automation features.`;
        }
        
        // Insert system message at the beginning
        messages.unshift({
          role: 'system',
          content: systemMessage
        });
        
        console.log('📄 Added enhanced page context to request:', {
          title: this.pageInfo.title,
          url: this.pageInfo.url,
          isRestricted: this.pageInfo.isRestricted,
          contentLength: this.pageInfo.content?.length || 0,
          hasFullSource: !!this.pageInfo.content
        });
      }

      const response = await new Promise((resolve) => {
        // Show dynamic token info to user - with error handling
        try {
          const messageContainer = document.getElementById('chatMessages');
          if (messageContainer) {
            const tokenInfo = document.createElement('div');
            tokenInfo.className = 'token-optimization-info';
            tokenInfo.style.cssText = `
              background: #f0f8ff;
              border: 1px solid #4a90e2;
              border-radius: 8px;
              padding: 8px 12px;
              margin: 8px 0;
              font-size: 12px;
              color: #2c5aa0;
            `;
            tokenInfo.innerHTML = `🧠 Optimizing tokens for your request...`;
            messageContainer.appendChild(tokenInfo);

            chrome.runtime.sendMessage({
              action: 'sendAIMessage',
              data: {
                messages: messages,
                provider: currentProvider,
                model: currentModel,
                stream: false // We'll implement streaming later
              }
            }, (response) => {
              // Remove token info after response
              try {
                if (tokenInfo && tokenInfo.parentNode) {
                  tokenInfo.parentNode.removeChild(tokenInfo);
                }
              } catch (e) {
                console.log('Could not remove token info:', e);
              }
              resolve(response);
            });
          } else {
            // Fallback if no message container found
            chrome.runtime.sendMessage({
              action: 'sendAIMessage',
              data: {
                messages: messages,
                provider: currentProvider,
                model: currentModel || this.settings.model || 'gpt-oss:20b', // Triple fallback
                stream: false
              }
            }, resolve);
          }
        } catch (error) {
          console.log('Token info display error:', error);
          // Fallback to normal message sending
          chrome.runtime.sendMessage({
            action: 'sendAIMessage',
            data: {
              messages: messages,
              provider: currentProvider,
              model: currentModel || this.settings.model || 'gpt-oss:20b', // Triple fallback
              stream: false
            }
          }, resolve);
        }
      });

      this.removeTypingIndicator(typingId);

      console.log('🔍 Response received:', response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response.content:', response.content);
      console.log('🔍 Response.error:', response.error);
      console.log('🔍 Response.result:', response.result);
      console.log('🔍 Response.result keys:', response.result ? Object.keys(response.result) : 'No result object');

      if (response.error) {
        // Handle error object properly
        let errorMessage = 'An error occurred';
        
        if (typeof response.error === 'string') {
          errorMessage = response.error;
        } else if (response.error.message) {
          // Extract user-friendly error message
          const errorObj = response.error;
          
          if (errorObj.code === 'PROVIDER_ERROR' && errorObj.message.includes('402')) {
            errorMessage = `💳 Credit limit reached. Your OpenRouter account has insufficient credits to complete this request. Please add credits to your account or try a different provider.`;
          } else if (errorObj.message.includes('429')) {
            errorMessage = `⏰ Rate limit exceeded. Too many requests in a short time. Please wait a moment and try again.`;
          } else if (errorObj.message.includes('401')) {
            errorMessage = `🔑 Authentication failed. Please check your API key in settings.`;
          } else if (errorObj.message.includes('403')) {
            errorMessage = `🚫 Access denied. Your API key may not have permission for this request.`;
          } else {
            errorMessage = `❌ ${errorObj.message}`;
          }
        } else {
          errorMessage = `❌ ${JSON.stringify(response.error)}`;
        }
        
        this.addMessage('assistant', errorMessage);
        this.showError(response.error);
      } else {
        // Handle both regular response format and JSON-RPC format
        let content = '';
        
        if (response.result) {
          console.log('🔍 Processing JSON-RPC response');
          console.log('🔍 response.result:', response.result);
          console.log('🔍 response.result type:', typeof response.result);
          
          // Handle Gemini API format
          if (response.result.candidates && response.result.candidates[0] && response.result.candidates[0].content && response.result.candidates[0].content.parts) {
            content = response.result.candidates[0].content.parts[0].text;
            console.log('🔍 Extracted from Gemini candidates format:', content);
          } else if (response.result.choices && response.result.choices[0] && response.result.choices[0].message) {
            content = response.result.choices[0].message.content;
            console.log('🔍 Extracted from choices[0].message.content:', content);
          } else if (response.result.content) {
            content = response.result.content;
            console.log('🔍 Extracted from result.content:', content);
          } else if (typeof response.result === 'string') {
            content = response.result;
            console.log('🔍 Using result as string:', content);
          } else {
            console.log('🔍 Available result keys:', Object.keys(response.result));
            content = 'No content in response';
            console.log('🔍 No recognizable content structure');
          }
        } else if (response.content) {
          content = response.content;
          console.log('🔍 Extracted from response.content:', content);
        } else {
          content = 'No content in response';
          console.log('🔍 No content found in response');
        }
        
        console.log('🔍 Final content to display:', content);
        this.addMessage('assistant', content);
      }
    } catch (error) {
      this.removeTypingIndicator(typingId);
      this.addMessage('assistant', `Error: ${error.message}`);
      this.showError(`Failed to send message: ${error.message}`);
    } finally {
      this.isStreaming = false;
      this.updateStreamingUI(false);
    }
  }

  addMessage(role, content) {
    console.log('🔍 addMessage called with role:', role, 'content:', content);
    console.log('🔍 Content type:', typeof content, 'length:', content?.length);
    
    const messageObj = {
      role,
      content,
      timestamp: new Date()
    };
    
    this.messages.push(messageObj);
    this.renderMessage(messageObj);
    this.scrollToBottom();
  }

  parseMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML first to prevent XSS
    let html = text.replace(/[&<>"']/g, function(match) {
      const escapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });

    // Parse Markdown elements in order of complexity
    
    // Code blocks (triple backticks) - handle first to avoid conflicts
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Inline code (after bold/italic to avoid conflicts)
    html = html.replace(/`(.*?)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // Lists - improved handling
    // Split into lines for better list processing
    const lines = html.split('\n');
    let inList = false;
    let listType = '';
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isUnorderedItem = /^[\*\-\+] (.*)/.test(line);
      const isOrderedItem = /^\d+\. (.*)/.test(line);
      
      if (isUnorderedItem) {
        if (!inList || listType !== 'ul') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ul>');
          inList = true;
          listType = 'ul';
        }
        processedLines.push(line.replace(/^[\*\-\+] (.*)/, '<li>$1</li>'));
      } else if (isOrderedItem) {
        if (!inList || listType !== 'ol') {
          if (inList) processedLines.push(`</${listType}>`);
          processedLines.push('<ol>');
          inList = true;
          listType = 'ol';
        }
        processedLines.push(line.replace(/^\d+\. (.*)/, '<li>$1</li>'));
      } else {
        if (inList) {
          processedLines.push(`</${listType}>`);
          inList = false;
          listType = '';
        }
        processedLines.push(line);
      }
    }
    
    if (inList) {
      processedLines.push(`</${listType}>`);
    }
    
    html = processedLines.join('\n');
    
    // Line breaks and paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already structured
    if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>') && !html.includes('<ul>') && !html.includes('<ol>') && !html.includes('<pre>')) {
      html = '<p>' + html + '</p>';
    }
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<\/p>/g, '');
    
    return html;
  }

  renderMessage(message) {
    const container = document.getElementById('messagesContainer');
    
    // Remove welcome message if this is the first real message
    const welcomeMsg = container.querySelector('.welcome-message');
    if (welcomeMsg && this.messages.length > 0) {
      welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Use Markdown parsing for assistant messages, plain text for user messages
    if (message.role === 'assistant') {
      contentDiv.innerHTML = this.parseMarkdown(message.content);
    } else {
      contentDiv.textContent = message.content;
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = this.formatTime(message.timestamp);
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    container.appendChild(messageDiv);
  }

  addTypingIndicator() {
    const container = document.getElementById('messagesContainer');
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    
    typingDiv.id = id;
    typingDiv.className = 'message assistant';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    
    container.appendChild(typingDiv);
    this.scrollToBottom();
    return id;
  }

  removeTypingIndicator(id) {
    const indicator = document.getElementById(id);
    if (indicator) {
      indicator.remove();
    }
  }

  updateStreamingUI(isStreaming) {
    const sendBtn = document.getElementById('sendBtn');
    const stopBtn = document.getElementById('stopBtn');
    const input = document.getElementById('messageInput');

    if (isStreaming) {
      sendBtn.style.display = 'none';
      stopBtn.style.display = 'flex';
      input.disabled = true;
    } else {
      sendBtn.style.display = 'flex';
      stopBtn.style.display = 'none';
      input.disabled = false;
      this.updateSendButton();
    }
  }

  stopStreaming() {
    this.isStreaming = false;
    this.updateStreamingUI(false);
    // TODO: Implement actual streaming cancellation
  }

  updateSendButton() {
    const sendBtn = document.getElementById('sendBtn');
    const input = document.getElementById('messageInput');
    sendBtn.disabled = !input.value.trim() || this.isStreaming;
  }

  adjustTextareaHeight(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }

  updateConnectionStatus(status = null, type = null) {
    const statusEl = document.getElementById('connectionStatus');
    
    if (!statusEl) return;
    
    if (status && type) {
      statusEl.textContent = status;
      statusEl.className = `connection-status ${type}`;
    } else if (this.settings) {
      // For local provider, we don't need an API key - check if provider is configured
      const isLocalProvider = this.settings.provider === 'local';
      const hasApiKey = this.settings.apiKey && this.settings.apiKey.trim() !== '';
      const hasHost = this.settings.host && this.settings.host.trim() !== '';
      
      if (isLocalProvider && hasHost) {
        statusEl.textContent = 'Ready (Local)';
        statusEl.className = 'connection-status connected';
      } else if (!isLocalProvider && hasApiKey) {
        statusEl.textContent = 'Ready';
        statusEl.className = 'connection-status connected';
      } else {
        statusEl.textContent = 'Not configured';
        statusEl.className = 'connection-status error';
      }
    } else {
      statusEl.textContent = 'Not configured';
      statusEl.className = 'connection-status error';
    }
  }

  showChat() {
    // Show tab navigation
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
      tabNavigation.style.display = 'flex';
    }

    // Restore settings view to original position if it was moved
    const settingsView = document.getElementById('settingsView');
    if (settingsView && settingsView.getAttribute('data-original-parent')) {
      // If settings view was moved to body, restore it to original position
      if (settingsView.parentElement === document.body) {
        const originalParentId = settingsView.getAttribute('data-original-parent');
        const originalParent = originalParentId ? document.getElementById(originalParentId) : document.querySelector('#app');
        if (originalParent) {
          originalParent.appendChild(settingsView);
        }
        settingsView.removeAttribute('data-original-parent');
      }
      
      // Reset styles
      settingsView.style.display = 'none';
      settingsView.style.position = '';
      settingsView.style.top = '';
      settingsView.style.left = '';
      settingsView.style.right = '';
      settingsView.style.bottom = '';
      settingsView.style.zIndex = '';
      settingsView.style.backgroundColor = '';
      settingsView.style.width = '';
      settingsView.style.height = '';
      settingsView.style.overflow = '';
    } else if (settingsView) {
      settingsView.style.display = 'none';
    }
    
    // Hide logs view
    const logsView = document.getElementById('logsView');
    if (logsView) {
      logsView.style.display = 'none';
    }
    
    // Show chat view with tab system
    document.getElementById('chatView').style.display = 'flex';
    
    // Switch to chat tab and restore tab content visibility
    this.switchTab('chat');
    this.currentView = 'chat';
  }

  showSettings() {
    console.log('🎛️ showSettings() called');
    
    // Hide all tab contents and navigation
    const tabContents = document.querySelectorAll('.tab-content');
    console.log('🎛️ Found tab contents:', tabContents.length);
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    // Hide tab navigation
    const tabNavigation = document.querySelector('.tab-navigation');
    if (tabNavigation) {
      tabNavigation.style.display = 'none';
      console.log('🎛️ Tab navigation hidden');
    }

    // Hide all main views
    const chatView = document.getElementById('chatView');
    const logsView = document.getElementById('logsView');
    const settingsView = document.getElementById('settingsView');
    
    console.log('🎛️ Views found:', {
      chatView: !!chatView,
      logsView: !!logsView, 
      settingsView: !!settingsView
    });
    
    if (chatView) {
      chatView.style.display = 'none';
      console.log('🎛️ Chat view hidden');
    }
    if (logsView) {
      logsView.style.display = 'none';
      console.log('🎛️ Logs view hidden');
    }
    if (document.getElementById('automationView')) {
      document.getElementById('automationView').style.display = 'none';
      console.log('🎛️ Automation view hidden');
    }
    if (document.getElementById('notesView')) {
      document.getElementById('notesView').style.display = 'none';
      console.log('🎛️ Notes view hidden');
    }

    // Show settings view with multiple approaches
    if (settingsView) {
      // Debug parent elements
      console.log('🎛️ Settings view parent:', settingsView.parentElement);
      console.log('🎛️ Settings view parent display:', window.getComputedStyle(settingsView.parentElement).display);
      
      // Remove the inline style that might be hiding it
      settingsView.removeAttribute('style');
      
      // Check all parent elements up to body
      let parent = settingsView.parentElement;
      while (parent && parent !== document.body) {
        console.log('🎛️ Parent element:', parent.tagName, parent.id, parent.className);
        console.log('🎛️ Parent display:', window.getComputedStyle(parent).display);
        parent = parent.parentElement;
      }
      
      // Create overlay approach - move element to body temporarily
      const originalParent = settingsView.parentElement;
      const originalNextSibling = settingsView.nextElementSibling;
      
      // Move to body as first child
      document.body.insertBefore(settingsView, document.body.firstChild);
      
      // Explicitly set display and visibility with overlay styles
      settingsView.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 9999 !important;
        background-color: white !important;
        width: 100vw !important;
        height: 100vh !important;
        overflow-y: auto !important;
        margin: 0 !important;
        padding: 0 !important;
      `;
      
      // Store original position info for restoration
      settingsView.setAttribute('data-original-parent', originalParent ? originalParent.id : '');
      
      // Scroll to top to ensure it's visible
      settingsView.scrollIntoView({ behavior: 'instant', block: 'start' });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      
      console.log('🎛️ Settings view shown with style:', settingsView.style.cssText);
      console.log('🎛️ Settings view computed style:', window.getComputedStyle(settingsView).display);
      console.log('🎛️ Settings view bounding rect:', settingsView.getBoundingClientRect());
    } else {
      console.error('🎛️ Settings view not found!');
    }
    this.currentView = 'settings';
  }

  showLogs() {
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('settingsView').style.display = 'none';
    document.getElementById('logsView').style.display = 'block';
    this.currentView = 'logs';
    this.loadChatLogs();
    this.loadAutomationHistory();
  }

  startNewChat() {
    // Clear the messages array
    this.messages = [];
    
    // Clear the messages container and restore welcome message
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <div class="welcome-icon">🤖</div>
          <h2>Welcome to ChromeAiAgent</h2>
          <p id="welcomeText">Start a conversation with your AI assistant. I can help you with questions about this page or anything else!</p>
        </div>
      `;
    }
    
    // Clear the input field
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.value = '';
      messageInput.style.height = 'auto';
    }
    
    // Reset streaming state
    this.isStreaming = false;
    this.updateStreamingUI(false);
    
    // Show chat view if not already visible
    if (this.currentView !== 'chat') {
      this.showChat();
    }
    
    console.log('🔄 Started new chat - messages cleared');
  }

  showError(message) {
    // TODO: Implement proper toast/notification system
    console.error('ChromeAiAgent Error:', message);
    
    let displayMessage = 'An error occurred';
    
    if (typeof message === 'string') {
      displayMessage = message;
    } else if (message && message.message) {
      displayMessage = message.message;
    } else if (message) {
      displayMessage = JSON.stringify(message);
    }
    
    alert('Error: ' + displayMessage);
  }

  showSuccess(message) {
    // TODO: Implement proper toast/notification system
    console.log('ChromeAiAgent Success:', message);
    alert('✅ ' + message);
  }

  scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
  }

  formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Authentication Mode Management
  handleAuthModeChange(mode) {
    console.log('🔐 handleAuthModeChange called with mode:', mode);
    
    const apiKeyGroup = document.getElementById('apiKeyGroup');
    const webSessionGroup = document.getElementById('webSessionGroup');
    
    console.log('🔐 UI Elements found:', {
      apiKeyGroup: !!apiKeyGroup,
      webSessionGroup: !!webSessionGroup
    });
    
    if (mode === 'web') {
      console.log('🔐 Switching to web session mode');
      if (apiKeyGroup) apiKeyGroup.style.display = 'none';
      if (webSessionGroup) webSessionGroup.style.display = 'block';
      console.log('🔐 Calling checkWebSessionStatus...');
      this.checkWebSessionStatus();
    } else {
      console.log('🔐 Switching to API key mode');
      if (apiKeyGroup) apiKeyGroup.style.display = 'block';
      if (webSessionGroup) webSessionGroup.style.display = 'none';
    }
    
    // Save auth mode preference
    console.log('🔐 Saving auth mode to storage:', mode);
    chrome.storage.sync.set({ authMode: mode }, () => {
      console.log('🔐 Auth mode saved successfully');
    });
  }

  async openProviderWebsite() {
    console.log('🌐 openProviderWebsite called');
    const provider = document.getElementById('providerSelect').value;
    console.log('🌐 Current provider:', provider);
    
    const providerUrls = {
      'openai': 'https://chat.openai.com/',
      'anthropic': 'https://claude.ai/chats',
      'claude.ai': 'https://claude.ai/chats',
      'gemini': 'https://gemini.google.com/app',
      'github': 'https://github.com/marketplace/models',
      'groq': 'https://console.groq.com/playground',
      'deepseek': 'https://chat.deepseek.com/',
      'perplexity': 'https://www.perplexity.ai/'
    };
    
    const url = providerUrls[provider];
    console.log('🌐 Provider URL:', url);
    
    if (url) {
      console.log('🌐 Opening provider website in new tab:', url);
      try {
        await chrome.tabs.create({ url: url });
        console.log('🌐 Successfully opened provider website');
      } catch (error) {
        console.error('🌐 Error opening provider website:', error);
        alert('Error opening provider website: ' + error.message);
      }
    } else {
      console.warn('🌐 Web authentication not supported for provider:', provider);
      alert('Web authentication not supported for this provider');
    }
  }

  async captureWebSession() {
    console.log('📸 captureWebSession called');
    const provider = document.getElementById('providerSelect').value;
    const captureBtn = document.getElementById('captureSessionBtn');
    const sessionStatusText = document.getElementById('sessionStatusText');
    
    console.log('📸 Current provider:', provider);
    console.log('📸 UI Elements found:', {
      captureBtn: !!captureBtn,
      sessionStatusText: !!sessionStatusText
    });
    
    // Show loading state
    if (captureBtn) {
      captureBtn.disabled = true;
      captureBtn.innerHTML = '<span class="oauth-icon">⏳</span><span class="oauth-text">Capturing...</span>';
    }
    if (sessionStatusText) {
      sessionStatusText.textContent = 'Capturing session...';
    }
    
    try {
      console.log('📸 Sending captureWebSession message to background script...');
      // Send message to background script to capture session
      const response = await chrome.runtime.sendMessage({
        action: 'captureWebSession',
        provider: provider
      });
      
      console.log('📸 Received response from background script:', response);
      
      if (response && response.success) {
        console.log('📸 Session captured successfully:', response);
        if (sessionStatusText) sessionStatusText.textContent = 'Session captured successfully';
        const sessionStatus = document.getElementById('sessionStatus');
        if (sessionStatus) sessionStatus.className = 'session-status active';
        const clearBtn = document.getElementById('clearSessionBtn');
        if (clearBtn) clearBtn.style.display = 'block';
      } else {
        console.error('📸 Failed to capture session:', response);
        const errorMsg = response ? response.error : 'Unknown error';
        if (sessionStatusText) sessionStatusText.textContent = `Failed to capture session: ${errorMsg}`;
        const sessionStatus = document.getElementById('sessionStatus');
        if (sessionStatus) sessionStatus.className = 'session-status inactive';
      }
    } catch (error) {
      console.error('📸 Error capturing session:', error);
      if (sessionStatusText) sessionStatusText.textContent = 'Error capturing session';
      const sessionStatus = document.getElementById('sessionStatus');
      if (sessionStatus) sessionStatus.className = 'session-status inactive';
    } finally {
      console.log('📸 Resetting capture button state');
      if (captureBtn) {
        captureBtn.disabled = false;
        captureBtn.innerHTML = '<span class="oauth-icon">📸</span><span class="oauth-text">Capture Session</span>';
      }
    }
  }

  async clearWebSession() {
    console.log('🗑️ clearWebSession called');
    const provider = document.getElementById('providerSelect').value;
    console.log('🗑️ Current provider:', provider);
    
    try {
      console.log('🗑️ Sending clearWebSession message to background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'clearWebSession',
        provider: provider
      });
      
      console.log('🗑️ Received response from background script:', response);
      
      if (response && response.success) {
        console.log('🗑️ Session cleared successfully');
        const sessionStatusText = document.getElementById('sessionStatusText');
        const sessionStatus = document.getElementById('sessionStatus');
        const clearBtn = document.getElementById('clearSessionBtn');
        
        if (sessionStatusText) sessionStatusText.textContent = 'No active session';
        if (sessionStatus) sessionStatus.className = 'session-status inactive';
        if (clearBtn) clearBtn.style.display = 'none';
      } else {
        console.error('🗑️ Failed to clear session:', response);
      }
    } catch (error) {
      console.error('🗑️ Error clearing session:', error);
    }
  }

  async checkWebSessionStatus() {
    console.log('🔄 checkWebSessionStatus called');
    const provider = document.getElementById('providerSelect').value;
    const refreshBtn = document.getElementById('refreshSessionBtn');
    const sessionStatusText = document.getElementById('sessionStatusText');
    
    console.log('🔄 Current provider:', provider);
    console.log('🔄 UI Elements found:', {
      refreshBtn: !!refreshBtn,
      sessionStatusText: !!sessionStatusText
    });
    
    if (refreshBtn) {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '⏳';
    }
    
    try {
      console.log('🔄 Sending checkWebSession message to background script...');
      const response = await chrome.runtime.sendMessage({
        action: 'checkWebSession',
        provider: provider
      });
      
      console.log('🔄 Received response from background script:', response);
      
      if (response && response.hasSession) {
        console.log('🔄 Active session found:', response.sessionInfo);
        if (sessionStatusText) sessionStatusText.textContent = `Active session (${response.sessionInfo || 'authenticated'})`;
        const sessionStatus = document.getElementById('sessionStatus');
        const clearBtn = document.getElementById('clearSessionBtn');
        if (sessionStatus) sessionStatus.className = 'session-status active';
        if (clearBtn) clearBtn.style.display = 'block';
      } else {
        console.log('🔄 No active session found');
        if (sessionStatusText) sessionStatusText.textContent = 'No active session';
        const sessionStatus = document.getElementById('sessionStatus');
        const clearBtn = document.getElementById('clearSessionBtn');
        if (sessionStatus) sessionStatus.className = 'session-status inactive';
        if (clearBtn) clearBtn.style.display = 'none';
      }
    } catch (error) {
      console.error('🔄 Error checking session:', error);
      if (sessionStatusText) sessionStatusText.textContent = 'Error checking session';
      const sessionStatus = document.getElementById('sessionStatus');
      if (sessionStatus) sessionStatus.className = 'session-status inactive';
    } finally {
      console.log('🔄 Resetting refresh button state');
      if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄';
      }
    }
  }

  // OAuth Authentication Methods
  async authenticateWithProvider() {
    const provider = document.getElementById('providerSelect').value;
    const oauthBtn = document.getElementById('oauthSignInBtn');
    const authStatus = document.getElementById('authStatus');
    
    // Show loading state
    oauthBtn.disabled = true;
    oauthBtn.innerHTML = '<span class="oauth-icon">⏳</span><span class="oauth-text">Signing in...</span>';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'authenticateProvider',
        provider: provider
      });
      
      if (response.success) {
        this.showAuthStatus('Successfully signed in with ' + provider, 'success');
        this.updateOAuthUI(provider, true);
        // Clear API key field since we're using OAuth
        document.getElementById('apiKeyInput').value = '';
      } else {
        this.showAuthStatus('Authentication failed: ' + response.error, 'error');
        this.updateOAuthUI(provider, false);
      }
    } catch (error) {
      console.error('OAuth authentication error:', error);
      this.showAuthStatus('Authentication error: ' + error.message, 'error');
      this.updateOAuthUI(provider, false);
    } finally {
      oauthBtn.disabled = false;
    }
  }

  async signOutFromProvider() {
    const provider = document.getElementById('providerSelect').value;
    
    try {
      // Remove stored OAuth tokens
      await chrome.storage.sync.remove([
        `${provider}_auth_token`,
        `${provider}_auth_method`,
        `${provider}_refresh_token`
      ]);
      
      this.showAuthStatus('Signed out from ' + provider, 'info');
      this.updateOAuthUI(provider, false);
      
    } catch (error) {
      console.error('Sign out error:', error);
      this.showAuthStatus('Sign out failed: ' + error.message, 'error');
    }
  }

  updateOAuthUI(provider, isAuthenticated) {
    const oauthSignInBtn = document.getElementById('oauthSignInBtn');
    const oauthSignOutBtn = document.getElementById('oauthSignOutBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    
    // Update OAuth button text for specific providers
    const providerNames = {
      'github': 'GitHub',
      'google': 'Google',
      'openai': 'OpenAI',
      'anthropic': 'Anthropic'
    };
    
    const providerName = providerNames[provider] || provider;
    oauthSignInBtn.innerHTML = `<span class="oauth-icon">🔐</span><span class="oauth-text">Sign in with ${providerName}</span>`;
    
    if (isAuthenticated) {
      oauthSignInBtn.style.display = 'none';
      oauthSignOutBtn.style.display = 'flex';
      apiKeyInput.placeholder = 'Using OAuth authentication';
      apiKeyInput.disabled = true;
    } else {
      oauthSignInBtn.style.display = 'flex';
      oauthSignOutBtn.style.display = 'none';
      apiKeyInput.placeholder = 'Enter your API key';
      apiKeyInput.disabled = false;
    }
  }

  showAuthStatus(message, type) {
    const authStatus = document.getElementById('authStatus');
    authStatus.textContent = message;
    authStatus.className = `auth-status ${type}`;
    authStatus.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      authStatus.style.display = 'none';
    }, 5000);
  }

  async checkOAuthStatus() {
    const provider = document.getElementById('providerSelect').value;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getAuthToken',
        provider: provider
      });
      
      if (response && response.success && response.token && response.method === 'oauth') {
        this.updateOAuthUI(provider, true);
        this.showAuthStatus('Using OAuth authentication', 'success');
      } else {
        this.updateOAuthUI(provider, false);
      }
    } catch (error) {
      console.error('Error checking OAuth status:', error);
      this.updateOAuthUI(provider, false);
    }
  }

  supportsOAuth(provider) {
    // List of providers that support OAuth authentication
    const oauthProviders = ['github', 'google', 'openai', 'gemini', 'claude.ai'];
    return oauthProviders.includes(provider);
  }

  // Chat Logs Functionality
  async loadChatLogs() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getChatLogs',
        filters: this.getLogFilters(),
        limit: 50,
        offset: 0
      });

      if (response.success) {
        this.displayLogs(response.logs);
        this.updateLogStats(response.stats);
        this.setupLogEventListeners();
      } else {
        console.error('Failed to load chat logs:', response.error);
      }
    } catch (error) {
      console.error('Error loading chat logs:', error);
    }
  }

  getLogFilters() {
    const providerFilter = document.getElementById('providerFilter')?.value || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const searchTerm = document.getElementById('logSearchInput')?.value || '';
    
    return {
      provider: providerFilter,
      status: statusFilter,
      search: searchTerm
    };
  }

  displayLogs(logs) {
    const logsList = document.getElementById('logsList');
    if (!logsList) return;

    // Preserve automation history section if it exists
    const automationSection = logsList.querySelector('.automation-history-section');
    
    logsList.innerHTML = '';
    
    // Restore automation history section
    if (automationSection) {
      logsList.appendChild(automationSection);
    }

    if (logs.length === 0) {
      const noLogsDiv = document.createElement('div');
      noLogsDiv.className = 'no-logs';
      noLogsDiv.textContent = 'No chat logs found';
      logsList.appendChild(noLogsDiv);
      return;
    }

    logs.forEach(log => {
      const logElement = this.createLogElement(log);
      logsList.appendChild(logElement);
    });
  }

  createLogElement(log) {
    const logDiv = document.createElement('div');
    logDiv.className = 'log-entry';
    
    const timestamp = new Date(log.timestamp).toLocaleString();
    const status = log.success ? 'success' : 'error';
    const timing = log.timing ? `${log.timing}ms` : 'N/A';

    logDiv.innerHTML = `
      <div class="log-header">
        <div class="log-info">
          <span class="log-provider">${log.provider}</span>
          <span class="log-status ${status}">${status.toUpperCase()}</span>
          <span class="log-model">${log.model || 'Unknown'}</span>
          <span class="log-timing">${timing}</span>
        </div>
        <div class="log-timestamp">${timestamp}</div>
      </div>
      <div class="log-content">
        <div class="log-prompt">
          <strong>Prompt:</strong> ${this.truncateText(log.prompt, 500)}
        </div>
        ${log.response ? `
          <div class="log-response">
            <strong>Response:</strong> ${this.truncateText(log.response, 1000)}
          </div>
        ` : ''}
        ${log.error ? `
          <div class="log-error">
            <strong>Error:</strong> ${log.error}
          </div>
        ` : ''}
      </div>
      <div class="log-meta">
        <span>Source: ${log.source || 'Unknown'}</span>
        <button class="log-details-btn" data-log-id="${log.id}">
          Show Details
        </button>
      </div>
      <div class="log-details" id="details-${log.id}" style="display: none;">
        ${this.formatLogDetails(log)}
      </div>
    `;

    // Add event listener for the details button
    const detailsBtn = logDiv.querySelector('.log-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        this.toggleLogDetails(log.id);
      });
    }

    return logDiv;
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    
    // Handle different data types properly
    let textStr;
    if (typeof text === 'string') {
      textStr = text;
    } else if (typeof text === 'object') {
      // For objects, try to extract meaningful content
      if (text.content) {
        textStr = text.content;
      } else if (text.message) {
        textStr = text.message;
      } else if (text.text) {
        textStr = text.text;
      } else {
        // Fallback to JSON string for objects
        textStr = JSON.stringify(text, null, 2);
      }
    } else {
      textStr = String(text);
    }
    
    if (textStr.length <= maxLength) return textStr;
    return textStr.substring(0, maxLength) + '... <span class="truncation-indicator">(click "Show Details" for full text)</span>';
  }

  formatLogDetails(log) {
    // Handle response object properly
    let fullResponse = log.response || 'No response';
    if (typeof fullResponse === 'object') {
      if (fullResponse.content) {
        fullResponse = fullResponse.content;
      } else if (fullResponse.message) {
        fullResponse = fullResponse.message;
      } else if (fullResponse.text) {
        fullResponse = fullResponse.text;
      } else {
        fullResponse = JSON.stringify(fullResponse, null, 2);
      }
    }

    const details = {
      'ID': log.id,
      'Timestamp': new Date(log.timestamp).toISOString(),
      'Provider': log.provider,
      'Model': log.model,
      'Success': log.success,
      'Timing': log.timing ? `${log.timing}ms` : 'N/A',
      'Source': log.source,
      'Full Prompt': log.prompt,
      'Full Response': fullResponse,
      'Error': log.error || 'No error',
      'Request Payload': log.requestPayload ? JSON.stringify(log.requestPayload, null, 2) : 'N/A'
    };

    return Object.entries(details)
      .map(([key, value]) => {
        // Escape HTML for the value part
        const escapedValue = this.escapeHtml(String(value));
        return `<strong>${key}:</strong> <span class="detail-value">${escapedValue}</span>`;
      })
      .join('<br>');
  }

  toggleLogDetails(logId) {
    const detailsElement = document.getElementById(`details-${logId}`);
    if (detailsElement) {
      const isVisible = detailsElement.style.display !== 'none';
      detailsElement.style.display = isVisible ? 'none' : 'block';
      
      const button = detailsElement.previousElementSibling.querySelector('.log-details-btn');
      if (button) {
        button.textContent = isVisible ? 'Show Details' : 'Hide Details';
      }
    }
  }

  updateLogStats(stats) {
    const statsContainer = document.getElementById('logStats');
    if (!statsContainer || !stats) return;

    statsContainer.innerHTML = `
      <div class="stat-item">
        <div class="stat-value">${stats.total || 0}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.success || 0}</div>
        <div class="stat-label">Success</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.errors || 0}</div>
        <div class="stat-label">Errors</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${stats.avgTiming || 0}ms</div>
        <div class="stat-label">Avg Time</div>
      </div>
    `;
  }

  setupLogEventListeners() {
    // Search functionality
    const searchButton = document.getElementById('searchLogsBtn');
    const searchInput = document.getElementById('logSearchInput');
    
    if (searchButton) {
      searchButton.addEventListener('click', () => this.loadChatLogs());
    }
    
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.loadChatLogs();
        }
      });
    }

    // Filter functionality
    const providerFilter = document.getElementById('providerFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (providerFilter) {
      providerFilter.addEventListener('change', () => this.loadChatLogs());
    }
    
    if (statusFilter) {
      statusFilter.addEventListener('change', () => this.loadChatLogs());
    }

    // Action buttons
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    const exportLogsBtn = document.getElementById('exportLogsBtn');
    const refreshLogsBtn = document.getElementById('refreshLogsBtn');

    if (clearLogsBtn) {
      clearLogsBtn.addEventListener('click', () => this.clearChatLogs());
    }

    if (exportLogsBtn) {
      exportLogsBtn.addEventListener('click', () => this.exportChatLogs());
    }

    if (refreshLogsBtn) {
      refreshLogsBtn.addEventListener('click', () => this.loadChatLogs());
    }

    // Settings
    const logLimitInput = document.getElementById('maxLogsInput');
    const saveLogSettingsBtn = document.getElementById('saveLogSettingsBtn');

    if (saveLogSettingsBtn) {
      saveLogSettingsBtn.addEventListener('click', () => this.saveLogSettings());
    }
  }

  async clearChatLogs() {
    if (!confirm('Are you sure you want to clear all chat logs and automation history? This action cannot be undone.')) {
      return;
    }

    try {
      // Clear both chat logs and automation history
      const chatResponse = await chrome.runtime.sendMessage({
        action: 'clearChatLogs'
      });

      // Clear automation history
      await chrome.storage.local.remove('automationHistory');

      if (chatResponse.success) {
        // Clear the display immediately
        const logsList = document.getElementById('logsList');
        if (logsList) {
          logsList.innerHTML = '<div class="no-logs">No logs found</div>';
        }
        
        this.showSuccess('All logs cleared successfully');
      } else {
        this.showError('Failed to clear chat logs: ' + chatResponse.error);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      this.showError('Error clearing logs');
    }
  }

  async exportChatLogs() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getChatLogs',
        filters: {},
        limit: 10000,
        offset: 0
      });

      if (response.success && response.logs) {
        const dataStr = JSON.stringify(response.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `chrome-ai-agent-logs-${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        this.showSuccess('Chat logs exported successfully');
      } else {
        this.showError('Failed to export chat logs');
      }
    } catch (error) {
      console.error('Error exporting chat logs:', error);
      this.showError('Error exporting chat logs');
    }
  }

  async saveLogSettings() {
    const logLimitInput = document.getElementById('maxLogsInput');
    const logLimit = parseInt(logLimitInput?.value) || 1000;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'setChatLogLimit',
        limit: logLimit
      });

      if (response.success) {
        this.showSuccess('Log settings saved successfully');
      } else {
        this.showError('Failed to save log settings: ' + response.error);
      }
    } catch (error) {
      console.error('Error saving log settings:', error);
      this.showError('Error saving log settings');
    }
  }

  // Tab Management
  switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
      content.classList.remove('active');
      content.style.display = 'none';
    });

    // Remove active class from all tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    // Show selected tab content
    const targetContent = document.getElementById(`${tabName}View`);
    const targetButton = document.getElementById(`${tabName}Tab`);

    if (targetContent) {
      targetContent.classList.add('active');
      targetContent.style.display = 'flex';
    }

    if (targetButton) {
      targetButton.classList.add('active');
    }

    // Load content for specific tabs
    if (tabName === 'automation') {
      this.loadAutomationHistory();
    } else if (tabName === 'notes') {
      this.loadNotes();
    }

    this.currentView = tabName;
  }

  // Automation Methods
  async executeAutomationCommand() {
    const automationInput = document.getElementById('automationInput');
    const executeBtn = document.getElementById('executeBtn');
    
    if (!automationInput || !executeBtn) return;

    const command = automationInput.value.trim();
    if (!command) return;

    executeBtn.disabled = true;
    executeBtn.innerHTML = '<span class="execute-icon">⏳</span> Executing...';

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'automationCommand',
        command: command
      });

      if (response.success) {
        this.addAutomationResult(command, response.result, true);
        automationInput.value = '';
      } else {
        this.addAutomationResult(command, response.error, false);
      }
    } catch (error) {
      console.error('Automation command error:', error);
      this.addAutomationResult(command, error.message, false);
    } finally {
      executeBtn.disabled = false;
      executeBtn.innerHTML = '<span class="execute-icon">⚡</span> Execute';
    }
  }

  async executeQuickAction(command) {
    const automationInput = document.getElementById('automationInput');
    if (automationInput) {
      automationInput.value = command;
    }
    await this.executeAutomationCommand();
  }

  addAutomationResult(command, result, success) {
    const resultsContainer = document.getElementById('resultsContainer');
    if (!resultsContainer) return;

    // Remove "no results" message if it exists
    const noResults = resultsContainer.querySelector('.no-results');
    if (noResults) {
      noResults.remove();
    }

    const resultItem = document.createElement('div');
    resultItem.className = `result-item ${success ? 'result-success' : 'result-error'}`;

    const timestamp = new Date().toLocaleTimeString();
    
    resultItem.innerHTML = `
      <div class="result-header">
        <div class="result-command">${this.escapeHtml(command)}</div>
        <div class="result-timestamp">${timestamp}</div>
      </div>
      <div class="result-details">${this.escapeHtml(JSON.stringify(result, null, 2))}</div>
    `;

    resultsContainer.insertBefore(resultItem, resultsContainer.firstChild);

    // Keep only last 20 results
    const results = resultsContainer.querySelectorAll('.result-item');
    if (results.length > 20) {
      results[results.length - 1].remove();
    }

    // Scroll to top
    resultsContainer.scrollTop = 0;
  }

  clearAutomationResults() {
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="no-results">No automation commands executed yet.</div>';
    }
  }

  loadAutomationHistory() {
    // Load and display automation history from storage
    console.log('Loading automation history...');
    
    chrome.storage.local.get('automationHistory', (result) => {
      const history = result.automationHistory || [];
      console.log('Automation history loaded:', history.length, 'entries');
      
      if (history.length > 0) {
        this.displayAutomationHistory(history);
      }
    });
  }

  displayAutomationHistory(history) {
    const logsList = document.getElementById('logsList');
    if (!logsList) return;

    // Add automation history section
    const automationSection = document.createElement('div');
    automationSection.className = 'automation-history-section';
    automationSection.innerHTML = `
      <h3 class="history-section-title">🤖 Automation History</h3>
      <div class="automation-history-list"></div>
    `;

    const automationList = automationSection.querySelector('.automation-history-list');
    
    // Display recent automation entries (last 20)
    const recentHistory = history.slice(-20).reverse();
    
    recentHistory.forEach(entry => {
      const historyItem = document.createElement('div');
      historyItem.className = 'automation-history-item';
      
      const timestamp = new Date(entry.timestamp).toLocaleString();
      const command = entry.command || 'Unknown command';
      const url = entry.url || 'Unknown URL';
      const success = entry.result?.success !== false;
      
      historyItem.innerHTML = `
        <div class="history-item-header">
          <span class="history-timestamp">${timestamp}</span>
          <span class="history-status ${success ? 'success' : 'error'}">${success ? '✅' : '❌'}</span>
        </div>
        <div class="history-command">${this.escapeHtml(command)}</div>
        <div class="history-url">${this.escapeHtml(url)}</div>
      `;
      
      automationList.appendChild(historyItem);
    });

    // Insert automation history before existing content
    logsList.insertBefore(automationSection, logsList.firstChild);
  }

  // Notes Methods
  async loadNotes() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getAutomationNotes'
      });

      if (response.success) {
        this.displayNotes(response.notes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  }

  displayNotes(notes) {
    const notesContainer = document.getElementById('notesContainer');
    if (!notesContainer) return;

    if (!notes || notes.length === 0) {
      notesContainer.innerHTML = '<div class="no-notes">No notes generated yet. Use automation commands to create smart notes!</div>';
      return;
    }

    notesContainer.innerHTML = notes.map((note, index) => `
      <div class="note-item">
        <div class="note-header">
          <div>
            <div class="note-title">${this.escapeHtml(note.title)}</div>
            <a href="${note.url}" class="note-url" target="_blank">${note.url}</a>
          </div>
          <div class="note-timestamp">${new Date(note.timestamp).toLocaleString()}</div>
        </div>
        <div class="note-content">${this.escapeHtml(note.content)}</div>
        ${note.tags && note.tags.length > 0 ? `
          <div class="note-tags">
            ${note.tags.map(tag => `<span class="note-tag">${this.escapeHtml(tag)}</span>`).join('')}
          </div>
        ` : ''}
        <div class="note-actions">
          <button class="note-action-btn" onclick="navigator.clipboard.writeText('${this.escapeHtml(note.content)}')">📋 Copy</button>
          <button class="note-action-btn delete-note-btn" data-index="${index}">🗑️ Delete</button>
        </div>
      </div>
    `).join('');

    // Add delete handlers
    const deleteButtons = notesContainer.querySelectorAll('.delete-note-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        await this.deleteNote(index);
      });
    });
  }

  async deleteNote(index) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteNote',
        index: index
      });

      if (response.success) {
        await this.loadNotes(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  // Check if message contains automation commands
  async isAutomationCommand(message) {
    const automationKeywords = [
      'click', 'press', 'tap', 'type', 'enter', 'input', 'fill', 'complete',
      'scroll', 'navigate', 'go to', 'open', 'screenshot', 'extract', 'get',
      'collect', 'highlight', 'organize', 'take note', 'back', 'forward', 'refresh', 'reload'
    ];
    
    const lowerMessage = message.toLowerCase();
    return automationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Execute automation command from chat
  async executeAutomationFromChat(message) {
    const input = document.getElementById('messageInput');
    
    // Refresh page context before automation
    await this.loadPageContext();
    
    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';
    this.adjustTextareaHeight(input);
    this.updateSendButton();

    // Check if this is a navigation action that should work from any page
    const lowerMessage = message.toLowerCase();
    const isNavigationAction = lowerMessage.includes('new tab') || 
                              lowerMessage.includes('navigate to') || 
                              lowerMessage.includes('navigate http') ||
                              lowerMessage.includes('go to') ||
                              lowerMessage.includes('open') && (lowerMessage.includes('tab') || lowerMessage.includes('page'));

    // Check if page is restricted before attempting automation (except for navigation actions)
    // if (this.pageInfo && this.pageInfo.isRestricted && !isNavigationAction) {
    //   const restrictionMessage = `❌ Automation not available: This is a ${this.getPageType(this.// pageInfo.url)}. 
// 
    //   Browser security restrictions prevent automation on:
    //     • Chrome internal pages (chrome://)
    //     • Extension pages (chrome-extension://)
    //     • Web stores (Chrome Web Store, Firefox Add-ons, etc.)
    //     • Browser settings pages
    //         
    //     Please navigate to a regular website to use automation features, or use navigation // commands like        "open new tab with [URL]".`;
    //   
    //   this.addMessage('assistant', restrictionMessage);
    //   return;
    // }

    // Show typing indicator
    const typingId = this.addTypingIndicator();
    
    try {
      console.log('🤖 Executing automation command:', message);
      
      // Send automation command to background
      const response = await chrome.runtime.sendMessage({
        action: 'automationCommand',
        command: message
      });
      
      // Remove typing indicator
      this.removeTypingIndicator(typingId);
      
      if (response.success) {
        // Add successful automation result to chat
        let resultDetails = 'Command completed';
        if (response.result) {
          if (typeof response.result === 'object') {
            // Format object results nicely
            if (response.result.success && response.result.action) {
              resultDetails = `${response.result.action}${response.result.element ? ` on ${response.result.element}` : ''}`;
            } else {
              resultDetails = JSON.stringify(response.result, null, 2);
            }
          } else {
            resultDetails = response.result;
          }
        }
        const resultMessage = `✅ Automation executed successfully: ${resultDetails}`;
        this.addMessage('assistant', resultMessage);
        
        // Add automation log to history
        await this.logAutomationAction(message, response.result);
        
      } else {
        // Add error message to chat with better context
        let errorMessage = `❌ Automation failed: ${response.error || 'Unknown error'}`;
        
        // Add helpful context for common errors
        if (response.error && response.error.includes('cannot be scripted')) {
          errorMessage += `\n\n💡 This page cannot be automated due to browser security restrictions. Try navigating to a regular website.`;
        } else if (response.error && response.error.includes('Element not found')) {
          errorMessage += `\n\n💡 Try refreshing the page or using a different element selector.`;
        }
        
        this.addMessage('assistant', errorMessage);
      }
      
    } catch (error) {
      console.error('🤖 Automation command failed:', error);
      
      // Remove typing indicator
      this.removeTypingIndicator(typingId);
      
      // Add error message to chat with helpful context
      let errorMessage = `❌ Automation error: ${error.message}`;
      
      if (error.message.includes('cannot be scripted')) {
        errorMessage += `\n\n💡 This page type doesn't allow automation. Please navigate to a regular website to use automation features.`;
      }
      
      this.addMessage('assistant', errorMessage);
    }
  }

  // Log automation action for history
  async logAutomationAction(command, result) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        command,
        result,
        url: this.pageInfo?.url || 'unknown',
        title: this.pageInfo?.title || 'unknown'
      };
      
      // Send to background for storage
      await chrome.runtime.sendMessage({
        action: 'logAutomationAction',
        data: logEntry
      });
      
    } catch (error) {
      console.error('Failed to log automation action:', error);
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Function to extract page content - runs in the context of the webpage
function extractPageContent() {
  try {
    // Helper function to generate CSS selector for an element (defined in page context)
    function getElementSelector(element) {
      if (element.id) {
        return `#${element.id}`;
      }
      
      if (element.className) {
        const classes = element.className.split(' ').filter(cls => cls);
        if (classes.length > 0) {
          return `.${classes[0]}`;
        }
      }
      
      // Fallback to tag name with nth-child if needed
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(element) + 1;
          return `${element.tagName.toLowerCase()}:nth-child(${index})`;
        }
      }
      
      return element.tagName.toLowerCase();
    }
    
    // Get both HTML structure and text content for better AI understanding
    const pageData = {
      html: document.documentElement.outerHTML,
      text: '',
      elements: []
    };
    
    // Extract clean text content
    const textContent = document.body ? document.body.innerText || document.body.textContent : '';
    pageData.text = textContent
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    
    // Extract interactive elements for automation
    const interactiveElements = document.querySelectorAll(`
      button, input, textarea, select, a[href], 
      [onclick], [role="button"], [tabindex], 
      form, [contenteditable], img[alt], 
      h1, h2, h3, h4, h5, h6, 
      .btn, .button, .link, .menu, .nav
    `);
    
    interactiveElements.forEach((el, index) => {
      if (el.offsetParent !== null || el.tagName === 'INPUT') { // visible elements
        const elementInfo = {
          tag: el.tagName.toLowerCase(),
          id: el.id || '',
          className: el.className || '',
          text: (el.textContent || el.value || el.alt || '').trim().substring(0, 50),
          type: el.type || '',
          placeholder: el.placeholder || '',
          href: el.href || '',
          role: el.getAttribute('role') || '',
          selector: getElementSelector(el)
        };
        
        if (elementInfo.text || elementInfo.id || elementInfo.placeholder) {
          pageData.elements.push(elementInfo);
        }
      }
    });
    
    // Combine all information into a comprehensive page source
    let fullPageSource = `=== WEBPAGE INFORMATION ===
Title: ${document.title}
URL: ${window.location.href}

=== HTML SOURCE ===
${pageData.html}

=== INTERACTIVE ELEMENTS ===
${pageData.elements.map((el, i) => 
  `${i + 1}. ${el.tag}${el.id ? `#${el.id}` : ''}${el.className ? `.${el.className.split(' ')[0]}` : ''} - "${el.text}" (selector: ${el.selector})`
).join('\n')}

=== PAGE TEXT CONTENT ===
${pageData.text}`;
    
    // Limit total length but keep essential information
    if (fullPageSource.length > 200000) {
      // Truncate HTML but keep elements and text
      const htmlStart = fullPageSource.indexOf('=== HTML SOURCE ===') + 20;
      const htmlEnd = fullPageSource.indexOf('=== INTERACTIVE ELEMENTS ===');
      const beforeHtml = fullPageSource.substring(0, htmlStart);
      const afterHtml = fullPageSource.substring(htmlEnd);
      const truncatedHtml = pageData.html.substring(0, 80000) + '\n[HTML TRUNCATED...]';
      
      fullPageSource = beforeHtml + truncatedHtml + '\n\n' + afterHtml;
    }
    
    return fullPageSource;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return `Error extracting page content: ${error.message}`;
  }
}

// Helper function to generate CSS selector for an element
function getElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.split(' ').filter(cls => cls);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }
  
  // Fallback to tag name with nth-child if needed
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return `${element.tagName.toLowerCase()}:nth-child(${index})`;
    }
  }
  
  return element.tagName.toLowerCase();
}

// Global agent instance for onclick handlers
window.agent = null;

// Global function for log details toggle (accessible from onclick)
window.toggleLogDetails = function(logId) {
  console.log('🔍 toggleLogDetails called with ID:', logId);
  if (window.agent) {
    console.log('🔍 Calling agent.toggleLogDetails');
    window.agent.toggleLogDetails(logId);
  } else {
    console.error('🔍 window.agent not available');
  }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.agent = new ChromeAiAgent();
  console.log('🔍 Agent initialized and assigned to window.agent');
});