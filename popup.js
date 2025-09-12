// Popup script for ChromeAiAgent
document.addEventListener('DOMContentLoaded', async () => {
  // Get elements
  const providerSelect = document.getElementById('providerSelect');
  const modelSelect = document.getElementById('modelSelect');
  const refreshModelsBtn = document.getElementById('refreshModels');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatMessages = document.getElementById('chatMessages');
  const openChatBtn = document.getElementById('openChatBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const pageTitle = document.getElementById('pageTitle');
  const currentProvider = document.getElementById('currentProvider');
  const currentModel = document.getElementById('currentModel');

  let currentTab = null;

  // Initialize popup
  await initializePopup();

  // Event listeners
  providerSelect.addEventListener('change', onProviderChange);
  modelSelect.addEventListener('change', onModelChange);
  refreshModelsBtn.addEventListener('click', refreshModels);
  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  openChatBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.sidePanel.open({ windowId: tab.windowId });
      // Send message to show chat view
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          action: 'openSidePanel', 
          view: 'chat',
          pageInfo: {
            url: tab.url,
            title: tab.title
          }
        });
      }, 500);
      window.close();
    } catch (error) {
      console.error('Error opening side panel:', error);
    }
  });

  openSettingsBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.sidePanel.open({ windowId: tab.windowId });
      // Send message to show settings view
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          action: 'openSidePanel', 
          view: 'settings',
          pageInfo: {
            url: tab.url,
            title: tab.title
          }
        });
      }, 500);
      window.close();
    } catch (error) {
      console.error('Error opening settings:', error);
    }
  });

  async function initializePopup() {
    try {
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentTab = tab;
      
      // Update page title
      const title = tab.title || 'Unknown Page';
      pageTitle.textContent = title.length > 40 ? title.substring(0, 40) + '...' : title;
      
      // Load current settings
      const result = await chrome.storage.sync.get(['provider', 'model']);
      const provider = result.provider || 'openai';
      const model = result.model || '';
      
      providerSelect.value = provider;
      modelSelect.value = model;
      
      // Update header info
      currentProvider.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
      currentModel.textContent = model || 'No model selected';
      
      // Load models for current provider
      await refreshModels();
      
    } catch (error) {
      console.error('Error initializing popup:', error);
    }
  }

  async function onProviderChange() {
    const provider = providerSelect.value;
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    modelSelect.disabled = true;
    
    // Save provider
    await chrome.storage.sync.set({ provider });
    
    // Update header
    currentProvider.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
    currentModel.textContent = 'No model selected';
    
    // Refresh models
    await refreshModels();
  }

  async function onModelChange() {
    const model = modelSelect.value;
    
    // Save model
    await chrome.storage.sync.set({ model });
    
    // Update header
    currentModel.textContent = model || 'No model selected';
  }

  async function refreshModels() {
    const provider = providerSelect.value;
    refreshModelsBtn.textContent = '⏳';
    refreshModelsBtn.disabled = true;
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
    
    try {
      // Send message to background script to fetch models
      const response = await chrome.runtime.sendMessage({
        action: 'fetchModels',
        provider: provider
      });
      
      if (response.success && response.models.length > 0) {
        // Clear the dropdown and add models
        modelSelect.innerHTML = '<option value="">Select a model...</option>';
        response.models.forEach(model => {
          const option = document.createElement('option');
          option.value = model;
          option.textContent = model;
          modelSelect.appendChild(option);
        });
        
        // Try to restore previously selected model
        const result = await chrome.storage.sync.get(['model']);
        if (result.model && response.models.includes(result.model)) {
          modelSelect.value = result.model;
        }
      } else {
        modelSelect.innerHTML = '<option value="">No models available</option>';
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      modelSelect.innerHTML = '<option value="">Error loading models</option>';
    } finally {
      refreshModelsBtn.textContent = '🔄';
      refreshModelsBtn.disabled = false;
      modelSelect.disabled = false;
    }
  }

  async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;
    
    const provider = providerSelect.value;
    const model = modelSelect.value.trim();
    
    if (!model) {
      alert('Please select a model');
      return;
    }
    
    // Save current model
    await chrome.storage.sync.set({ model });
    currentModel.textContent = model;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input and disable send button
    messageInput.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    try {
      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'sendMessage',
        message: message,
        provider: provider,
        model: model,
        pageContext: {
          url: currentTab.url,
          title: currentTab.title
        }
      });
      
      if (response.success) {
        addMessageToChat('assistant', response.response);
      } else {
        addMessageToChat('assistant', 'Error: ' + (response.error || 'Failed to send message'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessageToChat('assistant', 'Error: Failed to connect to AI service');
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    }
  }

  function addMessageToChat(role, content) {
    // Remove welcome message if it exists
    const welcomeMsg = chatMessages.querySelector('.welcome-message');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});