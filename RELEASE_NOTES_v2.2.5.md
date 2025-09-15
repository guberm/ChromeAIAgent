# ChromeAiAgent v2.2.5

Release date: 2025-09-15

## Highlights
- Finalized sync between source files and runtime `build/` so the loaded extension reflects all recent fixes
- Compound navigation + search automation flows reliably land on results (consent handling, input events, waits)
- Promise-aware injections: properly await async content scripts and ensure page readiness before/after actions
- Gemini response parsing stabilized in chat; chat logs display more content with a truncation indicator
- UI clarifies restrictions on chrome:// and store pages; avoids unsupported actions gracefully
- Packaging cleaned up for reproducible Web Store uploads

## Changes
- manifest.json, build/manifest.json
  - Version bump to 2.2.5
- background.js
  - Hardened `performSearch` injection; added `newTabWithSearch` handler
  - Added `waitForPageLoad` and `waitForPageReady` checks; navigation stability improvements
  - Improved `injectAndExecute` to await Promise results from content scripts
- sidepanel.js
  - Gemini parsing fixes; larger log preview with truncation indicator and details view
  - Restricted page UI messaging and safer content extraction
  - Automation history section in logs view
- build/
  - Mirrored background and sidepanel changes into runtime build for immediate effect

## Notes
- Chrome platform restrictions still apply (no DOM injection or capture on chrome://, Web Store); the UI communicates this clearly.

## Upgrade Steps
1. Reload the unpacked extension from the `build/` directory
2. Verify your provider settings and model selection
3. Test an automation command (e.g., "open new tab with google.com and search chrome extensions")
