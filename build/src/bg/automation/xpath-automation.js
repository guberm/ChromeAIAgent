// Persist helper: store last selected tab(s) and keep a short history
async function persistLastSelected(entry) {
  try {
    if (!chrome || !chrome.storage || !chrome.storage.local || !chrome.storage.local.get) return;
    const data = await new Promise((resolve) => chrome.storage.local.get({ lastSelectedTabs: [], lastSelectedHistorySize: 20 }, resolve));
    const arr = Array.isArray(data.lastSelectedTabs) ? data.lastSelectedTabs : [];
    const maxSize = Number(data.lastSelectedHistorySize) || 20;
    arr.push(entry);
    while (arr.length > maxSize) arr.shift();
    const payload = { lastSelectedTabs: arr, lastSelectedTab: entry };
    chrome.storage.local.set(payload, () => { try { /* no-op */ } catch(e) {} });
  } catch (e) {
    console.warn('persistLastSelected failed:', e && e.message);
  }
}

// Enhanced XPath-based element execution
function xpathAutomationScript(action, params) {
  const pageAnalysis = window.chromeAiAgentPageAnalysis;
  if (!pageAnalysis) {
    const analysisResult = pageAnalysisScript();
    if (!analysisResult.success) {
      return { success: false, error: 'Failed to analyze page for XPath automation' };
    }
  }
  function findElementByXPath(xpath) {
    try {
      const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
      return result.singleNodeValue;
    } catch (error) { return null; }
  }
  function findElementForAutomation(selector, actionType) {
    const analysis = window.chromeAiAgentPageAnalysis;
    if (selector.startsWith('/') || selector.startsWith('//')) {
      const element = findElementByXPath(selector); if (element) return element;
    }
    let candidates = [];
    if (actionType === 'click') candidates = [...analysis.categories.buttons, ...analysis.categories.links];
    else if (actionType === 'type' || actionType === 'input') candidates = analysis.categories.inputs;
    else candidates = analysis.interactiveElements;
    const selectorLower = selector.toLowerCase().replace(/['"]/g, '');
    let bestMatch = candidates.find(elem => (elem.text?.toLowerCase() || '') === selectorLower);
    if (!bestMatch) bestMatch = candidates.find(elem => { const text = elem.text?.toLowerCase() || ''; return text.includes(selectorLower) || selectorLower.includes(text); });
    if (!bestMatch) bestMatch = candidates.find(elem => (
      elem.id?.toLowerCase().includes(selectorLower) ||
      elem.attributes.name?.toLowerCase().includes(selectorLower) ||
      elem.attributes.placeholder?.toLowerCase().includes(selectorLower) ||
      elem.attributes['aria-label']?.toLowerCase().includes(selectorLower) ||
      elem.attributes.title?.toLowerCase().includes(selectorLower) ||
      elem.attributes.alt?.toLowerCase().includes(selectorLower) ||
      elem.classes.some(cls => cls.toLowerCase().includes(selectorLower))
    ));
    if (bestMatch) return findElementByXPath(bestMatch.xpath);
    const allElements = document.querySelectorAll('button, a, input, [role="button"], [onclick]');
    for (const element of allElements) {
      const text = element.textContent?.toLowerCase() || '';
      if (text.includes(selectorLower) || selectorLower.includes(text)) return element;
    }
    try { const cssResult = document.querySelector(selector); if (cssResult) return cssResult; } catch {}
    return null;
  }
  const xpathAutomation = {
    click: (selector) => {
      const element = findElementForAutomation(selector, 'click');
      if (!element) return { success: false, error: 'Element not found for click', selector };
      try {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        ['mousedown','mouseup','click'].forEach(type => element.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window, clientX: centerX, clientY: centerY, button: 0, buttons: 1 })));
        if (element.tagName === 'BUTTON' || element.role === 'button') {
          element.focus(); setTimeout(() => { try { element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', keyCode: 13, which: 13 })); } catch {} }, 50);
        }
        element.click();
        return { success: true, action: 'click', selector };
      } catch (e) {
        try { element.click(); return { success: true, action: 'click', selector, warning: 'Enhanced click failed' }; } catch (basicErr) { return { success: false, error: 'All click strategies failed', selector, enhancedError: e.message, basicError: basicErr.message }; }
      }
    },
    type: (selector, text) => {
      const element = findElementForAutomation(selector, 'type'); if (!element) return { success: false, error: 'Element not found for typing', selector };
      element.focus(); element.value = text; element.dispatchEvent(new Event('input', { bubbles: true })); element.dispatchEvent(new Event('change', { bubbles: true })); return { success: true, action: 'type', text, selector };
    },
    scroll: (direction = 'down', amount = 300) => { const scrollAmount = direction === 'up' ? -amount : amount; window.scrollBy(0, scrollAmount); return { success: true, action: 'scroll', direction, amount }; },
    wait: (ms = 1000) => new Promise(resolve => setTimeout(() => resolve({ success: true, action: 'wait', duration: ms }), ms))
  };
  if (xpathAutomation[action]) {
    try { const result = xpathAutomation[action](...Object.values(params || {})); return result; }
    catch (error) { return { success: false, error: 'XPath automation action failed: ' + error.message, action, params }; }
  } else { return { success: false, error: 'Unknown XPath automation action: ' + action, action, params }; }
}

self.persistLastSelected = persistLastSelected;
self.xpathAutomationScript = xpathAutomationScript;
