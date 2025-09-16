# 🤖 ChromeAI Agent - Universal AI Assistant Chrome Extension

<div align="center">

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![Version](https://img.shields.io/badge/Version-2.3.0-brightgreen)
![AI Powered](https://img.shields.io/badge/AI-Powered-purple)
![Multi Provider](https://img.shields.io/badge/Multi-Provider-orange)
![Automation](https://img.shields.io/badge/Browser-Automation-red)

**The ultimate Chrome extension for AI-powered assistance with advanced browser automation and support for 10+ AI providers**

[🚀 Installation](#installation) • [✨ Features](#features) • [🔧 Setup](#setup) • [📖 Usage](#usage) • [🤝 Contributing](#contributing)

</div>

---

## 🌟 Overview

ChromeAI Agent is a powerful Chrome extension that brings multiple AI assistants directly to your browser with advanced automation capabilities. With support for OpenAI, Claude, Gemini, OpenRouter, and many more providers, you can chat with AI while browsing any website, extract page context, maintain conversation logs, and automate complex browser interactions with intelligent action planning.

### 🎯 Why ChromeAI Agent?

- 🌐 **Universal Access**: Works on any website
- 🔄 **Multi-Provider**: Support for 10+ AI services
- 📝 **Smart Context**: Automatically includes page information
- 💾 **Conversation Logs**: Complete chat history with export
- 🎨 **Markdown Support**: Rich text formatting in responses
- 🔧 **Easy Setup**: Simple configuration and API key management
- 🤖 **Advanced Automation**: Intelligent browser automation with action planning
- 🎯 **Enhanced Precision**: Temperature 0 AI for consistent automation results

---

## ✨ Features

## 🆕 What's New in 2.3.0

### 🧠 Strategic LLM Automation with Temperature 0 Precision
- **Revolutionary Strategic Analysis**: LLM now provides strategic reasoning for every automation task with temperature 0 for deterministic results
- **Website Intelligence System**: Automatic detection and analysis of website contexts (e-commerce, educational, social media, etc.)
- **Enhanced Multi-Step Automation**: Intelligent wait actions with proper page load detection and 5-second stability delays
- **JSON Response Reliability**: Improved parsing to handle malformed LLM responses with HTML tags and token markers
- **Advanced Action Planning**: Strategic automation intents with comprehensive risk assessment and next-step recommendations

### 🎯 Enhanced Automation Capabilities
- **Wait Action Support**: Proper `wait` action type handling for page loads and dynamic content
- **Page Load Stability**: 5-second post-load delays ensure pages are fully interactive before actions
- **Better Error Recovery**: Enhanced JSON parsing with fallback mechanisms for robust operation
- **Strategic Command Analysis**: LLM analyzes user commands with website context to determine optimal automation approach

### 🔧 Technical Improvements
- **Temperature 0 LLM Configuration**: All automation requests use temperature 0 for consistent, deterministic responses
- **Enhanced Token Limits**: Increased maxOutputTokens to 8000 for comprehensive strategic analysis
- **Robust Response Parsing**: Multiple fallback methods for extracting content from various LLM provider response formats
- **Optimized Content Processing**: Reduced HTML content limits to 50KB for faster processing while maintaining effectiveness

## 🆕 What's New in 2.2.6

- Enhanced build consistency: manual build edits preserved and synced across versions
- Improved packaging script with better exclusion filters and automatic zip creation
- Chrome Web Store package optimization: cleaner file structure, no development artifacts
- Build pipeline stability: eliminated cyclic copy issues and streamlined deployment process
- Tag versioning strategy: resolved remote conflicts with alternate tagging approach

## 🆕 What's New in 2.2.5

- Source and runtime build fully synchronized; all automation and UI fixes mirrored into `build/`
- Compound navigation + search flows hardened in background executor; reliable results landing
- Promise-aware script injection across XPath and legacy pipelines with page readiness checks
- Chat: Gemini response parsing stabilized; logs show more content with truncation hints
- Restricted page handling: clearer side panel messaging, avoids unsupported injections/capture
- Packaging: cleaned build script and exclude list for reproducible, smaller zip

## 🆕 What's New in 2.2.4

- More reliable multi-step automation on real sites (search flows, consent dialogs, navigation waits)
- Compound command parsing (e.g., “open a new tab and search …”) executes deterministically
- Gemini response parsing corrected in chat
- Chat logs show more content with a clear truncation indicator
- UI gracefully handles restricted pages (Chrome Web Store, chrome://, etc.) with clearer messaging
- Build synchronized: changes mirrored into `build/` so the loaded extension reflects updates

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
- 🤖 **Advanced Browser Automation** - Intelligent automation with action planning
- 🎯 **Enhanced Element Detection** - AI-powered element finding with temperature 0 precision
- ⚡ **Multi-Step Action Plans** - Every automation creates detailed 2-5 step execution plans
- 🎨 **Markdown Rendering** - Rich text formatting in responses
- 🔄 **Model Switching** - Change providers/models on the fly
- ⚙️ **Default Provider** - Set your preferred AI service
- 📤 **Export Logs** - Download conversation history
- 🆕 **New Chat** - Start fresh conversations easily

### 🤖 **Browser Automation System**

#### 🚀 **Action Planning Engine**
- **Intelligent Planning**: Every automation action generates 2-5 step execution plans
- **Step-by-Step Execution**: Real-time progress tracking with detailed logging
- **Temperature 0 Precision**: Deterministic AI responses for consistent automation
- **Enhanced Element Targeting**: Sophisticated relevance scoring to find the right elements
- **Anti-Pattern Detection**: Prevents common targeting errors (e.g., clicking avatars instead of navigation)

#### 🖱️ **Mouse & Click Actions**
- **Smart Clicking**: `click the login button`, `click submit`, `click the back button`
- **Advanced Targeting**: AI finds elements by text, context, and semantic meaning
- **Navigation Intelligence**: Distinguishes between navigation elements and profile/user elements
- **Double-Click & Right-Click**: Full mouse interaction support
- **Drag & Drop**: Move elements between locations

#### ⌨️ **Keyboard & Text Input**
- **Intelligent Typing**: `type "hello world" in the search box`
- **Form Field Detection**: Automatically finds and focuses input fields
- **Smart Text Replacement**: Clears existing content before typing new text
- **Keyboard Shortcuts**: Execute complex key combinations
- **Special Keys**: Tab, Enter, Arrow keys, Function keys

#### 📝 **Form Automation**
- **Smart Form Filling**: `fill out the registration form`
- **Field Recognition**: Identifies form fields by labels, placeholders, and context
- **Multiple Input Types**: Text inputs, dropdowns, checkboxes, radio buttons
- **File Uploads**: Handle file selection dialogs
- **Form Submission**: Automatic form validation and submission

#### 🪟 **Navigation & Page Control**
- **Intelligent Navigation**: `go back`, `go forward`, `refresh the page`
- **New Tab Management**: Open links in new tabs
- **URL Navigation**: Direct page navigation
- **Scroll Control**: Smart scrolling to elements or directions
- **Wait Commands**: Wait for elements, page loads, or specific conditions

#### 🔍 **Data Extraction & Analysis**
- **Content Extraction**: Get page text, element content, attributes
- **Smart Screenshots**: Capture full pages or specific elements
- **Element Information**: Extract URLs, images, form data
- **Page Analysis**: Comprehensive page structure understanding

#### 🎨 **Visual & Advanced Actions**
- **Element Highlighting**: Visual feedback for automation actions
- **Custom CSS Injection**: Style modifications on the fly
- **JavaScript Execution**: Run custom scripts when needed
- **Alert Handling**: Manage browser alerts and confirmations

### 🛡️ **Privacy & Security**
- 🔐 **Local Storage** - API keys stored securely in Chrome
- 🚫 **No Data Collection** - No telemetry or analytics
- 🎭 **OAuth Support** - Secure authentication for supported providers
- 🔒 **HTTPS Only** - All API communications encrypted

---

## 🚀 Installation

### Method 1: Chrome Web Store
1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/chromeaiagent/faaanahikgkfpecahodibkoehicliafn)
2. Search for "ChromeAI Agent"
3. Click "Add to Chrome"
4. Pin the extension for easy access

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

### 🔧 Development Setup

For developers who want to test with local servers:

1. Rename `manifest.json` to `manifest-prod.json`
2. Rename `manifest-dev.json` to `manifest.json`
3. Load the extension in developer mode

The development manifest includes localhost permissions for testing local AI servers.

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

### 🤖 Browser Automation

ChromeAI Agent now features an advanced automation system with intelligent action planning:

#### 🚀 **Action Planning System**
Every automation command creates a detailed 2-5 step execution plan:
```
Example: "click the back button"
📋 Action Plan:
1. Analyze page to locate "back button" element (1000ms)
2. Verify "back button" is clickable and visible (500ms)
3. Click on "back button" (500ms)
4. Validate click action was successful (500ms)

🚀 Executing Action Plan:
✅ Step 1 completed in 1200ms
✅ Step 2 completed in 450ms
✅ Step 3 completed in 680ms
✅ Step 4 completed in 320ms
🎯 Action Plan completed in 2650ms
```

#### 🎯 **Smart Automation Commands**
- **Navigation**: `click the back button`, `go to settings`, `scroll down`
- **Form Interaction**: `type "hello" in the search box`, `fill out the form`
- **Element Interaction**: `click the submit button`, `select the dropdown option`
- **Page Actions**: `take a screenshot`, `extract all links`, `refresh the page`

#### 🧠 **Enhanced Precision**
- **Temperature 0 AI**: Consistent, deterministic responses for reliable automation
- **Advanced Element Scoring**: Sophisticated algorithms to find the most relevant elements
- **Context-Aware Targeting**: Understands the difference between navigation buttons and profile elements
- **Anti-Pattern Detection**: Prevents common automation errors

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
