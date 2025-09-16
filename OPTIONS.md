# ChromeAiAgent Options

This document describes the runtime automation options available in the extension and what they do.

Settings (stored in `chrome.storage.local`):

- `automationPollTimeoutMs` (number, ms)
  - Default: 5000
  - Description: How long to poll after a click for navigation or new-tab detection. Increase this if pages take longer to open/redirect.

- `automationPollIntervalMs` (number, ms)
  - Default: 300
  - Description: Poll frequency while waiting for navigation or new tab. Lower values are more responsive but slightly heavier on resources.

- `followNewTabs` (boolean)
  - Default: true
  - Description: When true and a click opens a new tab, the automation will switch to that tab and continue subsequent steps there.

- `followNewTabsStrategy` (string)
  - Default: `newest`
  - Options: `newest`, `first`, `last`
  - Description: When multiple new tabs open from a single click, this determines which one to follow:
    - `newest`: follow the tab with the highest tab id (assumed newest)
    - `first`: follow the first detected new tab
    - `last`: follow the last detected new tab in the list

Usage
1. Open the extension options page (Extensions → ChromeAiAgent → Options).
2. Adjust settings as needed and click Save.
3. The background service worker listens for changes and will apply them immediately.

Notes
- If the background script cannot access tabs due to restricted pages (e.g., chrome://), it will log warnings and continue.
- If you need a different tab-selection policy (e.g., match URL to domain), open an issue or request an enhancement and it can be implemented.
