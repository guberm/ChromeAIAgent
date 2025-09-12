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
      providerSelect.addEventListener('change', (e) => {
        console.log('Provider changed to:', e.target.value);
        this.updateProviderDefaults(e.target.value);
        this.updateDefaultProviderIndicator();
        
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
          title: tabs[0].title
        };
        
        // Extract page content if on a valid webpage
        if (tabs[0].url && !tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('chrome-extension://')) {
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
            // This is expected for some pages (chrome://, extensions, etc.)
          }
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

  updatePageContext() {
    const pageContextEl = document.getElementById('pageContext');
    const pageTitleEl = document.getElementById('pageTitle');
    
    if (this.pageInfo && this.pageInfo.title) {
      let displayTitle = this.pageInfo.title;
      if (displayTitle.length > 40) {
        displayTitle = displayTitle.substring(0, 37) + '...';
      }
      
      pageTitleEl.textContent = displayTitle;
      pageTitleEl.title = this.pageInfo.title; // Full title on hover
      pageContextEl.style.display = 'flex';
      
      console.log('📄 Page context updated:', {
        title: this.pageInfo.title,
        url: this.pageInfo.url,
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
  }

  async loadSettings() {
    this.settings = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, resolve);
    });

    // Load default provider preference
    const defaultProvider = await new Promise((resolve) => {
      chrome.storage.sync.get(['defaultProvider'], (result) => {
        resolve(result.defaultProvider);
      });
    });

    if (this.settings) {
      await this.populateSettingsForm();
    } else {
      // Set default to saved default provider or OpenAI if no settings
      const provider = defaultProvider || 'openai';
      this.updateProviderDefaults(provider);
    }

    // Update the default provider indicator
    this.updateDefaultProviderIndicator();
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
    elements.maxTokensInput.value = this.settings.maxTokens || 2048;
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
        host: 'http://localhost:1234/v1/chat/completions',
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
      if (!apiKeyInput.value || apiKeyInput.value === '') {
        apiKeyInput.value = 'local-no-key-required';
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
          action: 'saveSettings',
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
      maxTokens: parseInt(maxTokensInput?.value) || 2048,
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
          action: 'fetchModels',
          settings: settings
        }, (response) => {
          console.log('Received fetchModels response:', response);
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
          if (result.error.includes('API key required')) {
            modelHelpText.textContent = `API key required for ${settings.provider}. Without authentication, cannot fetch models or send requests.`;
          } else if (result.error.includes('web-interface only')) {
            modelHelpText.textContent = `${settings.provider} only supports web interface. Use the website directly.`;
          } else if (result.error.includes('not available')) {
            modelHelpText.textContent = `Model API not available for ${settings.provider}.`;
          } else {
            modelHelpText.textContent = `Error: ${result.error}`;
          }
        } else {
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

    if (!this.settings.apiKey) {
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
      // Prepare messages with page context
      const messages = [...this.messages];
      
      // Add system message with page context if available
      if (this.pageInfo && (this.pageInfo.title || this.pageInfo.content)) {
        let systemMessage = "You are a helpful AI assistant.";
        
        if (this.pageInfo.title && this.pageInfo.url) {
          systemMessage += ` The user is currently viewing a webpage titled "${this.pageInfo.title}" at ${this.pageInfo.url}.`;
        }
        
        if (this.pageInfo.content) {
          systemMessage += ` Here is the relevant content from the current page:\n\n${this.pageInfo.content}`;
        }
        
        systemMessage += "\n\nPlease use this context to provide more relevant and helpful responses to the user's questions.";
        
        // Insert system message at the beginning
        messages.unshift({
          role: 'system',
          content: systemMessage
        });
        
        console.log('📄 Added page context to request:', {
          title: this.pageInfo.title,
          url: this.pageInfo.url,
          contentLength: this.pageInfo.content?.length || 0
        });
      }

      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'sendAIMessage',
          data: {
            messages: messages,
            stream: false // We'll implement streaming later
          }
        }, resolve);
      });

      this.removeTypingIndicator(typingId);

      console.log('🔍 Response received:', response);
      console.log('🔍 Response keys:', Object.keys(response || {}));
      console.log('🔍 Response.content:', response.content);
      console.log('🔍 Response.error:', response.error);
      console.log('🔍 Response.result:', response.result);
      console.log('🔍 Response.result keys:', response.result ? Object.keys(response.result) : 'No result object');

      if (response.error) {
        this.addMessage('assistant', `Error: ${response.error}`);
        this.showError(response.error);
      } else {
        // Handle both regular response format and JSON-RPC format
        let content;
        
        if (response.result && response.jsonrpc) {
          // JSON-RPC format (MCP response)
          console.log('🔍 Processing JSON-RPC response');
          console.log('🔍 response.result:', response.result);
          console.log('🔍 response.result type:', typeof response.result);
          
          // Handle OpenAI-style response in MCP result
          if (response.result.choices && response.result.choices[0] && response.result.choices[0].message) {
            content = response.result.choices[0].message.content;
            console.log('🔍 Extracted from choices[0].message.content:', content);
          } else {
            // Check other possible content fields in result
            content = response.result.content || 
                     response.result.response || 
                     response.result.message || 
                     response.result.text ||
                     response.result.answer ||
                     (typeof response.result === 'string' ? response.result : null);
            console.log('🔍 Extracted from other result fields:', content);
          }
        } else {
          // Regular format
          console.log('🔍 Processing regular response format');
          content = response.content || response.response || response.message || response.text;
        }
        
        content = content || 'No response content found';
        console.log('🔍 Final content to display:', content);
        this.addMessage('assistant', content);
      }
    } catch (error) {
      this.removeTypingIndicator(typingId);
      this.addMessage('assistant', `Error: ${error.message}`);
      this.showError('Failed to send message: ' + error.message);
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
    
    if (status && type) {
      statusEl.textContent = status;
      statusEl.className = `connection-status ${type}`;
    } else if (this.settings.apiKey) {
      statusEl.textContent = 'Ready';
      statusEl.className = 'connection-status connected';
    } else {
      statusEl.textContent = 'Not configured';
      statusEl.className = 'connection-status error';
    }
  }

  showChat() {
    document.getElementById('chatView').style.display = 'flex';
    document.getElementById('settingsView').style.display = 'none';
    document.getElementById('logsView').style.display = 'none';
    this.currentView = 'chat';
  }

  showSettings() {
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('settingsView').style.display = 'block';
    document.getElementById('logsView').style.display = 'none';
    this.currentView = 'settings';
  }

  showLogs() {
    document.getElementById('chatView').style.display = 'none';
    document.getElementById('settingsView').style.display = 'none';
    document.getElementById('logsView').style.display = 'block';
    this.currentView = 'logs';
    this.loadChatLogs();
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
    alert('Error: ' + message);
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
      
      if (response.success && response.token && response.method === 'oauth') {
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

    logsList.innerHTML = '';

    if (logs.length === 0) {
      logsList.innerHTML = '<div class="no-logs">No chat logs found</div>';
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
          <strong>Prompt:</strong> ${this.truncateText(log.prompt, 200)}
        </div>
        ${log.response ? `
          <div class="log-response">
            <strong>Response:</strong> ${this.truncateText(log.response, 300)}
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
        <button class="log-details-btn" onclick="toggleLogDetails('${log.id}')">
          Show Details
        </button>
      </div>
      <div class="log-details" id="details-${log.id}" style="display: none;">
        ${this.formatLogDetails(log)}
      </div>
    `;

    return logDiv;
  }

  truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  formatLogDetails(log) {
    const details = {
      'ID': log.id,
      'Timestamp': new Date(log.timestamp).toISOString(),
      'Provider': log.provider,
      'Model': log.model,
      'Success': log.success,
      'Timing': log.timing ? `${log.timing}ms` : 'N/A',
      'Source': log.source,
      'Full Prompt': log.prompt,
      'Full Response': log.response || 'No response',
      'Error': log.error || 'No error',
      'Request Payload': JSON.stringify(log.requestPayload, null, 2)
    };

    return Object.entries(details)
      .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
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
    if (!confirm('Are you sure you want to clear all chat logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clearChatLogs'
      });

      if (response.success) {
        this.loadChatLogs(); // Refresh the display
        this.showSuccess('Chat logs cleared successfully');
      } else {
        this.showError('Failed to clear chat logs: ' + response.error);
      }
    } catch (error) {
      console.error('Error clearing chat logs:', error);
      this.showError('Error clearing chat logs');
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
}

// Function to extract page content - runs in the context of the webpage
function extractPageContent() {
  try {
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // Get main content areas (prioritize main content)
    const contentSelectors = [
      'main',
      'article', 
      '[role="main"]',
      '.main-content',
      '.content',
      'body'
    ];
    
    let mainContent = '';
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.innerText || element.textContent || '';
        break;
      }
    }
    
    // Clean up the text
    let content = mainContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Limit content length to prevent huge payloads
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...';
    }
    
    return content;
  } catch (error) {
    console.error('Error extracting page content:', error);
    return '';
  }
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