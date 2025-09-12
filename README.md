# 🤖 ChromeAI Agent - Universal AI Assistant Chrome Extension

<div align="center">

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)
![Multi Provider](https://img.shields.io/badge/Multi-Provider-orange)

**The ultimate Chrome extension for AI-powered assistance with support for 10+ AI providers**

[🚀 Installation](#installation) • [✨ Features](#features) • [🔧 Setup](#setup) • [📖 Usage](#usage) • [🤝 Contributing](#contributing)

</div>

---

## 🌟 Overview

ChromeAI Agent is a powerful Chrome extension that brings multiple AI assistants directly to your browser. With support for OpenAI, Claude, Gemini, OpenRouter, and many more providers, you can chat with AI while browsing any website, extract page context, and maintain conversation logs.

### 🎯 Why ChromeAI Agent?

- 🌐 **Universal Access**: Works on any website
- 🔄 **Multi-Provider**: Support for 10+ AI services
- 📝 **Smart Context**: Automatically includes page information
- 💾 **Conversation Logs**: Complete chat history with export
- 🎨 **Markdown Support**: Rich text formatting in responses
- 🔧 **Easy Setup**: Simple configuration and API key management

---

## ✨ Features

### 🤖 **Multi-AI Provider Support**
- **OpenAI** - GPT-3.5, GPT-4, GPT-4 Turbo
- **Anthropic Claude** - Claude 3 Haiku, Sonnet, Opus
- **Google Gemini** - Gemini Pro, Gemini Ultra
- **OpenRouter** - Access to 50+ models from multiple providers
- **GitHub Models** - Free AI models via GitHub
- **Groq** - Ultra-fast inference
- **DeepSeek** - Coding-focused models
- **Perplexity** - Research and analysis
- **Azure OpenAI** - Enterprise-grade AI
- **Local Models** - Support for local AI servers

### 🔥 **Core Capabilities**
- 💬 **Smart Chat Interface** - Clean, intuitive side panel
- 🌐 **Page Context Awareness** - AI knows what page you're on
- 📊 **Conversation Logging** - Complete chat history with search
- 🎨 **Markdown Rendering** - Rich text formatting in responses
- 🔄 **Model Switching** - Change providers/models on the fly
- ⚙️ **Default Provider** - Set your preferred AI service
- 📤 **Export Logs** - Download conversation history
- 🆕 **New Chat** - Start fresh conversations easily

### 🛡️ **Privacy & Security**
- 🔐 **Local Storage** - API keys stored securely in Chrome
- 🚫 **No Data Collection** - No telemetry or analytics
- 🎭 **OAuth Support** - Secure authentication for supported providers
- 🔒 **HTTPS Only** - All API communications encrypted

---

## 🚀 Installation

### Method 1: Chrome Web Store (Coming Soon)
*Extension will be available on the Chrome Web Store*

### Method 2: Developer Mode (Current)

1. **Download the Extension**
   ```bash
   git clone https://github.com/guberm/ChromeAIAgent.git
   cd ChromeAIAgent
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `ChromeAIAgent` folder

3. **Pin the Extension**
   - Click the puzzle piece icon in Chrome toolbar
   - Pin "ChromeAI Agent" for easy access

---

## 🔧 Setup

### Step 1: Choose Your AI Provider

<details>
<summary><strong>🤖 OpenAI (Recommended)</strong></summary>

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account and get API key
3. In extension settings, select "OpenAI"
4. Enter your API key
5. Choose model (GPT-3.5-turbo, GPT-4, etc.)

**Cost**: Pay-per-use, ~$0.002 per 1K tokens
</details>

<details>
<summary><strong>🔄 OpenRouter (Best Value)</strong></summary>

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up and get API key
3. In extension settings, select "OpenRouter"
4. Enter your API key
5. Access 50+ models from multiple providers

**Cost**: Often 50-90% cheaper than direct APIs
</details>

<details>
<summary><strong>🆓 GitHub Models (Free)</strong></summary>

1. Visit [GitHub Models](https://github.com/marketplace/models)
2. Sign in with GitHub account
3. In extension settings, select "GitHub Models"
4. Use GitHub authentication
5. Access models like GPT-4o mini for free

**Cost**: Free tier available
</details>

<details>
<summary><strong>⚡ Groq (Fastest)</strong></summary>

1. Visit [Groq Console](https://console.groq.com/)
2. Create account and get API key
3. In extension settings, select "Groq"
4. Enter your API key
5. Enjoy ultra-fast responses

**Cost**: Free tier + pay-per-use
</details>

### Step 2: Configure Settings

1. Click the ChromeAI Agent icon
2. Go to Settings (gear icon)
3. Select your provider
4. Enter API key
5. Choose default model
6. Set as default provider (optional)

---

## 📖 Usage

### Basic Chat

1. **Open Side Panel**: Click the ChromeAI Agent icon
2. **Type Message**: Enter your question or prompt
3. **Send**: Press Enter or click send button
4. **Get Response**: AI responds with context about current page

### Advanced Features

#### 🌐 Page Context
The AI automatically knows:
- Current page title and URL
- Your browsing context
- Can reference page content in responses

#### 📊 Conversation Logs
- **View History**: Click "Show Logs" to see all conversations
- **Search Logs**: Filter by provider, model, or content
- **Export Data**: Download logs as JSON
- **Show Details**: View full request/response data

#### 🔄 Model Switching
- Change provider anytime during conversation
- Switch models without losing context
- Compare responses from different AIs

#### 🆕 Start Fresh
- Click "+" button to start new conversation
- Previous chat automatically saved to logs
- Clean slate for new topics

---

## 🔧 Development

### Project Structure
```
ChromeAIAgent/
├── manifest.json              # Extension manifest (v3)
├── background.js              # Service worker & API handling
├── sidepanel.html            # Main UI structure
├── popup.html                # Extension popup
├── css/
│   └── sidepanel.css         # Styling & markdown formatting
├── js/
│   └── sidepanel.js          # Main application logic
├── icons/                    # Extension icons
└── test-*.html              # Testing pages
```

### Key Components

- **ChatLogger**: Handles conversation persistence
- **ChromeAiAgent**: Main application class
- **Provider Management**: Multi-AI service integration
- **Markdown Parser**: Rich text rendering
- **OAuth Handler**: Secure authentication

### Adding New Providers

1. Add provider to `providerDefaults` in `sidepanel.js`
2. Add API endpoint to `getModelsEndpoint()` in `background.js`
3. Handle any special authentication in `sendAIRequest()`
4. Update HTML select options

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### 🐛 Bug Reports
- Use GitHub Issues
- Include Chrome version
- Provide steps to reproduce
- Include error logs if available

### 💡 Feature Requests
- Open GitHub Issue with "enhancement" label
- Describe the feature and use case
- Consider implementation complexity

### 🔧 Pull Requests
1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Submit PR with clear description

### 🧪 Testing
- Test with multiple AI providers
- Verify on different websites
- Check conversation logging
- Test markdown rendering

---

## 📋 Roadmap

### 🔜 Coming Soon
- [ ] Chrome Web Store release
- [ ] Custom system prompts
- [ ] Conversation templates
- [ ] File upload support
- [ ] Voice input/output

### 🚀 Future Plans
- [ ] Team collaboration features
- [ ] Plugin system for custom providers
- [ ] Advanced conversation analytics
- [ ] Mobile companion app
- [ ] Integration with productivity tools

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Thanks to all AI provider APIs
- Chrome Extension community
- Open source contributors
- Beta testers and early adopters

---

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/guberm/ChromeAIAgent/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/guberm/ChromeAIAgent/discussions)
- ⭐ **Star this repo** if you find it useful!

---

<div align="center">

**⭐ Star this repository if you find it useful!**

Made with ❤️ by developers, for developers

[🔝 Back to top](#-chromeai-agent---universal-ai-assistant-chrome-extension)

</div>