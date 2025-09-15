# Release Notes for v2.2.5

## 🚀 What's New in 2.2.5

- **Capture & Summarize Feature:**
  - New "Capture & Summarize" button in the side panel lets you take a screenshot of the visible tab and get an instant AI-generated summary.
  - Works with all providers; Gemini models will reference the screenshot for vision-style summarization (textual fallback for now).
  - Summary includes page title, key highlights, warnings/errors, and next recommended actions.
- **Reliability Improvements:**
  - All changes are mirrored to the build folder for runtime consistency.
  - Minor UI and automation robustness fixes.

---

**Upgrade Instructions:**
- Remove any previous version of the extension from Chrome.
- Load the `build/` folder as an unpacked extension.

**Feedback & Issues:**
- Please report bugs or feature requests at https://github.com/guberm/ChromeAI-Agent/issues
