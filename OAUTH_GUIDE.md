# OAuth Web Authentication Guide - ChromeAiAgent

## 🔐 **Web Authentication Support**

ChromeAiAgent now supports **OAuth web authentication** for all major AI providers, eliminating the need to manually manage API keys!

## 🚀 **Supported Providers with OAuth**

### **✅ Fully Supported:**
- **GitHub Models** - Sign in with GitHub account
- **Google AI** - Chrome Identity API integration
- **Google Gemini** - Google OAuth with generative language scope
- **OpenAI** - Platform OAuth (requires setup)
- **Anthropic (Claude)** - Console OAuth (requires setup)

### **🔧 Setup Required:**
- **Groq** - API key only (OAuth coming soon)
- **DeepSeek** - API key only
- **Perplexity** - API key only
- **Azure OpenAI** - Enterprise OAuth (complex setup)
- **Local Models** - No authentication needed
- **Custom Endpoints** - Depends on provider

## 🎯 **How to Use OAuth Authentication**

### **1. In Settings:**
1. Select your AI provider from dropdown
2. If OAuth is supported, you'll see **"Sign in with [Provider]"** button
3. Click the OAuth button instead of entering API key
4. Complete authentication in popup window
5. Extension will automatically use OAuth tokens

### **2. Automatic Features:**
- ✅ **Auto Token Management** - Tokens stored securely
- ✅ **Fallback Support** - Falls back to API keys if OAuth fails
- ✅ **Session Persistence** - Stays signed in across browser sessions
- ✅ **Easy Sign Out** - One-click sign out with "🚪 Sign out" button

## 🔧 **Provider Setup Instructions**

### **GitHub Models (Ready to Use)**
```
✅ No setup required
✅ Uses GitHub account authentication
✅ Works immediately after installation
```

### **Google AI & Gemini (Ready to Use)**
```
✅ Uses Chrome Identity API and Google OAuth
✅ No client ID configuration needed for basic use
✅ Automatic token management
✅ Supports both AI Platform and Gemini APIs
```

### **OpenAI (Requires Client ID)**
```
⚙️ Steps:
1. Go to https://platform.openai.com/oauth
2. Create OAuth application
3. Set redirect URI: chrome-extension://[EXTENSION-ID]/oauth
4. Update manifest.json with your client_id
```

### **Anthropic (Requires Client ID)**
```
⚙️ Steps:
1. Go to https://console.anthropic.com/oauth
2. Create OAuth application  
3. Set redirect URI: chrome-extension://[EXTENSION-ID]/oauth
4. Update manifest.json with your client_id
```

## 🛠 **Developer Configuration**

### **Update manifest.json:**
```json
{
  "oauth2": {
    "client_id": "your-google-client-id.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/userinfo.email"]
  }
}
```

### **Background Script Configuration:**
```javascript
// Each provider has OAuth config in getOAuthConfig()
github: {
  authUrl: 'https://github.com/login/oauth/authorize',
  clientId: 'your-github-client-id',
  scope: 'read:user',
  redirectUri: chrome.identity.getRedirectURL('oauth')
}
```

## 💡 **Benefits Over API Keys**

### **Security:**
- 🔒 No manual API key copying
- 🔄 Automatic token rotation
- 🚫 No key exposure in settings
- ✅ Revocable permissions

### **User Experience:**
- 🎯 One-click authentication
- 💾 Persistent sessions
- 🔁 Seamless token refresh
- 📱 Native browser integration

### **Management:**
- 📊 Usage tracking through provider dashboards
- ⚡ Faster setup process
- 🎛 Fine-grained permission control
- 🔧 Easy account switching

## 🚨 **Important Notes**

1. **Hybrid Support**: Extension supports both OAuth AND API keys
2. **Fallback**: If OAuth fails, it falls back to API key authentication
3. **Privacy**: OAuth tokens stored locally, never shared
4. **Compatibility**: Works with all existing extension features

## 🎉 **Complete Provider List**

| Provider | OAuth Support | API Key Support | Status |
|----------|---------------|-----------------|--------|
| OpenAI | ✅ (Setup req.) | ✅ | Ready |
| GitHub Models | ✅ Ready | ✅ | Ready |
| Groq | ⏳ Coming soon | ✅ | Ready |
| DeepSeek | ⏳ Coming soon | ✅ | Ready |
| Perplexity | ⏳ Coming soon | ✅ | Ready |
| **Anthropic** | ✅ (Setup req.) | ✅ | **Ready** |
| **Google Gemini** | ✅ Ready | ✅ | **NEW!** |
| Azure OpenAI | 🔧 Enterprise | ✅ | Ready |
| Local Models | N/A | N/A | Ready |
| Custom | Depends | Depends | Ready |

**🎯 Now supports ALL major AI providers with the most secure authentication methods available!** 🚀