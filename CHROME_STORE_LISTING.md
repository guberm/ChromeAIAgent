# Chrome Web Store Listing Information

## Extension Name
ChromeAI Agent

## Short Description (132 characters max)
AI assistant extension that provides intelligent web browsing help with natural language conversation interface.

## Detailed Description
Transform your browsing experience with ChromeAI Agent - an intelligent assistant extension that brings AI-powered help directly to your browser.

🤖 **AI Assistant Features**
Access powerful AI capabilities from one convenient interface:
• Multiple AI service integrations
• Smart conversation interface
• Context-aware responses
• Professional and educational use cases

✨ **Key Features**
• Smart Chat Interface - Clean side panel accessible on any website
• Page Context Awareness - AI automatically understands your current page
• Conversation Logging - Complete chat history with search and export
• Rich Text Support - Formatted responses with markdown rendering
• Model Selection - Choose from different AI capabilities
• Default Settings - Configure your preferred AI service
• New Chat Function - Start fresh conversations easily
• Export Logs - Download conversation history as JSON

🛡️ **Privacy & Security**
• Local Storage - API keys stored securely in Chrome
• No Data Collection - Zero telemetry or analytics
• Secure Authentication - OAuth support for compatible services
• HTTPS Only - All communications encrypted

🔧 **Easy Setup**
1. Install the extension
2. Choose your AI provider
3. Enter API credentials or authenticate
4. Start getting AI assistance while browsing

Perfect for developers, researchers, writers, students, and professionals who want intelligent assistance while browsing the web.

## What's New (2.2.6)
- Enhanced build consistency and preservation of manual edits across versions
- Improved packaging with better exclusion filters and automatic Chrome Web Store zip creation
- Optimized file structure for Chrome Web Store: no development artifacts or unnecessary files
- Strengthened build pipeline stability and eliminated cyclic copy issues
- Refined tag versioning strategy to handle remote conflicts smoothly

## What's New (2.2.5)
- Full source/build sync so the loaded extension matches recent fixes
- More reliable compound automation flows (new tab + search) with real navigation waits
- Promise-aware injected actions; improved page readiness checks
- Gemini response parsing stabilized; logs show more content with a truncation indicator
- Clearer UI for restricted pages; avoids attempting unsupported actions

## What's New (2.2.4)
- Improved reliability for multi-step automation (including search flows and consent dialog handling)
- Better parsing for compound commands (e.g., open a new tab and search)
- Gemini response parsing fix in chat
- Chat logs now show more content with truncation indicators
- Clearer UI messaging for restricted pages (chrome://, Web Store)

## Category
Productivity

## Language
English

## Keywords/Tags
AI assistant, OpenAI, ChatGPT, Claude, Gemini, artificial intelligence, productivity, chat, automation, developer tools

## Website
https://github.com/guberm/ChromeAI-Agent

## Support URL
https://github.com/guberm/ChromeAI-Agent/issues

## Privacy Policy URL
https://github.com/guberm/ChromeAI-Agent/blob/master/PRIVACY.md

## Screenshots Required
1. Main chat interface showing conversation
2. Provider selection settings
3. Conversation logs page
4. Markdown rendering example
5. Multiple provider options

## Store Listing Images
- Small promotional tile: 440x280 pixels
- Large promotional tile: 920x680 pixels  
- Marquee promotional tile: 1400x560 pixels (optional)
- Screenshots: 1280x800 or 640x400 pixels

## Target Audience
- Developers and programmers
- Researchers and analysts
- Content creators and writers
- Students and educators
- Business professionals
- AI enthusiasts

## Pricing
Free (users provide their own API keys)

## Permissions Justification
- **storage**: Save user settings, AI provider configurations, and conversation logs locally in Chrome
- **sidePanel**: Provide dedicated chat interface accessible from any webpage
- **activeTab**: Get current page context and content to provide AI assistance relevant to what user is viewing
- **tabs**: Access page information and metadata to enhance AI responses with page context
- **identity**: Enable OAuth authentication with AI providers (Google, Microsoft Azure) for secure API access without storing credentials
- **cookies**: Maintain authentication sessions with AI provider services to avoid repeated logins and ensure seamless user experience
- **scripting**: Inject content scripts for advanced page analysis, element detection, and browser automation features
- **tabGroups**: Organize and manage browser tabs efficiently when performing multi-page automation tasks and AI-assisted workflows
- **host_permissions**: Connect securely to AI provider APIs (OpenAI, Claude, Gemini, etc.) and enable web automation on user-requested websites