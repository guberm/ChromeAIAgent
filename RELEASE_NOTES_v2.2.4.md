# ChromeAiAgent v2.2.4

Release date: 2025-09-15

## Highlights
- Reliable compound automation: “open a new tab and search …” now consistently lands on results
- Stronger search execution: consent dialog handling, realistic input events, and navigation waits
- Promise-aware injections: properly await async content scripts and page readiness
- Gemini response parsing fixed for side panel chat
- Chat logs: show more of the response with a clear truncation indicator
- Restricted pages: clearer UI behavior; avoid injections and surface helpful messages
- Build sync: background and sidepanel logic mirrored into `build/` for predictable runtime

## Changes
- background.js
  - performSearch(): broaden selectors, dispatch native events, short waits, consent handling
  - handleNewTabWithSearch(): wait and fallback to direct search results when needed
  - injectAndExecute(): resolve Promise-returning actions; readiness/load waits
  - executeAIPlan(): maintain currentTabId across navigation/new tabs
  - pageAnalysisScript: restored known-good implementation
- sidepanel.js
  - Gemini model list and model restoration improvements
  - Extract page content: hardened against `className.split` errors
  - Restricted page detection and messages adjusted
  - Log UI: truncation indicators and detail expansion

## Notes
- Chrome platform restrictions remain in effect: no DOM injection or capture on chrome://, Chrome Web Store, etc. The UI now communicates this more clearly.

## Upgrade Steps
1. Update the extension to v2.2.4 (manifests show 2.2.4)
2. Reload unpacked extension from the `build/` directory
3. Verify provider configuration and model selection
