# Privacy Policy for ChromeAI Agent

**Last Updated: September 12, 2025**

## Overview
ChromeAI Agent ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension handles your information.

## Information We Do NOT Collect
- **No Personal Data Collection**: We do not collect, store, or transmit any personal information
- **No Usage Analytics**: We do not track how you use the extension
- **No Conversation Monitoring**: We do not access, read, or store your AI conversations
- **No Telemetry**: We do not send any usage data to our servers

## Information Stored Locally
The extension stores the following information locally on your device using Chrome's storage APIs:
- **API Keys**: Your AI provider API keys (encrypted and stored locally)
- **Settings**: Your preferred AI providers and models
- **Conversation Logs**: Your chat history (stored locally, never transmitted to us)
- **Authentication Tokens**: OAuth tokens for supported providers (stored locally)

## Third-Party Services
When you use AI providers through our extension, you are subject to their privacy policies:
- OpenAI: https://openai.com/privacy/
- Anthropic: https://www.anthropic.com/privacy
- Google: https://policies.google.com/privacy
- And other AI providers you choose to use

**Important**: Your conversations are sent directly to the AI providers you select. We act only as a bridge and do not intercept or store this data.

## Data Security
- All API communications use HTTPS encryption
- API keys are stored using Chrome's secure storage APIs
- No data is transmitted to our servers
- All processing happens locally in your browser

## Permissions Explanation
Our extension requests the following permissions:
- **storage**: To save your settings and conversation logs locally
- **sidePanel**: To display the chat interface
- **activeTab**: To provide page context to AI assistants
- **tabs**: To access page titles and URLs for context
- **identity**: For OAuth authentication with AI providers
- **cookies**: To maintain authentication sessions
- **scripting**: To extract page content when requested
- **host_permissions**: To communicate with AI provider APIs

## Your Control
You have complete control over your data:
- Delete conversation logs anytime through the extension
- Remove API keys through the settings
- Uninstall the extension to remove all local data
- Export your conversation logs before deletion

## Children's Privacy
This extension is not intended for use by children under 13. We do not knowingly collect information from children under 13.

## Changes to This Policy
We may update this Privacy Policy from time to time. Any changes will be posted in our GitHub repository and reflected in the extension.

## Contact Us
If you have questions about this Privacy Policy, please contact us at:
- GitHub Issues: https://github.com/guberm/ChromeAI-Agent/issues
- Email: michael@guber.dev

## Open Source
This extension is open source. You can review our code at:
https://github.com/guberm/ChromeAI-Agent

---

**Summary**: We don't collect your data. Everything stays on your device. Your conversations go directly to the AI providers you choose, not through our servers.