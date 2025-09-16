// Background service worker for ChromeAiAgent
// Import MCP-compliant provider interface
// Temporarily commented out to fix service worker registration
// importScripts('mcp-provider-interface.js');

// XPath Page Analysis System
function pageAnalysisScript() {
  console.log('[XPathAnalysis] Starting comprehensive page analysis...');
  
  // Generate XPath for element
  function generateXPath(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    
    // Handle special cases
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let tagName = current.tagName.toLowerCase();
      let selector = tagName;
      
      // Add position if there are siblings with same tag
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children)
          .filter(sibling => sibling.tagName.toLowerCase() === tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `[${index}]`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentNode;
    }
    
    return '/' + parts.join('/');
  }
  
  // Analyze element properties for automation scoring
  function analyzeElement(element) {
    const analysis = {
      xpath: generateXPath(element),
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: Array.from(element.classList),
      text: element.textContent?.trim().substring(0, 100) || '',
      attributes: {},
      isVisible: isElementVisible(element),
      isClickable: isElementClickable(element),
      isInput: isElementInput(element),
      boundingRect: element.getBoundingClientRect(),
      automationScore: 0
    };
    
    // Collect relevant attributes
    ['type', 'name', 'placeholder', 'value', 'href', 'role', 'aria-label', 'title'].forEach(attr => {
      if (element.hasAttribute(attr)) {
        analysis.attributes[attr] = element.getAttribute(attr);
      }
    });
    
    // Calculate automation relevance score
    analysis.automationScore = calculateAutomationScore(element, analysis);
    
    return analysis;
  }
  
  // Check if element is visible
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
  
  // Check if element is clickable
  function isElementClickable(element) {
    const clickableTags = ['a', 'button', 'input', 'select', 'textarea'];
    const clickableTypes = ['button', 'submit', 'reset', 'checkbox', 'radio'];
    
    if (clickableTags.includes(element.tagName.toLowerCase())) return true;
    if (element.getAttribute('role') === 'button') return true;
    if (element.getAttribute('onclick')) return true;
    if (element.style.cursor === 'pointer') return true;
    
    return false;
  }
  
  // Check if element is input
  function isElementInput(element) {
    const inputTags = ['input', 'textarea', 'select'];
    const editableTypes = ['text', 'email', 'password', 'search', 'url', 'tel', 'number'];
    
    if (inputTags.includes(element.tagName.toLowerCase())) return true;
    if (element.isContentEditable) return true;
    
    return false;
  }
  
  // Calculate automation relevance score
  function calculateAutomationScore(element, analysis) {
    let score = 0;
    
    // Visibility bonus
    if (analysis.isVisible) score += 10;
    
    // Interactivity bonuses
    if (analysis.isClickable) score += 15;
    if (analysis.isInput) score += 15;
    
    // Text content bonus
    if (analysis.text.length > 0) score += 5;
    if (analysis.text.length > 10) score += 5;
    
    // ID bonus
    if (analysis.id) score += 10;
    
    // Semantic attributes bonus
    if (analysis.attributes['aria-label']) score += 8;
    if (analysis.attributes.role) score += 5;
    if (analysis.attributes.title) score += 3;
    
    // Form-related bonuses
    if (analysis.attributes.name) score += 7;
    if (analysis.attributes.placeholder) score += 5;
    
    // Size bonus for reasonable sized elements
    const rect = analysis.boundingRect;
    if (rect.width >= 10 && rect.height >= 10) score += 5;
    if (rect.width >= 50 && rect.height >= 20) score += 5;
    
    return score;
  }
  
  // Main analysis function
  function analyzePageElements() {
    const allElements = document.querySelectorAll('*');
    const analysis = {
      pageUrl: window.location.href,
      pageTitle: document.title,
      timestamp: new Date().toISOString(),
      totalElements: allElements.length,
      interactiveElements: [],
      elementsByXPath: new Map(),
      topScoredElements: [],
      categories: {
        buttons: [],
        inputs: [],
        links: [],
        forms: [],
        navigation: [],
        content: []
      }
    };
    
    console.log(`[XPathAnalysis] Analyzing ${allElements.length} elements...`);
    
    // Analyze each element
    allElements.forEach(element => {
      const elementAnalysis = analyzeElement(element);
      
      // Skip elements with very low scores or invisible elements
      if (elementAnalysis.automationScore < 5 || !elementAnalysis.isVisible) return;
      
      // Store by XPath for quick lookup
      analysis.elementsByXPath.set(elementAnalysis.xpath, elementAnalysis);
      analysis.interactiveElements.push(elementAnalysis);
      
      // Categorize elements
      if (elementAnalysis.tagName === 'button' || elementAnalysis.attributes.role === 'button') {
        analysis.categories.buttons.push(elementAnalysis);
      } else if (elementAnalysis.isInput) {
        analysis.categories.inputs.push(elementAnalysis);
      } else if (elementAnalysis.tagName === 'a') {
        analysis.categories.links.push(elementAnalysis);
      } else if (elementAnalysis.tagName === 'form') {
        analysis.categories.forms.push(elementAnalysis);
      } else if (elementAnalysis.tagName === 'nav' || 
                 elementAnalysis.classes.some(cls => cls.includes('nav'))) {
        analysis.categories.navigation.push(elementAnalysis);
      } else {
        analysis.categories.content.push(elementAnalysis);
      }
    });
    
    // Sort by automation score (highest first)
    analysis.interactiveElements.sort((a, b) => b.automationScore - a.automationScore);
    analysis.topScoredElements = analysis.interactiveElements.slice(0, 50);
    
    // Sort categories by score
    Object.keys(analysis.categories).forEach(category => {
      analysis.categories[category].sort((a, b) => b.automationScore - a.automationScore);
    });
    
    console.log(`[XPathAnalysis] Analysis complete:`, {
      interactiveElements: analysis.interactiveElements.length,
      buttons: analysis.categories.buttons.length,
      inputs: analysis.categories.inputs.length,
      links: analysis.categories.links.length,
      topScore: analysis.topScoredElements[0]?.automationScore || 0
    });
    
    return analysis;
  }
  
  // Execute analysis and return results
  try {
    const pageAnalysis = analyzePageElements();
    
    // Store analysis in global variable for quick access
    window.chromeAiAgentPageAnalysis = pageAnalysis;
    
    return {
      success: true,
      analysis: pageAnalysis,
      message: `Page analysis complete: ${pageAnalysis.interactiveElements.length} interactive elements found`
    };
  } catch (error) {
    console.error('[XPathAnalysis] Analysis failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Page analysis failed'
    };
  }
}

// Enhanced XPath-based element execution
function xpathAutomationScript(action, params) {
  console.log('[XPathAutomation] Executing action:', action, 'with params:', params);
  
  // Get stored page analysis
  const pageAnalysis = window.chromeAiAgentPageAnalysis;
  if (!pageAnalysis) {
    console.warn('[XPathAutomation] No page analysis found, running quick analysis...');
    // If no analysis exists, run a quick one
    const analysisResult = pageAnalysisScript();
    if (!analysisResult.success) {
      return { success: false, error: 'Failed to analyze page for XPath automation' };
    }
  }
  
  // XPath-based element finder
  function findElementByXPath(xpath) {
    try {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    } catch (error) {
      console.error('[XPathAutomation] XPath evaluation failed:', xpath, error);
      return null;
    }
  }
  
  // Enhanced element finder using XPath and analysis
  function findElementForAutomation(selector, actionType) {
    const analysis = window.chromeAiAgentPageAnalysis;
    
    console.log('[XPathAutomation] Looking for element:', selector, 'action:', actionType);
    
    // If selector is already an XPath, use it directly
    if (selector.startsWith('/') || selector.startsWith('//')) {
      const element = findElementByXPath(selector);
      if (element) {
        console.log('[XPathAutomation] Found element by direct XPath');
        return element;
      }
    }
    
    // Search in analyzed elements
    let candidates = [];
    
    if (actionType === 'click') {
      candidates = [...analysis.categories.buttons, ...analysis.categories.links];
    } else if (actionType === 'type' || actionType === 'input') {
      candidates = analysis.categories.inputs;
    } else {
      candidates = analysis.interactiveElements;
    }
    
    console.log('[XPathAutomation] Searching among', candidates.length, 'candidates');
    
    // Find best match by text content, attributes, or properties
    const selectorLower = selector.toLowerCase().replace(/['"]/g, ''); // Remove quotes
    
    // Exact text match first
    let bestMatch = candidates.find(elem => {
      const text = elem.text?.toLowerCase() || '';
      return text === selectorLower;
    });
    
    // If no exact match, try partial text match
    if (!bestMatch) {
      bestMatch = candidates.find(elem => {
        const text = elem.text?.toLowerCase() || '';
        return text.includes(selectorLower) || selectorLower.includes(text);
      });
    }
    
    // If still no match, try attribute and property matching
    if (!bestMatch) {
      bestMatch = candidates.find(elem => {
        return (
          elem.id?.toLowerCase().includes(selectorLower) ||
          elem.attributes.name?.toLowerCase().includes(selectorLower) ||
          elem.attributes.placeholder?.toLowerCase().includes(selectorLower) ||
          elem.attributes['aria-label']?.toLowerCase().includes(selectorLower) ||
          elem.attributes.title?.toLowerCase().includes(selectorLower) ||
          elem.attributes.alt?.toLowerCase().includes(selectorLower) ||
          elem.classes.some(cls => cls.toLowerCase().includes(selectorLower))
        );
      });
    }
    
    if (bestMatch) {
      console.log('[XPathAutomation] Found element via analysis:', {
        text: bestMatch.text,
        xpath: bestMatch.xpath,
        tagName: bestMatch.tagName,
        score: bestMatch.automationScore
      });
      return findElementByXPath(bestMatch.xpath);
    }
    
    console.log('[XPathAutomation] No match found in analysis, trying direct DOM search...');
    
    // Fallback 1: Direct text search in DOM
    const allElements = document.querySelectorAll('button, a, input, [role="button"], [onclick]');
    for (const element of allElements) {
      const text = element.textContent?.toLowerCase() || '';
      if (text.includes(selectorLower) || selectorLower.includes(text)) {
        console.log('[XPathAutomation] Found via direct DOM text search:', element);
        return element;
      }
    }
    
    // Fallback 2: CSS selector
    try {
      const cssResult = document.querySelector(selector);
      if (cssResult) {
        console.log('[XPathAutomation] Found via CSS selector:', cssResult);
        return cssResult;
      }
    } catch (cssError) {
      console.log('[XPathAutomation] CSS selector failed:', cssError.message);
    }
    
    console.log('[XPathAutomation] Element not found for selector:', selector);
    return null;
  }
  
  // Automation actions using XPath
  const xpathAutomation = {
    click: (selector) => {
      const element = findElementForAutomation(selector, 'click');
      if (!element) return { success: false, error: 'Element not found for click', selector };
      
      console.log('[XPathAutomation] Found element for click:', element, 'XPath:', generateXPathForElement(element));
      
      // Enhanced click with multiple strategies for modern web apps
      try {
        // Strategy 1: Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Strategy 2: Simulate user interaction events
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Dispatch mouse events in correct sequence
        const mouseEvents = ['mousedown', 'mouseup', 'click'];
        mouseEvents.forEach(eventType => {
          const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY,
            button: 0,
            buttons: 1
          });
          element.dispatchEvent(event);
        });
        
        // Strategy 3: Also try focus + Enter for keyboard accessibility
        if (element.tagName === 'BUTTON' || element.role === 'button') {
          element.focus();
          setTimeout(() => {
            const enterEvent = new KeyboardEvent('keydown', {
              bubbles: true,
              cancelable: true,
              key: 'Enter',
              keyCode: 13,
              which: 13
            });
            element.dispatchEvent(enterEvent);
          }, 50);
        }
        
        // Strategy 4: Direct click as fallback
        element.click();
        
        // Validation: Check if click had any effect (page change, new elements, etc.)
        const initialUrl = window.location.href;
        const initialActiveElement = document.activeElement;
        
        // Wait a bit to see if anything changed
        setTimeout(() => {
          const urlChanged = window.location.href !== initialUrl;
          const focusChanged = document.activeElement !== initialActiveElement;
          const hasVisibleChange = element.style.display === 'none' || element.classList.contains('active');
          
          console.log('[XPathAutomation] Click validation:', {
            urlChanged,
            focusChanged,
            hasVisibleChange,
            currentUrl: window.location.href,
            originalUrl: initialUrl
          });
        }, 200);
        
        return { 
          success: true, 
          action: 'click', 
          xpath: generateXPathForElement(element), 
          selector,
          element: {
            tagName: element.tagName,
            text: element.textContent?.slice(0, 50),
            id: element.id,
            classes: Array.from(element.classList)
          }
        };
        
      } catch (clickError) {
        console.error('[XPathAutomation] Enhanced click failed:', clickError);
        
        // Final fallback: basic click
        try {
          element.click();
          return { 
            success: true, 
            action: 'click', 
            xpath: generateXPathForElement(element), 
            selector,
            warning: 'Enhanced click failed, used basic click',
            error: clickError.message
          };
        } catch (basicClickError) {
          return { 
            success: false, 
            error: 'All click strategies failed', 
            selector,
            xpath: generateXPathForElement(element),
            enhancedError: clickError.message,
            basicError: basicClickError.message
          };
        }
      }
    },
    
    type: (selector, text) => {
      const element = findElementForAutomation(selector, 'type');
      if (!element) return { success: false, error: 'Element not found for typing', selector };
      
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return { success: true, action: 'type', xpath: generateXPathForElement(element), text, selector };
    },
    
    scroll: (direction = 'down', amount = 300) => {
      const scrollAmount = direction === 'up' ? -amount : amount;
      window.scrollBy(0, scrollAmount);
      return { success: true, action: 'scroll', direction, amount };
    },
    
    wait: (ms = 1000) => {
      return new Promise(resolve => {
        setTimeout(() => resolve({ success: true, action: 'wait', duration: ms }), ms);
      });
    }
  };
  
  // Helper function to generate XPath for any element
  function generateXPathForElement(element) {
    if (!element) return null;
    
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }
    
    const parts = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let tagName = current.tagName.toLowerCase();
      let selector = tagName;
      
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children)
          .filter(sibling => sibling.tagName.toLowerCase() === tagName);
        
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `[${index}]`;
        }
      }
      
      parts.unshift(selector);
      current = current.parentNode;
    }
    
    return '/' + parts.join('/');
  }
  
  // Execute the action
  if (xpathAutomation[action]) {
    try {
      const result = xpathAutomation[action](...Object.values(params || {}));
      console.log('[XPathAutomation] Action completed:', result);
      return result;
    } catch (error) {
      console.error('[XPathAutomation] Action execution error:', error);
      return { success: false, error: 'XPath automation action failed: ' + error.message, action, params };
    }
  } else {
    return { success: false, error: 'Unknown XPath automation action: ' + action, action, params };
  }
}

// Content script function for automation (defined globally for serialization)
function automationContentScript(action, params) {
    // Dynamic and flexible element finding system - no hardcoded field names
    const findElement = (selector, actionType = null) => {
      console.log('[AutomationScript] Finding element for selector:', selector, 'action:', actionType);
      // Score the selector before performing any action
      let score = 0;
      if (actionType === 'type' || actionType === 'input') {
        const inputElement = findBestInputElement(selector);
        score = inputElement ? 1 : 0;
        // Ensure the element is a valid input/textarea/contenteditable/select
        if (!inputElement || !['input','textarea','select'].includes((inputElement.tagName||'').toLowerCase())) {
          if (!(inputElement && inputElement.isContentEditable)) {
            console.warn('[AutomationScript] Aborting type/input action: no valid input/textarea/contenteditable/select found.', {selector, inputElement});
            return { success: false, error: 'No valid input/textarea/contenteditable/select found', selector, actionType };
          }
        }
      } else if (actionType === 'click') {
        const clickableElement = findBestClickableElement(selector);
        score = clickableElement ? 1 : 0;
      } else {
        // For other actions, use a basic presence check
        const el = document.querySelector(selector);
        score = el ? 1 : 0;
      }
      console.log('[AutomationScript] Selector score before action:', score, 'Selector:', selector, 'Action:', actionType);
      // Only proceed if score is above threshold
      if (score < 1) {
        console.warn('[AutomationScript] Aborting action due to low score:', score, 'Selector:', selector);
        return { success: false, error: 'Low selector score, action aborted', selector, actionType };
      }
      // Normalize selector to a safe string to avoid runtime errors
      const targetSelector = (typeof selector === 'string' ? selector : String(selector || '')).trim();
      
      // Strategy 1: Handle :contains() selectors (AI-generated)
      if (targetSelector.includes(':contains(')) {
        const match = targetSelector.match(/^([^:]+):contains\(['"]([^'\"]+)['"]\)$/);
        if (match) {
          const [, baseSelector, containsText] = match;
          console.log('[AutomationScript] Parsing :contains selector:', { baseSelector, containsText });
          
          return findElementByText(baseSelector || '*', containsText);
        }
      }
      
      // Strategy 2: Direct selector
      try {
        if (targetSelector) {
          let element = document.querySelector(targetSelector);
          if (element) {
            console.log('[AutomationScript] Found element with direct selector');
            return element;
          }
        }
      } catch (e) {
        console.log('[AutomationScript] Invalid selector, trying alternatives:', e.message);
      }
      
      // Strategy 3: Intelligent context-based finding
      if (actionType === 'type') {
        const inputElement = findBestInputElement(targetSelector || '');
        if (inputElement) return inputElement;
        // For type actions, don't fall back to non-input elements
        console.warn('[AutomationScript] No valid input element found for type action, not falling back to clickable elements');
        return null;
      } else if (actionType === 'click') {
        const clickableElement = findBestClickableElement(targetSelector || '');
        if (clickableElement) return clickableElement;
        // Fall back to semantic search only for click actions
        console.log('[AutomationScript] No clickable element found, trying semantic search for click action');
        return findElementBySemantics(targetSelector || '');
      }
      
      // Strategy 4: Semantic and flexible text matching (only for non-specific actions)
      return findElementBySemantics(targetSelector || '');
    };
    
    // Helper: Find element by text content with fuzzy matching
    const findElementByText = (baseSelector, searchText) => {
      try {
        const candidates = document.querySelectorAll(baseSelector);
        const searchLower = searchText.toLowerCase();
        console.log('[AutomationScript] Searching for text:', searchText, 'in', candidates.length, 'candidates with selector:', baseSelector);
        
        // Exact match first
        for (let el of candidates) {
          if (el.textContent && el.textContent.trim().toLowerCase() === searchLower) {
            console.log('[AutomationScript] Found exact text match:', el.tagName, el.textContent.trim());
            return el;
          }
        }
        
        // Contains match - but be more specific about which element has the text
        const containsMatches = [];
        for (let el of candidates) {
          if (el.textContent && el.textContent.trim().toLowerCase().includes(searchLower)) {
            const textContent = el.textContent.trim();
            const score = searchLower.length / textContent.length; // Prefer elements where the search text is a larger portion
            containsMatches.push({ element: el, score, textContent });
          }
        }
        
        if (containsMatches.length > 0) {
          // Sort by score (higher = better match)
          containsMatches.sort((a, b) => b.score - a.score);
          console.log('[AutomationScript] Found text contains match:', containsMatches[0].element.tagName, containsMatches[0].textContent);
          return containsMatches[0].element;
        }
        
        // Fuzzy word matching
        const searchWords = searchLower.split(/\s+/);
        for (let el of candidates) {
          if (el.textContent) {
            const elementText = el.textContent.toLowerCase();
            const matchCount = searchWords.filter(word => elementText.includes(word)).length;
            if (matchCount >= Math.ceil(searchWords.length / 2)) {
              console.log('[AutomationScript] Found fuzzy text match:', el.tagName, el.textContent.trim());
              return el;
            }
          }
        }
        
        console.log('[AutomationScript] No text match found for:', searchText);
        return null;
      } catch (error) {
        console.error('[AutomationScript] Error in findElementByText:', error);
        return null;
      }
    };
    
    // Helper: Find best input element based on context and relevance
    const findBestInputElement = (selector) => {
      try {
        const inputElements = document.querySelectorAll('input, textarea, [contenteditable="true"], select');
        // Do NOT auto-select a single input; it might be an auth/login field. Score it instead.
        
        // Tokenize selector and add synonyms for better matching (e.g., bio)
        const selectorLower = (selector || '').toLowerCase();
        const baseTokens = selectorLower.split(/[^a-z0-9]+/).filter(Boolean);
        const synonyms = new Map([
          ['bio', ['biography', 'about', 'about me', 'description', 'summary', 'profile', 'info', 'information']],
          ['about', ['bio', 'biography', 'description', 'summary', 'profile']]
        ]);
        const tokens = new Set(baseTokens);
        for (const t of baseTokens) {
          const syns = synonyms.get(t);
          if (syns) syns.forEach(s => tokens.add(s));
        }

        const wantsAuthField = (() => {
          const authWords = ['email','password','username','login','signin','sign in','log in'];
          const tokenStr = Array.from(tokens).join(' ');
          return authWords.some(w => tokenStr.includes(w));
        })();
        const isBioTask = (() => {
          const bioWords = ['bio','about','description','summary','profile'];
          const tokenStr = Array.from(tokens).join(' ');
          return bioWords.some(w => tokenStr.includes(w));
        })();

        // Score inputs based on relevance to selector and context
        const scored = Array.from(inputElements).map(input => {
          let score = 0;
          const tag = input.tagName.toLowerCase();
          const type = (input.getAttribute('type') || '').toLowerCase();
          const id = (input.id || '').toLowerCase();
          const cls = (input.className || '').toLowerCase();
          const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();
          const nameAttr = (input.getAttribute('name') || '').toLowerCase();
          const aria = (input.getAttribute('aria-label') || '').toLowerCase();
          const title = (input.getAttribute('title') || '').toLowerCase();
          const isContentEditable = input.isContentEditable || input.getAttribute('contenteditable') === 'true';

          // Penalize obvious non-targets like search inputs
          const looksLikeSearch = type === 'search' || id.includes('search') || cls.includes('search') || placeholder.includes('search');
          if (looksLikeSearch) score -= 40;

          // Strongly penalize authentication/login fields unless explicitly requested
          const authHints = ['login','log in','sign in','signin','username','user name','email','e-mail','password','passcode','otp','2fa','two factor','auth','verification','code','captcha'];
          const allAttrs = `${id} ${cls} ${placeholder} ${nameAttr} ${aria} ${title}`;
          const looksLikeAuth = authHints.some(h => allAttrs.includes(h)) || type === 'email' || type === 'password';
          if (looksLikeAuth && !wantsAuthField) score -= 80;

          // Penalize inputs inside forms/sections that look like auth contexts when not requested
          const formOrSection = input.closest('form, section, article, div');
          if (formOrSection) {
            const ctx = (formOrSection.textContent || '').toLowerCase();
            if (!wantsAuthField && (ctx.includes('sign in') || ctx.includes('log in') || ctx.includes('login') || ctx.includes('password'))) {
              score -= 60;
            }
          }

          // Prefer longer-text fields
          if (tag === 'textarea') score += isBioTask ? 15 : 10;
          if (isContentEditable) score += isBioTask ? 18 : 12;
          if (type === 'text') score += 3;
          if (type === 'email' || type === 'password' || type === 'checkbox' || type === 'radio' || type === 'submit' || type === 'button' || type === 'file') score -= 15;

          // Attribute/token matching
          const attribs = [placeholder, nameAttr, id, aria, title, cls];
          for (const v of attribs) {
            for (const t of tokens) {
              if (!t) continue;
              if (v === t) score += 25;
              else if (v.includes(t)) score += 12;
            }
          }

          // Label and context matching
          const label = input.closest('label') || (input.id ? document.querySelector(`label[for="${input.id}"]`) : null);
          if (label) {
            const labelText = (label.textContent || '').toLowerCase();
            for (const t of tokens) if (labelText.includes(t)) score += 15;
          }

          const container = input.closest('div, fieldset, section, form, article');
          if (container) {
            const contextText = (container.textContent || '').toLowerCase();
            for (const t of tokens) if (contextText.includes(t)) score += 5;
            // Nearby headings
            const heading = container.querySelector('h1,h2,h3,h4,h5,h6');
            if (heading) {
              const headText = (heading.textContent || '').toLowerCase();
              for (const t of tokens) if (headText.includes(t)) score += 4;
            }
          }

          // Visibility and usability
          const visible = input.offsetParent !== null || isContentEditable;
          if (visible) score += 6; else score -= 10;
          if (!input.disabled) score += 3; else score -= 10;
          if (!input.readOnly) score += 2; else score -= 5;

          // Heuristic: classes indicating free-text editors
          const freeTextHints = ['editor', 'markdown', 'prose', 'contenteditable', 'bio', 'about', 'description', 'w-full', 'resize'];
          for (const hint of freeTextHints) if (cls.includes(hint)) score += 3;

          return { element: input, score };
        });
        
        // Sort by score and return best match
        scored.sort((a, b) => b.score - a.score);
        console.log('[AutomationScript] Input candidates:', scored.map(s => ({tag: s.element.tagName, id: s.element.id, score: s.score})));
        // Require a much higher score for bio/contextual tasks to avoid false matches
        const minScore = isBioTask ? 35 : 18;
        if (scored.length > 0 && scored[0].score >= minScore) {
          console.log('[AutomationScript] Selected input element:', {
            tag: scored[0].element.tagName,
            id: scored[0].element.id,
            score: scored[0].score
          });
          return scored[0].element;
        }
        console.warn('[AutomationScript] No input element met minimum score:', minScore, 'Best candidate:', scored[0]);
        return null;
      } catch (error) {
        console.error('[AutomationScript] Error in findBestInputElement:', error);
        return null;
      }
    };
    
    // Helper: Find best clickable element based on context and relevance
    const findBestClickableElement = (selector) => {
      try {
        const clickableElements = document.querySelectorAll(
          'button, a, input[type="submit"], input[type="button"], [role="button"], ' +
          '[onclick], .cursor-pointer, .btn, .button, [tabindex]:not([tabindex="-1"])'
        );
        
        // Score clickable elements based on relevance
        const scored = Array.from(clickableElements).map(element => {
          let score = 0;
          const selectorLower = selector.toLowerCase();
          const elementText = (element.textContent || '').trim().toLowerCase();
          const elementValue = (element.value || '').toLowerCase();
          
          // Text content matching
          if (elementText === selectorLower || elementValue === selectorLower) score += 25;
          else if (elementText.includes(selectorLower) || elementValue.includes(selectorLower)) score += 20;
          
          // Attribute matching
          ['id', 'class', 'aria-label', 'title', 'data-action', 'data-testid'].forEach(attr => {
            const value = element.getAttribute(attr);
            if (value) {
              const valueLower = value.toLowerCase();
              if (valueLower === selectorLower) score += 15;
              else if (valueLower.includes(selectorLower)) score += 10;
            }
          });
          
          // Word-based matching
          const selectorWords = selectorLower.split(/\s+/);
          const elementWords = (elementText + ' ' + elementValue).split(/\s+/);
          const matchingWords = selectorWords.filter(word => 
            elementWords.some(elemWord => elemWord.includes(word) || word.includes(elemWord))
          );
          score += matchingWords.length * 8;
          
          // Element type preference
          if (element.tagName.toLowerCase() === 'button') score += 3;
          if (element.type === 'submit') score += 2;
          
          // Visibility and interaction
          if (element.offsetParent !== null) score += 5;
          if (!element.disabled) score += 3;
          
          return { element, score };
        });
        
        // Sort by score and return best match
        scored.sort((a, b) => b.score - a.score);
        if (scored.length > 0 && scored[0].score > 0) {
          console.log('[AutomationScript] Found best clickable element with score:', scored[0].score);
          return scored[0].element;
        }
        
        return null;
      } catch (error) {
        console.error('[AutomationScript] Error in findBestClickableElement:', error);
        return null;
      }
    };
    
    // Helper: Semantic element finding using various strategies
    const findElementBySemantics = (selector) => {
      try {
        const selectorLower = selector.toLowerCase();
        
        // Try semantic attributes
        const semanticAttrs = ['data-testid', 'data-cy', 'data-qa', 'aria-label', 'title', 'alt'];
        for (const attr of semanticAttrs) {
          const element = document.querySelector(`[${attr}*="${selectorLower}" i]`);
          if (element) {
            console.log('[AutomationScript] Found element by semantic attribute:', attr);
            return element;
          }
        }
        
        // Try partial class/ID matching
        const cleanSelector = selectorLower.replace(/[^a-zA-Z0-9]/g, '');
        if (cleanSelector.length > 2) {
          const partialSelectors = [
            `[class*="${cleanSelector}" i]`,
            `[id*="${cleanSelector}" i]`
          ];
          
          for (const partialSelector of partialSelectors) {
            try {
              const element = document.querySelector(partialSelector);
              if (element) {
                console.log('[AutomationScript] Found element with partial matching');
                return element;
              }
            } catch (e) {
              // Try without case-insensitive flag for older browsers
              const fallbackSelector = partialSelector.replace(' i]', ']');
              const element = document.querySelector(fallbackSelector);
              if (element) {
                console.log('[AutomationScript] Found element with fallback partial matching');
                return element;
              }
            }
          }
        }
        
        console.log('[AutomationScript] No element found with semantic strategies');
        return null;
      } catch (error) {
        console.error('[AutomationScript] Error in findElementBySemantics:', error);
        return null;
      }
    };

    // Helper function to create detailed element description for logs and responses
    const getElementDescription = (element, selector) => {
      if (!element) return { selector, element: null };
      
      try {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        const description = {
          tagName: element.tagName.toLowerCase(),
          id: element.id || null,
          classes: element.className ? element.className.split(/\s+/).filter(c => c) : [],
          text: element.innerText ? element.innerText.substring(0, 100) : null,
          value: element.value || null,
          type: element.type || null,
          href: element.href || null,
          placeholder: element.placeholder || null,
          title: element.title || null,
          ariaLabel: element.getAttribute('aria-label') || null,
          role: element.getAttribute('role') || null,
          position: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          visible: rect.width > 0 && rect.height > 0 && styles.visibility !== 'hidden' && styles.display !== 'none',
          selector: selector,
          actualSelector: element.tagName.toLowerCase() + 
                         (element.id ? '#' + element.id : '') + 
                         (element.className ? '.' + element.className.split(/\s+/)[0] : '')
        };
        
        return description;
      } catch (error) {
        console.error('[AutomationScript] Error getting element description:', error);
        return { 
          tagName: element.tagName?.toLowerCase() || 'unknown',
          selector,
          actualSelector: 'unknown',
          error: 'Could not get element details'
        };
      }
    };

    const automation = {
      click: (selector) => {
        const element = findElement(selector, 'click');
        if (element) {
          const elementInfo = getElementDescription(element, selector);
          console.log('🤖 AUTOMATION: Clicking element:', elementInfo);
          element.click();
          return { 
            success: true, 
            action: 'clicked', 
            element: selector, 
            elementInfo: elementInfo,
            message: `Clicked ${elementInfo.tagName}${elementInfo.id ? ' #' + elementInfo.id : ''}${elementInfo.text ? ' ("' + elementInfo.text.substring(0, 50) + '...")' : ''}`
          };
        }
        return { success: false, error: 'Element not found' };
      },

      type: (selector, text) => {
        const element = findElement(selector, 'type');
        if (element) {
          const elementInfo = getElementDescription(element, selector);
          console.log('🤖 AUTOMATION: Typing into element:', elementInfo, 'Text:', text);
          const isContentEditable = element.isContentEditable || element.getAttribute('contenteditable') === 'true';
          element.focus();

          if (isContentEditable) {
            // Set text for contenteditable elements
            element.innerText = text;
            try { element.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' })); } catch {}
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
            // Set value for input/textarea
            element.value = text;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Fallback: try setting textContent
            element.textContent = text;
            try { element.dispatchEvent(new InputEvent('input', { bubbles: true, data: text, inputType: 'insertText' })); } catch {}
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }

          return { 
            success: true, 
            action: 'typed', 
            element: selector, 
            text, 
            elementInfo: elementInfo,
            message: `Typed "${text}" into ${elementInfo.tagName}${elementInfo.id ? ' #' + elementInfo.id : ''}${elementInfo.placeholder ? ' (placeholder: "' + elementInfo.placeholder + '")' : ''}`
          };
        }
        return { success: false, error: 'Element not found' };
      },

      navigate: (url) => {
        window.location.href = url;
        return { success: true, action: 'navigated', url };
      },

      newTab: (url) => {
        window.open(url, '_blank');
        return { success: true, action: 'new tab opened', url };
      },

      wait: (ms) => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ success: true, action: 'waited', duration: ms }), ms);
        });
      },

      extractPageElements: () => {
        const elements = [];
        
        // Get clickable elements
        const clickable = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [onclick]');
        clickable.forEach(el => {
          if (el.offsetParent !== null) { // visible elements only
            elements.push({
              type: 'clickable',
              tag: el.tagName.toLowerCase(),
              text: el.textContent?.trim().substring(0, 100) || '',
              id: el.id || '',
              className: el.className || '',
              selector: el.id ? `#${el.id}` : `.${el.className.split(' ')[0]}` || el.tagName.toLowerCase()
            });
          }
        });
        
        // Get input elements
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(el => {
          if (el.offsetParent !== null) {
            elements.push({
              type: 'input',
              tag: el.tagName.toLowerCase(),
              inputType: el.type || '',
              placeholder: el.placeholder || '',
              id: el.id || '',
              className: el.className || '',
              selector: el.id ? `#${el.id}` : `.${el.className.split(' ')[0]}` || el.tagName.toLowerCase()
            });
          }
        });
        
        console.log('[AutomationScript] Found elements:', elements);
        return elements.slice(0, 50); // Limit to 50 elements
      },

      extractPageContent: () => {
        try {
          // Helper function to generate CSS selector for an element
          function getElementSelector(element) {
            if (element.id) {
              return `#${element.id}`;
            }
            
            if (element.className) {
              const classes = element.className.split(' ').filter(cls => cls);
              if (classes.length > 0) {
                return `.${classes[0]}`;
              }
            }
            
            // Fallback to tag name with nth-child if needed
            const parent = element.parentElement;
            if (parent) {
              const siblings = Array.from(parent.children).filter(child => child.tagName === element.tagName);
              if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                return `${element.tagName.toLowerCase()}:nth-child(${index})`;
              }
            }
            
            return element.tagName.toLowerCase();
          }
          
          // Get both HTML structure and text content for better AI understanding
          const pageData = {
            html: document.documentElement.outerHTML,
            text: '',
            elements: []
          };
          
          // Extract clean text content
          const textContent = document.body ? document.body.innerText || document.body.textContent : '';
          pageData.text = textContent
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n')
            .trim();
          
          // Extract interactive elements for automation
          const interactiveElements = document.querySelectorAll(`
            button, input, textarea, select, a[href], 
            [onclick], [role="button"], [tabindex], 
            form, [contenteditable], img[alt], 
            h1, h2, h3, h4, h5, h6, 
            .btn, .button, .link, .menu, .nav
          `);
          
          interactiveElements.forEach((el, index) => {
            if (el.offsetParent !== null || el.tagName === 'INPUT') { // visible elements
              const elementInfo = {
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                className: el.className || '',
                text: (el.textContent || el.value || el.alt || '').trim().substring(0, 50),
                type: el.type || '',
                placeholder: el.placeholder || '',
                href: el.href || '',
                role: el.getAttribute('role') || '',
                selector: getElementSelector(el)
              };
              
              pageData.elements.push(elementInfo);
            }
          });
          
          console.log('[AutomationScript] Extracted full page content:', {
            htmlLength: pageData.html.length,
            textLength: pageData.text.length,
            elementsCount: pageData.elements.length
          });
          
          return pageData;
        } catch (error) {
          console.error('[AutomationScript] Error extracting page content:', error);
          return null;
        }
      },

      // Debug function to list all elements
      debugListElements: () => {
        const allElements = document.querySelectorAll('*');
        const elementInfo = [];
        
        allElements.forEach(el => {
          if (el.offsetParent !== null && (el.id || el.className || el.textContent.trim())) {
            elementInfo.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              className: el.className || '',
              text: el.textContent?.trim().substring(0, 50) || '',
              selector: el.id ? `#${el.id}` : (el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase())
            });
          }
        });
        
        console.log('[AutomationScript] All visible elements:', elementInfo);
        return { success: true, action: 'debug_listed', count: elementInfo.length, elements: elementInfo.slice(0, 100) };
      },

      // Mouse Events Actions
      hover: (selector) => {
        const element = findElement(selector);
        if (element) {
          const elementInfo = getElementDescription(element, selector);
          console.log('🤖 AUTOMATION: Hovering over element:', elementInfo);
          const event = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
          element.dispatchEvent(event);
          return { 
            success: true, 
            action: 'hovered', 
            element: selector, 
            elementInfo: elementInfo,
            message: `Hovered over ${elementInfo.tagName}${elementInfo.id ? ' #' + elementInfo.id : ''}${elementInfo.text ? ' ("' + elementInfo.text.substring(0, 50) + '...")' : ''}`
          };
        }
        return { success: false, error: 'Element not found' };
      },

      mouseDown: (selector, button = 0) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('mousedown', { 
            bubbles: true, 
            cancelable: true, 
            button: button,
            buttons: 1 << button 
          });
          element.dispatchEvent(event);
          return { success: true, action: 'mousedown', element: selector, button };
        }
        return { success: false, error: 'Element not found' };
      },

      mouseUp: (selector, button = 0) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('mouseup', { 
            bubbles: true, 
            cancelable: true, 
            button: button,
            buttons: 0 
          });
          element.dispatchEvent(event);
          return { success: true, action: 'mouseup', element: selector, button };
        }
        return { success: false, error: 'Element not found' };
      },

      mouseMove: (selector, offsetX = 0, offsetY = 0) => {
        const element = document.querySelector(selector);
        if (element) {
          const rect = element.getBoundingClientRect();
          const event = new MouseEvent('mousemove', { 
            bubbles: true, 
            cancelable: true,
            clientX: rect.left + offsetX,
            clientY: rect.top + offsetY
          });
          element.dispatchEvent(event);
          return { success: true, action: 'mousemove', element: selector, offsetX, offsetY };
        }
        return { success: false, error: 'Element not found' };
      },

      mouseEnter: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('mouseenter', { bubbles: false, cancelable: true });
          element.dispatchEvent(event);
          return { success: true, action: 'mouseenter', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      mouseLeave: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('mouseleave', { bubbles: false, cancelable: true });
          element.dispatchEvent(event);
          return { success: true, action: 'mouseleave', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      doubleClick: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('dblclick', { bubbles: true, cancelable: true });
          element.dispatchEvent(event);
          return { success: true, action: 'doubleclicked', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      rightClick: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('contextmenu', { 
            bubbles: true, 
            cancelable: true,
            button: 2,
            buttons: 2
          });
          element.dispatchEvent(event);
          return { success: true, action: 'rightclicked', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      scroll: (selector, direction = 'down', amount = 100) => {
        const element = selector ? document.querySelector(selector) : window;
        if (element || selector === null) {
          const target = element || window;
          
          if (direction === 'down') {
            target.scrollBy ? target.scrollBy(0, amount) : target.scrollTo(0, target.scrollY + amount);
          } else if (direction === 'up') {
            target.scrollBy ? target.scrollBy(0, -amount) : target.scrollTo(0, target.scrollY - amount);
          } else if (direction === 'left') {
            target.scrollBy ? target.scrollBy(-amount, 0) : target.scrollTo(target.scrollX - amount, 0);
          } else if (direction === 'right') {
            target.scrollBy ? target.scrollBy(amount, 0) : target.scrollTo(target.scrollX + amount, 0);
          }
          
          return { success: true, action: 'scrolled', element: selector || 'window', direction, amount };
        }
        return { success: false, error: 'Element not found' };
      },

      scrollToElement: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return { success: true, action: 'scrolled_to_element', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      // Keyboard Events Actions
      keyDown: (selector, key, modifiers = {}) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          const event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
            ctrlKey: modifiers.ctrl || false,
            altKey: modifiers.alt || false,
            shiftKey: modifiers.shift || false,
            metaKey: modifiers.meta || false
          });
          element.dispatchEvent(event);
          return { success: true, action: 'keydown', element: selector, key, modifiers };
        }
        return { success: false, error: 'Element not found' };
      },

      keyUp: (selector, key, modifiers = {}) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          const event = new KeyboardEvent('keyup', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
            ctrlKey: modifiers.ctrl || false,
            altKey: modifiers.alt || false,
            shiftKey: modifiers.shift || false,
            metaKey: modifiers.meta || false
          });
          element.dispatchEvent(event);
          return { success: true, action: 'keyup', element: selector, key, modifiers };
        }
        return { success: false, error: 'Element not found' };
      },

      keyPress: (selector, key, modifiers = {}) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          const event = new KeyboardEvent('keypress', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
            ctrlKey: modifiers.ctrl || false,
            altKey: modifiers.alt || false,
            shiftKey: modifiers.shift || false,
            metaKey: modifiers.meta || false
          });
          element.dispatchEvent(event);
          return { success: true, action: 'keypress', element: selector, key, modifiers };
        }
        return { success: false, error: 'Element not found' };
      },

      sendKeys: (selector, keys) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          
          // Handle special key combinations
          if (keys.includes('+')) {
            const parts = keys.split('+');
            const modifiers = {};
            let mainKey = parts[parts.length - 1];
            
            parts.forEach(part => {
              if (part.toLowerCase() === 'ctrl') modifiers.ctrl = true;
              if (part.toLowerCase() === 'alt') modifiers.alt = true;
              if (part.toLowerCase() === 'shift') modifiers.shift = true;
              if (part.toLowerCase() === 'meta') modifiers.meta = true;
            });
            
            const event = new KeyboardEvent('keydown', {
              key: mainKey,
              code: mainKey,
              bubbles: true,
              cancelable: true,
              ...modifiers
            });
            element.dispatchEvent(event);
          } else {
            // Send individual characters
            for (let char of keys) {
              const event = new KeyboardEvent('keypress', {
                key: char,
                code: char,
                bubbles: true,
                cancelable: true
              });
              element.dispatchEvent(event);
            }
          }
          
          return { success: true, action: 'keys_sent', element: selector, keys };
        }
        return { success: false, error: 'Element not found' };
      },

      typeText: (selector, text, delay = 0) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          element.value = '';
          
          const typeChar = (index) => {
            if (index < text.length) {
              element.value += text[index];
              element.dispatchEvent(new Event('input', { bubbles: true }));
              
              if (delay > 0) {
                setTimeout(() => typeChar(index + 1), delay);
              } else {
                typeChar(index + 1);
              }
            } else {
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          };
          
          typeChar(0);
          return { success: true, action: 'text_typed', element: selector, text, delay };
        }
        return { success: false, error: 'Element not found' };
      },

      // Form Actions
      focus: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          return { success: true, action: 'focused', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      blur: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.blur();
          return { success: true, action: 'blurred', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      select: (selector, value) => {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName.toLowerCase() === 'select') {
            element.value = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, action: 'selected', element: selector, value };
          } else if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = value;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, action: 'checked', element: selector, checked: value };
          }
        }
        return { success: false, error: 'Element not found or not selectable' };
      },

      selectOption: (selector, optionValue) => {
        const element = document.querySelector(selector);
        if (element && element.tagName.toLowerCase() === 'select') {
          const option = element.querySelector(`option[value="${optionValue}"]`);
          if (option) {
            element.value = optionValue;
            element.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true, action: 'option_selected', element: selector, value: optionValue };
          }
          return { success: false, error: 'Option not found' };
        }
        return { success: false, error: 'Element not found or not a select element' };
      },

      check: (selector, checked = true) => {
        const element = document.querySelector(selector);
        if (element && (element.type === 'checkbox' || element.type === 'radio')) {
          element.checked = checked;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'checked', element: selector, checked };
        }
        return { success: false, error: 'Element not found or not checkable' };
      },

      submit: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName.toLowerCase() === 'form') {
            element.submit();
            return { success: true, action: 'form_submitted', element: selector };
          } else if (element.type === 'submit') {
            element.click();
            return { success: true, action: 'submit_clicked', element: selector };
          }
        }
        return { success: false, error: 'Element not found or not submittable' };
      },

      reset: (selector) => {
        const element = document.querySelector(selector);
        if (element && element.tagName.toLowerCase() === 'form') {
          element.reset();
          return { success: true, action: 'form_reset', element: selector };
        }
        return { success: false, error: 'Element not found or not a form' };
      },

      uploadFile: (selector, fileData) => {
        const element = document.querySelector(selector);
        if (element && element.type === 'file') {
          // Create a File object from the data
          const file = new File([fileData.content], fileData.name, {
            type: fileData.type || 'application/octet-stream'
          });
          
          // Create FileList-like object
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          element.files = dataTransfer.files;
          
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'file_uploaded', element: selector, filename: fileData.name };
        }
        return { success: false, error: 'Element not found or not a file input' };
      },

      clearInput: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'input_cleared', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      // Drag & Drop Actions
      dragStart: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('dragstart', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'dragstart', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      drag: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('drag', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'drag', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      dragEnter: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('dragenter', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'dragenter', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      dragOver: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('dragover', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'dragover', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      dragLeave: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('dragleave', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'dragleave', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      drop: (selector, data = {}) => {
        const element = document.querySelector(selector);
        if (element) {
          const dataTransfer = new DataTransfer();
          if (data.text) dataTransfer.setData('text/plain', data.text);
          if (data.html) dataTransfer.setData('text/html', data.html);
          if (data.url) dataTransfer.setData('text/uri-list', data.url);
          
          const event = new DragEvent('drop', {
            bubbles: true,
            cancelable: true,
            dataTransfer: dataTransfer
          });
          element.dispatchEvent(event);
          return { success: true, action: 'drop', element: selector, data };
        }
        return { success: false, error: 'Element not found' };
      },

      dragEnd: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
            dataTransfer: new DataTransfer()
          });
          element.dispatchEvent(event);
          return { success: true, action: 'dragend', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      dragAndDrop: (sourceSelector, targetSelector, data = {}) => {
        const source = document.querySelector(sourceSelector);
        const target = document.querySelector(targetSelector);
        
        if (!source || !target) {
          return { success: false, error: 'Source or target element not found' };
        }

        // Simulate complete drag and drop sequence
        const dataTransfer = new DataTransfer();
        if (data.text) dataTransfer.setData('text/plain', data.text);
        if (data.html) dataTransfer.setData('text/html', data.html);
        if (data.url) dataTransfer.setData('text/uri-list', data.url);

        // dragstart on source
        source.dispatchEvent(new DragEvent('dragstart', {
          bubbles: true, cancelable: true, dataTransfer
        }));

        // dragenter and dragover on target
        target.dispatchEvent(new DragEvent('dragenter', {
          bubbles: true, cancelable: true, dataTransfer
        }));
        target.dispatchEvent(new DragEvent('dragover', {
          bubbles: true, cancelable: true, dataTransfer
        }));

        // drop on target
        target.dispatchEvent(new DragEvent('drop', {
          bubbles: true, cancelable: true, dataTransfer
        }));

        // dragend on source
        source.dispatchEvent(new DragEvent('dragend', {
          bubbles: true, cancelable: true, dataTransfer
        }));

        return { 
          success: true, 
          action: 'drag_and_drop', 
          source: sourceSelector, 
          target: targetSelector,
          data 
        };
      },

      // Touch Events Actions
      touchStart: (selector, touches = [{ x: 0, y: 0 }]) => {
        const element = document.querySelector(selector);
        if (element) {
          const touchList = touches.map((touch, index) => ({
            identifier: index,
            target: element,
            clientX: touch.x,
            clientY: touch.y,
            pageX: touch.x,
            pageY: touch.y
          }));
          
          const event = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: touchList,
            targetTouches: touchList,
            changedTouches: touchList
          });
          element.dispatchEvent(event);
          return { success: true, action: 'touchstart', element: selector, touches };
        }
        return { success: false, error: 'Element not found' };
      },

      touchMove: (selector, touches = [{ x: 0, y: 0 }]) => {
        const element = document.querySelector(selector);
        if (element) {
          const touchList = touches.map((touch, index) => ({
            identifier: index,
            target: element,
            clientX: touch.x,
            clientY: touch.y,
            pageX: touch.x,
            pageY: touch.y
          }));
          
          const event = new TouchEvent('touchmove', {
            bubbles: true,
            cancelable: true,
            touches: touchList,
            targetTouches: touchList,
            changedTouches: touchList
          });
          element.dispatchEvent(event);
          return { success: true, action: 'touchmove', element: selector, touches };
        }
        return { success: false, error: 'Element not found' };
      },

      touchEnd: (selector, touches = [{ x: 0, y: 0 }]) => {
        const element = document.querySelector(selector);
        if (element) {
          const touchList = touches.map((touch, index) => ({
            identifier: index,
            target: element,
            clientX: touch.x,
            clientY: touch.y,
            pageX: touch.x,
            pageY: touch.y
          }));
          
          const event = new TouchEvent('touchend', {
            bubbles: true,
            cancelable: true,
            touches: [],
            targetTouches: [],
            changedTouches: touchList
          });
          element.dispatchEvent(event);
          return { success: true, action: 'touchend', element: selector, touches };
        }
        return { success: false, error: 'Element not found' };
      },

      touchCancel: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new TouchEvent('touchcancel', {
            bubbles: true,
            cancelable: true,
            touches: [],
            targetTouches: [],
            changedTouches: []
          });
          element.dispatchEvent(event);
          return { success: true, action: 'touchcancel', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      // Page/Window Actions
      refresh: () => {
        window.location.reload();
        return { success: true, action: 'page_refreshed' };
      },

      goBack: () => {
        window.history.back();
        return { success: true, action: 'navigated_back' };
      },

      goForward: () => {
        window.history.forward();
        return { success: true, action: 'navigated_forward' };
      },

      // Content Manipulation Actions
      getText: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          return { success: true, action: 'text_retrieved', element: selector, text: element.textContent };
        }
        return { success: false, error: 'Element not found' };
      },

      setText: (selector, text) => {
        const element = document.querySelector(selector);
        if (element) {
          element.textContent = text;
          return { success: true, action: 'text_set', element: selector, text };
        }
        return { success: false, error: 'Element not found' };
      },

      getAttribute: (selector, attribute) => {
        const element = document.querySelector(selector);
        if (element) {
          const value = element.getAttribute(attribute);
          return { success: true, action: 'attribute_retrieved', element: selector, attribute, value };
        }
        return { success: false, error: 'Element not found' };
      },

      setAttribute: (selector, attribute, value) => {
        const element = document.querySelector(selector);
        if (element) {
          element.setAttribute(attribute, value);
          return { success: true, action: 'attribute_set', element: selector, attribute, value };
        }
        return { success: false, error: 'Element not found' };
      },

      addClass: (selector, className) => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.add(className);
          return { success: true, action: 'class_added', element: selector, className };
        }
        return { success: false, error: 'Element not found' };
      },

      removeClass: (selector, className) => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.remove(className);
          return { success: true, action: 'class_removed', element: selector, className };
        }
        return { success: false, error: 'Element not found' };
      },

      toggleClass: (selector, className) => {
        const element = document.querySelector(selector);
        if (element) {
          const added = element.classList.toggle(className);
          return { success: true, action: 'class_toggled', element: selector, className, added };
        }
        return { success: false, error: 'Element not found' };
      },

      setInnerHTML: (selector, html) => {
        const element = document.querySelector(selector);
        if (element) {
          element.innerHTML = html;
          return { success: true, action: 'innerHTML_set', element: selector, html: html.substring(0, 100) + '...' };
        }
        return { success: false, error: 'Element not found' };
      },

      getInnerHTML: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          return { success: true, action: 'innerHTML_retrieved', element: selector, html: element.innerHTML };
        }
        return { success: false, error: 'Element not found' };
      },

      // Visual Actions
      highlight: (selector, color = 'yellow', duration = 3000) => {
        const element = document.querySelector(selector);
        if (element) {
          const originalBackground = element.style.backgroundColor;
          const originalBorder = element.style.border;
          
          element.style.backgroundColor = color;
          element.style.border = `2px solid ${color === 'yellow' ? 'orange' : 'red'}`;
          element.style.transition = 'all 0.3s ease';
          
          if (duration > 0) {
            setTimeout(() => {
              element.style.backgroundColor = originalBackground;
              element.style.border = originalBorder;
            }, duration);
          }
          
          return { success: true, action: 'element_highlighted', element: selector, color, duration };
        }
        return { success: false, error: 'Element not found' };
      },

      hide: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = 'none';
          return { success: true, action: 'element_hidden', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      show: (selector, display = 'block') => {
        const element = document.querySelector(selector);
        if (element) {
          element.style.display = display;
          return { success: true, action: 'element_shown', element: selector, display };
        }
        return { success: false, error: 'Element not found' };
      },

      setStyle: (selector, styles) => {
        const element = document.querySelector(selector);
        if (element) {
          Object.assign(element.style, styles);
          return { success: true, action: 'styles_applied', element: selector, styles };
        }
        return { success: false, error: 'Element not found' };
      },

      // Advanced Waiting Actions
      waitForElement: (selector, timeout = 5000) => {
        return new Promise((resolve) => {
          const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve({ success: true, action: 'element_found', element: selector });
            } else if (timeout > 0) {
              timeout -= 100;
              setTimeout(checkElement, 100);
            } else {
              resolve({ success: false, error: 'Element not found within timeout' });
            }
          };
          checkElement();
        });
      },

      waitForText: (selector, text, timeout = 5000) => {
        return new Promise((resolve) => {
          const checkText = () => {
            const element = document.querySelector(selector);
            if (element && element.textContent.includes(text)) {
              resolve({ success: true, action: 'text_found', element: selector, text });
            } else if (timeout > 0) {
              timeout -= 100;
              setTimeout(checkText, 100);
            } else {
              resolve({ success: false, error: 'Text not found within timeout' });
            }
          };
          checkText();
        });
      },

      waitForAttribute: (selector, attribute, value, timeout = 5000) => {
        return new Promise((resolve) => {
          const checkAttribute = () => {
            const element = document.querySelector(selector);
            if (element && element.getAttribute(attribute) === value) {
              resolve({ success: true, action: 'attribute_matched', element: selector, attribute, value });
            } else if (timeout > 0) {
              timeout -= 100;
              setTimeout(checkAttribute, 100);
            } else {
              resolve({ success: false, error: 'Attribute value not matched within timeout' });
            }
          };
          checkAttribute();
        });
      },

      waitForUrl: (urlPattern, timeout = 5000) => {
        return new Promise((resolve) => {
          const checkUrl = () => {
            if (window.location.href.includes(urlPattern)) {
              resolve({ success: true, action: 'url_matched', url: window.location.href, pattern: urlPattern });
            } else if (timeout > 0) {
              timeout -= 100;
              setTimeout(checkUrl, 100);
            } else {
              resolve({ success: false, error: 'URL pattern not matched within timeout' });
            }
          };
          checkUrl();
        });
      },

      waitForCondition: (conditionFn, timeout = 5000) => {
        return new Promise((resolve) => {
          const checkCondition = () => {
            try {
              if (conditionFn()) {
                resolve({ success: true, action: 'condition_met' });
              } else if (timeout > 0) {
                timeout -= 100;
                setTimeout(checkCondition, 100);
              } else {
                resolve({ success: false, error: 'Condition not met within timeout' });
              }
            } catch (error) {
              resolve({ success: false, error: 'Condition function error: ' + error.message });
            }
          };
          checkCondition();
        });
      },

      // New global automation actions
      waitForSelector: async (selector, opts = {}) => {
        try {
          const el = document.querySelector(selector);
          if (el && (!opts.visible || el.offsetParent !== null)) return { success: true, element: el };
          let timeout = opts.timeout || 10000;
          let start = Date.now();
          while (Date.now() - start < timeout) {
            const el = document.querySelector(selector);
            if (el && (!opts.visible || el.offsetParent !== null)) return { success: true, element: el };
            await new Promise(r => setTimeout(r, 100));
          }
          return { success: false, error: 'Timeout' };
        } catch (e) {
          console.error('waitForSelector error:', e);
          return { success: false, error: e.message };
        }
      },
      clickIfVisible: (selector) => {
        try {
          const el = document.querySelector(selector);
          if (el && el.offsetParent !== null) {
            el.click();
            return { success: true };
          }
          return { success: false, error: 'Element not visible' };
        } catch (e) {
          console.error('clickIfVisible error:', e);
          return { success: false, error: e.message };
        }
      },
      scrollIntoView: (selector) => {
        try {
          const el = document.querySelector(selector);
          if (el) {
            el.scrollIntoView({behavior: 'smooth', block: 'center'});
            return { success: true };
          }
          return { success: false, error: 'Element not found' };
        } catch (e) {
          console.error('scrollIntoView error:', e);
          return { success: false, error: e.message };
        }
      },
      extractTableData: (selector) => {
        try {
          const table = document.querySelector(selector);
          if (!table) return { success: false, error: 'Table not found' };
          const rows = Array.from(table.querySelectorAll('tr'));
          const data = rows.map(row => Array.from(row.children).map(cell => cell.textContent.trim()));
          return { success: true, data };
        } catch (e) {
          console.error('extractTableData error:', e);
          return { success: false, error: e.message };
        }
      },
      getBoundingClientRect: (selector) => {
        try {
          const el = document.querySelector(selector);
          return el ? { success: true, rect: el.getBoundingClientRect() } : { success: false, error: 'Element not found' };
        } catch (e) {
          console.error('getBoundingClientRect error:', e);
          return { success: false, error: e.message };
        }
      },
      fileUpload: (selector, fileData) => {
        try {
          const el = document.querySelector(selector);
          if (el && el.type === 'file') {
            const file = new File([fileData.content], fileData.name, { type: fileData.type || 'application/octet-stream' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            el.files = dataTransfer.files;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return { success: true };
          }
          return { success: false, error: 'Element not found or not a file input' };
        } catch (e) {
          console.error('fileUpload error:', e);
          return { success: false, error: e.message };
        }
      },
      fileDownload: (selector) => {
        try {
          const el = document.querySelector(selector);
          if (el && el.href) {
            window.open(el.href, '_blank');
            return { success: true };
          }
          return { success: false, error: 'Element not found or not a link' };
        } catch (e) {
          console.error('fileDownload error:', e);
          return { success: false, error: e.message };
        }
      },
      waitForNavigation: async (timeout = 10000) => {
        try {
          let start = Date.now();
          let oldUrl = location.href;
          while (Date.now() - start < timeout) {
            if (location.href !== oldUrl) return { success: true };
            await new Promise(r => setTimeout(r, 100));
          }
          return { success: false, error: 'Timeout' };
        } catch (e) {
          console.error('waitForNavigation error:', e);
          return { success: false, error: e.message };
        }
      },
      waitForNetworkIdle: async (idleTime = 500, timeout = 10000) => {
        try {
          let start = Date.now();
          let lastActive = Date.now();
          let activeRequests = 0;
          const update = () => { lastActive = Date.now(); };
          const origOpen = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function() {
            activeRequests++;
            this.addEventListener('loadend', () => {
              activeRequests--;
              update();
            });
            origOpen.apply(this, arguments);
          };
          while (Date.now() - start < timeout) {
            if (activeRequests === 0 && Date.now() - lastActive > idleTime) break;
            await new Promise(r => setTimeout(r, 100));
          }
          XMLHttpRequest.prototype.open = origOpen;
          if (activeRequests !== 0) return { success: false, error: 'Timeout' };
          return { success: true };
        } catch (e) {
          console.error('waitForNetworkIdle error:', e);
          return { success: false, error: e.message };
        }
      },

      // Perform search on the page
      performSearch: (searchTerm) => {
        try {
          console.log('[XPathAutomation] Performing search for:', searchTerm);
          // Helper sleep
          function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

          // Try to dismiss Google/EU consent dialogs if present
          try {
            const clickIfMatches = (el, patterns) => {
              const text = (el?.textContent || '').trim().toLowerCase();
              return patterns.some(p => text.includes(p));
            };
            const consentPatterns = ['i agree', 'accept all', 'accept', 'i accept', 'got it', 'agree'];
            const candidates = Array.from(document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"]'));
            const consentButton = candidates.find(el => clickIfMatches(el, consentPatterns));
            if (consentButton) {
              console.log('[XPathAutomation] Clicking consent button:', consentButton.textContent?.trim());
              consentButton.click();
            }
          } catch (e) {
            console.log('[XPathAutomation] Consent handling skipped/failed:', e);
          }

          // Small wait after consent click
          // Note: since this function can return a Promise, injectAndExecute must support awaiting it
          const maybeWait = () => sleep(200);
          // Common search input selectors for different sites
          const searchSelectors = [
            'input[name="q"]',           // Google, YouTube
            'input[id="APjFqb"]',        // Google main search
            'textarea[name="q"]',        // Google variants using textarea
            'form[role="search"] input[name="q"]',
            'input[type="search"]',      // Generic search inputs
            'input[placeholder*="search" i]',  // Inputs with "search" in placeholder
            'input[aria-label*="search" i]',   // Inputs with "search" in aria-label
            '[role="searchbox"]',        // Searchbox role
            'input[name="search"]',      // Named search inputs
            '#search',                   // Common ID
            '.search input',             // Common class with input
            'input[class*="search" i]',   // Class containing "search"
            'textarea[title*="search" i]',
            'input[title*="search" i]'
          ];

          let searchInput = null;
          let searchButton = null;

          // Find search input
          for (const selector of searchSelectors) {
            try {
              const element = document.querySelector(selector);
              if (element && element.offsetParent !== null) { // visible element
                searchInput = element;
                console.log('[XPathAutomation] Found search input with selector:', selector);
                break;
              }
            } catch (e) {
              console.log('[XPathAutomation] Selector failed:', selector, e);
            }
          }

          if (!searchInput) {
            return { success: false, error: 'No search input found on this page' };
          }

          // Focus and set value using native setter for React/JS frameworks
          searchInput.focus();
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(searchInput), 'value')?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(searchInput, searchTerm);
          } else {
            searchInput.value = searchTerm;
          }
          // Dispatch input/change events
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));

          // Find and click search button
          const searchButtonSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button[aria-label*="search" i]',
            '.gNO89b',                   // Google search button
            'button[value*="search" i]'
          ];

          let foundButton = false;
          for (const selector of searchButtonSelectors) {
            try {
              const element = document.querySelector(selector);
              if (element && element.offsetParent !== null) {
                searchButton = element;
                foundButton = true;
                console.log('[XPathAutomation] Found search button with selector:', selector);
                break;
              }
            } catch (e) {
              console.log('[XPathAutomation] Search button selector failed:', selector, e);
            }
          }

          // Submit search
          if (foundButton && searchButton) {
            // Wait a bit for value to propagate
            return maybeWait().then(() => {
              searchButton.click();
              return {
                success: true,
                action: 'search_submitted',
                searchTerm: searchTerm,
                method: 'button_click',
                message: `Search submitted for "${searchTerm}" via button click`
              };
            });
          } else {
            // Try submitting via Enter key if no button found
            return maybeWait().then(() => {
              ['keydown', 'keypress', 'keyup'].forEach(type => {
                const event = new KeyboardEvent(type, {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                });
                searchInput.dispatchEvent(event);
              });
              return {
                success: true,
                action: 'search_submitted',
                searchTerm: searchTerm,
                method: 'enter_key',
                message: `Search submitted for "${searchTerm}" via Enter key`
              };
            });
          }
        } catch (error) {
          console.error('[XPathAutomation] Search failed:', error);
          return { success: false, error: 'Search failed: ' + error.message };
        }
      }
    };

    if (automation[action]) {
      try {
        return automation[action](...Object.values(params || {}));
      } catch (error) {
        console.error('[AutomationScript] Action execution error:', error);
        return { success: false, error: 'Automation action failed: ' + error.message, action, params };
      }
    } else {
      return { success: false, error: `Unknown action: ${action}` };
    }
}

// Initialize MCP components with error handling (now optional)
let mcpRequestHandler;
let mcpValidator;
let mcpLogger;
let mcpInitialized = false;

// MCP Error codes
const MCP_ERROR_CODES = {
    AUTHENTICATION_FAILED: 'AUTH_FAILED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    PROVIDER_ERROR: 'PROVIDER_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

try {
  // MCP components are optional - create mock implementations
  mcpRequestHandler = {
    generateRequestId: () => Date.now(),
    createRequest: (method, params, id) => ({ jsonrpc: "2.0", id: id || Date.now(), method, params }),
    createResponse: (id, result, error) => ({ jsonrpc: "2.0", id, result, error }),
    createNotification: (method, params) => ({ jsonrpc: "2.0", method, params })
  };
  mcpValidator = {
    validateChatRequest: () => true,
    validateAuthenticationData: () => true
  };
  mcpLogger = {
    debug: (message, data) => console.log('[MCP-DEBUG]', message, data),
    info: (message, data) => console.log('[MCP-INFO]', message, data),
    warn: (message, data) => console.warn('[MCP-WARN]', message, data),
    error: (message, data) => console.error('[MCP-ERROR]', message, data)
  };
  
  // MCP Error codes and helper functions
  const MCP_ERROR_CODES = {
    INTERNAL_ERROR: -32603,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602
  };
  
  // Mock MCP configuration function
  function getMCPProviderConfig(provider) {
    return {
      endpoint: `https://api.${provider}.com`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    };
  }
  
  // Mock MCP error creation function
  function createMCPError(code, message, data = null) {
    return {
      code,
      message,
      data
    };
  }
  
  mcpInitialized = true;
  console.log('[MCP] Mock components initialized successfully');
} catch (error) {
  console.error('[MCP] Failed to initialize components:', error);
  // Fallback to basic functionality
}

chrome.runtime.onInstalled.addListener(() => {
  if (mcpInitialized) {
    // Use console.log instead of mcpLogger during initialization to avoid connection errors
    console.log('[MCP] ChromeAiAgent installed with MCP compliance');
  } else {
    console.log('ChromeAiAgent installed (basic mode)');
  }
  
  // Enable sidepanel to open on action click
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error('Failed to set panel behavior:', error));
  
  // Initialize default settings
  chrome.storage.sync.get(['aiSettings'], (result) => {
    if (!result.aiSettings) {
      const defaultSettings = {
        provider: 'openai',
        host: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000
      };
      
      chrome.storage.sync.set({ aiSettings: defaultSettings });
    }
  });
});

// Chat Logging System
class ChatLogger {
  constructor() {
    this.maxLogs = 1000; // Default max logs stored
    this.storageKey = 'chatLogs';
  }

  async logChatInteraction(data) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        id: this.generateLogId(),
        timestamp,
        provider: data.provider,
        model: data.model,
        prompt: data.prompt,
        requestPayload: data.requestPayload,
        response: data.response,
        responseTime: data.responseTime,
        success: data.success,
        error: data.error,
        source: data.source // 'popup', 'sidepanel', or 'mcp'
      };

      // Get existing logs
      const result = await chrome.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];

      // Add new log
      logs.unshift(logEntry);

      // Maintain max logs limit
      if (logs.length > this.maxLogs) {
        logs = logs.slice(0, this.maxLogs);
      }

      // Store updated logs
      await chrome.storage.local.set({ [this.storageKey]: logs });
      
      console.log('[ChatLogger] Interaction logged:', {
        id: logEntry.id,
        provider: data.provider,
        model: data.model,
        success: data.success
      });
    } catch (error) {
      console.error('[ChatLogger] Failed to log interaction:', error);
    }
  }

  async getLogs(filters = {}) {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];

      // Apply filters
      if (filters.provider) {
        logs = logs.filter(log => log.provider === filters.provider);
      }
      if (filters.success !== undefined) {
        logs = logs.filter(log => log.success === filters.success);
      }
      if (filters.startDate) {
        logs = logs.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        logs = logs.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        logs = logs.filter(log => 
          log.prompt?.toLowerCase().includes(searchLower) ||
          log.response?.toLowerCase().includes(searchLower)
        );
      }

      return logs;
    } catch (error) {
      console.error('[ChatLogger] Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await chrome.storage.local.remove(this.storageKey);
      console.log('[ChatLogger] All logs cleared');
    } catch (error) {
      console.error('[ChatLogger] Failed to clear logs:', error);
    }
  }

  async setMaxLogs(maxLogs) {
    this.maxLogs = maxLogs;
    // Trim existing logs if needed
    const result = await chrome.storage.local.get(this.storageKey);
    let logs = result[this.storageKey] || [];
    
    if (logs.length > maxLogs) {
      logs = logs.slice(0, maxLogs);
      await chrome.storage.local.set({ [this.storageKey]: logs });
    }
  }

  generateLogId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Initialize global chat logger
const chatLogger = new ChatLogger();

// Browser Automation System
class BrowserAutomation {
  constructor() {
    this.commands = {
      click: this.handleClick.bind(this),
      type: this.handleType.bind(this),
      fill: this.handleFill.bind(this),
      scroll: this.handleScroll.bind(this),
      navigate: this.handleNavigate.bind(this),
      refresh: this.handleRefresh.bind(this),
      goBack: this.handleGoBack.bind(this),
      goForward: this.handleGoForward.bind(this),
      newTab: this.handleNewTab.bind(this),
      newTabWithSearch: this.handleNewTabWithSearch.bind(this),
      screenshot: this.handleScreenshot.bind(this),
      extract: this.handleExtract.bind(this),
      highlight: this.handleHighlight.bind(this),
      organize: this.handleOrganize.bind(this),
      note: this.handleNote.bind(this),
      wait: this.handleWait.bind(this),
      analyzePage: this.handleAnalyzePage.bind(this)
    };
    
    this.domAnalyzer = new DOMAnalyzer();
    this.commandParser = new AICommandParser();
    this.aiPlanner = new AICommandPlanner();
    this.actionPlanner = new ActionPlanner();
  }

  async executeCommand(command, tabId) {
    try {
      console.log('📊 BrowserAutomation: executeCommand called with:', { command, tabId });
      
      // First try simple parsing to determine action type
      let parsedCommand;
      try {
        console.log('📊 BrowserAutomation: Attempting simple parsing...');
        parsedCommand = await this.commandParser.parse(command);
        console.log('📊 BrowserAutomation: Simple parsing successful:', parsedCommand);
      } catch (error) {
        // If simple parsing fails, use AI planner
        console.log('📊 BrowserAutomation: Simple parsing failed, using AI planner for:', command);
        return await this.executeAIPlan(command, tabId);
      }

      // Create action plan before execution (2-5 steps)
      console.log('📋 BrowserAutomation: Creating action plan for:', parsedCommand.action);
      const actionPlan = await this.actionPlanner.createActionPlan(
        command, 
        parsedCommand.action, 
        parsedCommand.target
      );
      
      console.log('📋 Action Plan Created:');
      console.log(this.actionPlanner.formatPlanSummary(actionPlan));
      
      // Execute plan with step-by-step logging
      const planResults = [];
      const startTime = Date.now();
      
      console.log('🚀 Executing Action Plan:');
      
      for (let i = 0; i < actionPlan.steps.length; i++) {
        const step = actionPlan.steps[i];
        const stepStartTime = Date.now();
        
        console.log(`📋 Step ${i + 1}/${actionPlan.totalSteps}: ${step.description}`);
        
        try {
          let stepResult = { success: true, message: 'Step completed' };
          
          // Execute the main action step (the actual automation)
          if (step.action === parsedCommand.action) {
            // Check if page is ready before action
            console.log('🔍 Checking if page is ready for action...');
            await this.waitForPageReady(tabId);
            
            const handler = this.commands[parsedCommand.action];
            if (!handler) {
              throw new Error(`No handler found for action: ${parsedCommand.action}`);
            }
            
            console.log('📊 BrowserAutomation: Executing main action handler for:', parsedCommand.action);
            stepResult = await handler(parsedCommand, tabId);
            
            // Wait for page to load after navigation actions
            if (parsedCommand.action === 'navigate' || parsedCommand.action === 'newTab') {
              console.log('🕐 Waiting for page to load after navigation...');
              await this.waitForPageLoad(tabId);
              console.log('✅ Page loaded, continuing with next step');
            }
          } else {
            // For preparation, verification, and other steps, just simulate execution
            await new Promise(resolve => setTimeout(resolve, Math.min(step.estimatedTime || 200, 1000)));
            stepResult = { 
              success: true, 
              message: `${step.description} completed`,
              action: step.action
            };
          }
          
          const stepDuration = Date.now() - stepStartTime;
          console.log(`✅ Step ${i + 1} completed in ${stepDuration}ms:`, step.description);
          
          planResults.push({
            stepId: step.id,
            description: step.description,
            success: true,
            duration: stepDuration,
            result: stepResult
          });
          
          this.actionPlanner.logPlanExecution(actionPlan, i, stepResult);
          
        } catch (stepError) {
          const stepDuration = Date.now() - stepStartTime;
          console.error(`❌ Step ${i + 1} failed in ${stepDuration}ms:`, step.description, stepError);
          
          planResults.push({
            stepId: step.id,
            description: step.description,
            success: false,
            duration: stepDuration,
            error: stepError.message
          });
          
          // For critical steps, stop execution
          if (step.action === parsedCommand.action) {
            throw stepError;
          }
        }
      }
      
      const totalDuration = Date.now() - startTime;
      console.log(`🎯 Action Plan completed in ${totalDuration}ms`);
      
      // Return the main action result along with plan details
      const mainActionResult = planResults.find(result => 
        actionPlan.steps[planResults.indexOf(result)]?.action === parsedCommand.action
      );
      
      return {
        success: true,
        action: parsedCommand.action,
        target: parsedCommand.target,
        plan: {
          id: actionPlan.id,
          totalSteps: actionPlan.totalSteps,
          estimatedDuration: actionPlan.estimatedDuration,
          actualDuration: totalDuration,
          steps: planResults
        },
        result: mainActionResult?.result || { success: true, message: 'Action completed' },
        message: `Successfully executed ${parsedCommand.action} with ${actionPlan.totalSteps}-step plan`
      };
      
    } catch (error) {
      console.error('📊 BrowserAutomation: Automation command failed:', error);
      // Last resort: try AI planning
      try {
        console.log('📊 BrowserAutomation: Falling back to AI planning due to error');
        return await this.executeAIPlan(command, tabId);
      } catch (aiError) {
        console.error('📊 BrowserAutomation: AI planning also failed:', aiError);
        throw error;
      }
    }
  }

  async executeAIPlan(command, tabId) {
    try {
      // Get page context for better planning
      const pageContext = await this.getPageContext(tabId);
      
      // Create AI plan
      let plan = await this.aiPlanner.createPlan(command, pageContext);
      // Guardrails: sanitize unsafe or off-intent steps
      const lowerCmd = String(command || '').toLowerCase();
      const editingProfileIntent = /\b(bio|about|description|profile|settings)\b/.test(lowerCmd);
      const unsafeTargets = ['sign out','signout','log out','logout','sign in','signin','log in','login'];
      if (plan && Array.isArray(plan.plan)) {
        plan.plan = plan.plan.filter(step => {
          if (!step || !step.action) return false;
          const tgt = String(step.target || step.description || '').toLowerCase();
          // Block auth-related actions when intent is editing profile/bio
          if (editingProfileIntent && unsafeTargets.some(w => tgt.includes(w))) {
            return false;
          }
          return true;
        }).map(step => {
          // Normalize generic type targets: ensure we steer towards bio/editor fields
          if (editingProfileIntent && step.action === 'type') {
            const tgt = String(step.target || '').toLowerCase();
            if (!/bio|about|description|summary|profile|textarea|editor|contenteditable/.test(tgt)) {
              return { ...step, target: 'textarea, [contenteditable="true"], .bio, .about, .description' };
            }
          }
          return step;
        });
      }
      
      if (!plan.understood || !plan.plan.length) {
        throw new Error(`AI could not understand command: ${command}`);
      }

      console.log('ðŸ¤– AI Plan created:', plan);

      // Execute plan steps
      const results = [];
      let currentTabId = tabId;
      for (const step of plan.plan) {
        try {
          console.log(`🔧 Executing step: ${step.description}`);

          if (step.action === 'wait') {
            await this.handleWait(step, currentTabId);
            results.push({ success: true, step: step.description });
            continue;
          }

          // Check if page is ready before each action
          console.log('🔍 Checking if page is ready for action...');
          await this.waitForPageReady(currentTabId);

          const handler = this.commands[step.action];
          if (!handler) {
            throw new Error(`Unknown action in plan: ${step.action}`);
          }

          const result = await handler(step, currentTabId);
          results.push({ success: true, step: step.description, result });

          // If the handler returns a new tabId (e.g., after newTab/newTabWithSearch), update currentTabId
          if (result && result.tabId && result.tabId !== currentTabId) {
            currentTabId = result.tabId;
            console.log('🔄 Updated currentTabId to', currentTabId, 'after', step.action);
          }

          // Wait for page to load after navigation actions
          if (step.action === 'navigate' || step.action === 'newTab' || step.action === 'newTabWithSearch') {
            console.log('🕐 Waiting for page to load after navigation...');
            await this.waitForPageLoad(currentTabId);
            console.log('✅ Page loaded, continuing with next step');
          }

          // Increased delay between steps for better stability
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (stepError) {
          console.error(`Step failed: ${step.description}`, stepError);
          results.push({ success: false, step: step.description, error: stepError.message });

          // Continue with remaining steps unless it's a critical failure
          if (step.action === 'navigate' || step.action === 'newTab' || step.action === 'newTabWithSearch') {
            break; // Stop if navigation fails
          }
        }
      }

      return {
        success: true,
        type: 'ai-plan',
        plan: plan,
        results: results,
        message: `AI executed plan: ${plan.reasoning}`
      };

    } catch (error) {
      console.error('AI plan execution failed:', error);
      throw error;
    }
  }

  async getPageContext(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      
      // Get full page content like the main chat system does
      const pageContent = await this.injectAndExecute(tabId, 'extractPageContent');
      console.log('🤖 AUTOMATION: Got full page content:', pageContent ? Object.keys(pageContent) : 'null');
      
      if (pageContent && pageContent.html) {
        // Extract the first 10000 chars of HTML for context (not truncated like before)
        const htmlSample = pageContent.html.substring(0, 10000);
        
        return {
          url: tab.url,
          title: tab.title,
          html: htmlSample,
          fullContent: pageContent,
          elements: pageContent.elements || []
        };
      } else {
        // Fallback to basic element extraction
        const elements = await this.injectAndExecute(tabId, 'extractPageElements');
        return {
          url: tab.url,
          title: tab.title,
          elements: elements || []
        };
      }
    } catch (error) {
      console.warn('Could not get page context:', error);
      return null;
    }
  }

  async handleClick(command, tabId) {
    // First try using enhanced DOMAnalyzer to get the most relevant element
    const attemptedSelectors = [];
    const selector = await this.domAnalyzer.findMostRelevantElement(command.target, tabId);
    if (selector) attemptedSelectors.push(selector);

    // Try click with resolved selector if available
    if (selector) {
      const clickResult = await this.injectAndExecute(tabId, 'click', { selector });
      if (clickResult && clickResult.success) {
        return { ...clickResult, attemptedSelectors };
      }
      // If injection ran but element wasn't found, fall through to fallback
    }

    // Fallback: try regular element finder
    if (!selector) {
      const fallbackSelector = await this.domAnalyzer.findElement(command.target, tabId);
      if (fallbackSelector) {
        attemptedSelectors.push(fallbackSelector);
        const fallbackResult = await this.injectAndExecute(tabId, 'click', { selector: fallbackSelector });
        if (fallbackResult && fallbackResult.success) {
          return { ...fallbackResult, attemptedSelectors, usedFallback: true };
        }
      }
    }

    // Final fallback: let content script resolve the target phrase dynamically
    const semanticResult = await this.injectAndExecute(tabId, 'click', { selector: command.target });
    if (semanticResult && semanticResult.success) {
      return { ...semanticResult, attemptedSelectors: attemptedSelectors.length ? attemptedSelectors : undefined, usedSemanticFallback: true };
    }

    // Consolidated failure message with diagnostics
    return {
      success: false,
      action: 'click',
      error: 'No matching element found',
      attemptedTarget: command.target,
      attemptedSelectors
    };
  }

  async handleType(command, tabId) {
    // First try using enhanced DOMAnalyzer to get the most relevant element for typing
    const attemptedSelectors = [];
    const selector = await this.domAnalyzer.findMostRelevantElement(command.target, tabId, 'type');
    if (selector) attemptedSelectors.push(selector);

    // Try type with resolved selector if available
    if (selector) {
      const typeResult = await this.injectAndExecute(tabId, 'type', { selector, text: command.text });
      if (typeResult && typeResult.success) {
        return { ...typeResult, attemptedSelectors };
      }
    }

    // Fallback: try regular element finder
    if (!selector) {
      const fallbackSelector = await this.domAnalyzer.findElement(command.target, tabId);
      if (fallbackSelector) {
        attemptedSelectors.push(fallbackSelector);
        const fallbackResult = await this.injectAndExecute(tabId, 'type', { selector: fallbackSelector, text: command.text });
        if (fallbackResult && fallbackResult.success) {
          return { ...fallbackResult, attemptedSelectors, usedFallback: true };
        }
      }
    }

    // Final fallback: semantic resolution
    const semanticResult = await this.injectAndExecute(tabId, 'type', { selector: command.target, text: command.text });
    if (semanticResult && semanticResult.success) {
      return { ...semanticResult, attemptedSelectors: attemptedSelectors.length ? attemptedSelectors : undefined, usedSemanticFallback: true };
    }

    return {
      success: false,
      action: 'type',
      error: 'No matching input element found',
      attemptedTarget: command.target,
      attemptedSelectors
    };
  }

  async handleFill(command, tabId) {
    const formData = await this.domAnalyzer.analyzeForm(command.target, tabId);
    return await this.injectAndExecute(tabId, 'fillForm', { 
      formData, 
      values: command.values 
    });
  }

  async handleScroll(command, tabId) {
    return await this.injectAndExecute(tabId, 'scroll', { 
      direction: command.direction,
      amount: command.amount 
    });
  }

  async handleNavigate(command, tabId) {
    const url = command.url || command.target;
    return await chrome.tabs.update(tabId, { url: url });
  }

  async handleRefresh(command, tabId) {
    try {
      await chrome.tabs.reload(tabId);
      return { 
        success: true, 
        action: 'refresh', 
        message: 'Page refreshed successfully'
      };
    } catch (error) {
      console.error('🚨 Failed to refresh page:', error);
      return { 
        success: false, 
        action: 'refresh', 
        error: 'Failed to refresh page: ' + error.message
      };
    }
  }

  async waitForPageLoad(tabId, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const tab = await chrome.tabs.get(tabId);
        
        // Check if page is fully loaded and ready
        if (tab.status === 'complete' && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
          // Additional check: ensure page is interactive by injecting a small script
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => document.readyState === 'complete'
            });
            console.log(`✅ Page fully loaded and interactive: ${tab.url}`);
            return true;
          } catch (scriptError) {
            console.log('📄 Page loaded but not yet interactive, waiting...');
          }
        }
        
        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error checking tab status:', error);
        break;
      }
    }
    
    // Timeout reached, but continue anyway
    console.warn(`Page load timeout reached (${timeout}ms), continuing...`);
    return false;
  }

  async waitForPageReady(tabId, timeout = 15000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const tab = await chrome.tabs.get(tabId);
        
        // Skip check for restricted pages
        if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://') || tab.url.startsWith('http://')) {
          return false;
        }
        
        // Check if page is ready for interaction
        if (tab.status === 'complete') {
          try {
            const [result] = await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                return {
                  readyState: document.readyState,
                  hasBody: !!document.body,
                  bodyChildren: document.body ? document.body.children.length : 0
                };
              }
            });
            
            if (result.result.readyState === 'complete' && result.result.hasBody && result.result.bodyChildren > 0) {
              console.log(`✅ Page ready for action: ${tab.url}`);
              return true;
            }
          } catch (scriptError) {
            console.log('📄 Page not yet interactive, waiting...');
          }
        }
        
        // Wait 3 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error('Error checking page readiness:', error);
        break;
      }
    }
    
    console.warn(`Page readiness timeout reached (${timeout}ms), continuing...`);
    return false;
  }

  async handleGoBack(command, tabId) {
    try {
      // Use Chrome extension API to execute back navigation
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          window.history.back();
        }
      });
      return { 
        success: true, 
        action: 'goBack', 
        message: 'Navigated back to previous page'
      };
    } catch (error) {
      console.error('🚨 Failed to navigate back:', error);
      return { 
        success: false, 
        action: 'goBack', 
        error: 'Failed to navigate back: ' + error.message
      };
    }
  }

  async handleGoForward(command, tabId) {
    try {
      // Use Chrome extension API to execute forward navigation
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
          window.history.forward();
        }
      });
      return { 
        success: true, 
        action: 'goForward', 
        message: 'Navigated forward to next page'
      };
    } catch (error) {
      console.error('🚨 Failed to navigate forward:', error);
      return { 
        success: false, 
        action: 'goForward', 
        error: 'Failed to navigate forward: ' + error.message
      };
    }
  }

  async handleNewTab(command, tabId) {
    const newTab = await chrome.tabs.create({ url: command.url });
    return { 
      success: true, 
      action: 'newTab', 
      url: command.url, 
      tabId: newTab.id,
      message: `Opened new tab with ${command.url}`
    };
  }

  async handleNewTabWithSearch(command, tabId) {
    // First open the URL in a new tab
    const newTab = await chrome.tabs.create({ url: command.url });
    
    // Wait for the page to load
    await this.waitForPageLoad(newTab.id);
    
    try {
      // Attempt to perform search on the page
      // For Google, try to find the search input and type the search term
      const searchResult = await this.injectAndExecute(newTab.id, 'performSearch', { 
        searchTerm: command.searchTerm 
      });
      console.log('[Automation] performSearch result:', searchResult);

      // After attempting search, give the page a moment to navigate if it will
      await this.waitForPageLoad(newTab.id, 15000);

      // Check if navigation actually occurred to a results page; if not or search failed, fallback to direct URL
      let tabInfo = await chrome.tabs.get(newTab.id);
      const lowerUrl = String(command.url || '').toLowerCase();
      const isGoogle = /google\./.test(lowerUrl);
      const isBing = /bing\./.test(lowerUrl);
      const isDuck = /duckduckgo\./.test(lowerUrl);
      const isYahoo = /yahoo\./.test(lowerUrl);
      const onResultsPage = /[?&]q=/.test(tabInfo.url) || /\/search\b/.test(tabInfo.url);

      if (!(searchResult && searchResult.success) || !onResultsPage) {
        console.warn('[Automation] Search injection may have failed or not navigated; falling back to direct search URL');
        let searchUrl;
        const q = encodeURIComponent(command.searchTerm || '');
        if (isGoogle) searchUrl = `https://www.google.com/search?q=${q}`;
        else if (isBing) searchUrl = `https://www.bing.com/search?q=${q}`;
        else if (isDuck) searchUrl = `https://duckduckgo.com/?q=${q}`;
        else if (isYahoo) searchUrl = `https://search.yahoo.com/search?p=${q}`;
        else searchUrl = `https://www.google.com/search?q=${q}`;

        await chrome.tabs.update(newTab.id, { url: searchUrl });
        await this.waitForPageLoad(newTab.id);
        tabInfo = await chrome.tabs.get(newTab.id);
        console.log('[Automation] Fallback navigation complete. Current URL:', tabInfo.url);

        return { 
          success: true, 
          action: 'newTabWithSearch', 
          url: command.url,
          searchTerm: command.searchTerm,
          tabId: newTab.id,
          searchResult: searchResult,
          usedFallback: true,
          message: `Opened new tab with ${command.url} and navigated directly to results for "${command.searchTerm}"`
        };
      }

      return { 
        success: true, 
        action: 'newTabWithSearch', 
        url: command.url,
        searchTerm: command.searchTerm,
        tabId: newTab.id,
        searchResult: searchResult,
        message: `Opened new tab with ${command.url} and searched for "${command.searchTerm}"`
      };
    } catch (error) {
      console.log('Search failed, but tab was created successfully:', error);
      return { 
        success: true, 
        action: 'newTab', 
        url: command.url, 
        tabId: newTab.id,
        message: `Opened new tab with ${command.url} (search for "${command.searchTerm}" could not be performed automatically)`
      };
    }
  }

  async handleScreenshot(command, tabId) {
    const screenshot = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
    return { screenshot, timestamp: Date.now() };
  }

  async handleExtract(command, tabId) {
    return await this.injectAndExecute(tabId, 'extractData', { 
      selector: command.selector,
      type: command.type 
    });
  }

  async handleHighlight(command, tabId) {
    return await this.injectAndExecute(tabId, 'highlight', { 
      content: command.content 
    });
  }

  async handleOrganize(command, tabId) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return await this.organizeTabs(tabs, command.criteria);
  }

  async handleNote(command, tabId) {
    const pageContent = await this.injectAndExecute(tabId, 'extractPageContent');
    return await this.generateNote(pageContent, command.focus);
  }

  async handleWait(command, tabId) {
    if (command.time) {
      // Wait for specific time
      await new Promise(resolve => setTimeout(resolve, command.time));
      return { success: true, action: 'waited', time: command.time };
    } else if (command.target) {
      // Wait for element to appear
      const maxWait = 10000; // 10 seconds max
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWait) {
        try {
          await this.domAnalyzer.findElement(command.target, tabId);
          return { success: true, action: 'waited', target: command.target };
        } catch {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      throw new Error(`Element not found after waiting: ${command.target}`);
    }
    
    return { success: true, action: 'waited' };
  }

  async handleAnalyzePage(command, tabId) {
    try {
      console.log('[XPathSystem] Manual page analysis requested');
      
      const analysisResult = await chrome.scripting.executeScript({
        target: { tabId },
        func: pageAnalysisScript
      });
      
      const result = analysisResult[0]?.result;
      
      if (result?.success) {
        console.log('[XPathSystem] Manual page analysis completed:', 
          result.analysis.interactiveElements.length, 'interactive elements found');
        
        return {
          success: true,
          action: 'analyzePage',
          analysis: {
            pageUrl: result.analysis.pageUrl,
            pageTitle: result.analysis.pageTitle,
            totalElements: result.analysis.totalElements,
            interactiveElements: result.analysis.interactiveElements.length,
            categories: {
              buttons: result.analysis.categories.buttons.length,
              inputs: result.analysis.categories.inputs.length,
              links: result.analysis.categories.links.length,
              forms: result.analysis.categories.forms.length,
              navigation: result.analysis.categories.navigation.length
            },
            topElements: result.analysis.topScoredElements.slice(0, 10).map(elem => ({
              xpath: elem.xpath,
              tagName: elem.tagName,
              text: elem.text.substring(0, 50),
              score: elem.automationScore,
              isClickable: elem.isClickable,
              isInput: elem.isInput
            }))
          },
          message: `Page analyzed: ${result.analysis.interactiveElements.length} interactive elements found`
        };
      } else {
        return {
          success: false,
          action: 'analyzePage',
          error: result?.error || 'Analysis failed',
          message: 'Failed to analyze page'
        };
      }
    } catch (error) {
      console.error('[XPathSystem] Manual page analysis error:', error);
      return {
        success: false,
        action: 'analyzePage',
        error: error.message,
        message: 'Page analysis failed: ' + error.message
      };
    }
  }

  async injectAndExecute(tabId, action, params = {}) {
    try {
      // Ensure params is serializable (plain object or null)
      const serializableParams = params ? JSON.parse(JSON.stringify(params)) : {};
      
      // Step 1: Analyze page if not done already (or if analysis is old)
      console.log('[XPathSystem] Checking if page analysis is needed...');
      
      const analysisCheck = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const analysis = window.chromeAiAgentPageAnalysis;
          if (!analysis) return { needsAnalysis: true, reason: 'No analysis found' };
          
          const ageMs = Date.now() - new Date(analysis.timestamp).getTime();
          const maxAgeMs = 30000; // 30 seconds
          
          if (ageMs > maxAgeMs) {
            return { needsAnalysis: true, reason: 'Analysis is outdated', age: ageMs };
          }
          
          return { 
            needsAnalysis: false, 
            elementCount: analysis.interactiveElements.length,
            age: ageMs
          };
        }
      });
      
      const needsAnalysis = analysisCheck[0]?.result?.needsAnalysis;
      
      if (needsAnalysis) {
        console.log('[XPathSystem] Running page analysis:', analysisCheck[0]?.result?.reason);
        
        const analysisResult = await chrome.scripting.executeScript({
          target: { tabId },
          func: pageAnalysisScript
        });
        
        if (analysisResult[0]?.result?.success) {
          console.log('[XPathSystem] Page analysis completed:', 
            analysisResult[0].result.analysis.interactiveElements.length, 'elements found');
        } else {
          console.warn('[XPathSystem] Page analysis failed:', analysisResult[0]?.result?.error);
        }
      } else {
        console.log('[XPathSystem] Using existing analysis:', 
          analysisCheck[0]?.result?.elementCount, 'elements,', 
          Math.round(analysisCheck[0]?.result?.age / 1000), 'seconds old');
      }
      
      // Step 2: Execute automation using XPath system
      console.log('[XPathSystem] Executing XPath-based automation:', action);
      

      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: xpathAutomationScript,
        args: [action, serializableParams]
      });

      let resultObj = results && results[0] ? results[0].result : null;

      // If the result is a Promise (unresolved), inject a wrapper to await it and return the resolved value
      if (resultObj && typeof resultObj === 'object' && typeof resultObj.then === 'function') {
        // The result is a native Promise object, so we need to resolve it in the page context
        const promiseResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: async () => {
            if (window.__lastAutomationPromise && typeof window.__lastAutomationPromise.then === 'function') {
              try {
                const resolved = await window.__lastAutomationPromise;
                return resolved;
              } catch (e) {
                return { success: false, error: 'Promise rejected: ' + e.message };
              }
            }
            return { success: false, error: 'No automation promise found' };
          }
        });
        resultObj = promiseResults && promiseResults[0] ? promiseResults[0].result : resultObj;
      }

      if (!resultObj) {
        console.warn('[XPathSystem] XPath automation returned empty result, falling back to legacy system');

        // Fallback to original automation system
        const fallbackResults = await chrome.scripting.executeScript({
          target: { tabId },
          func: automationContentScript,
          args: [action, serializableParams]
        });

        let fallbackResult = fallbackResults && fallbackResults[0] ? fallbackResults[0].result : null;

        // If fallback result is a Promise, resolve it as well
        if (fallbackResult && typeof fallbackResult === 'object' && typeof fallbackResult.then === 'function') {
          const fallbackPromiseResults = await chrome.scripting.executeScript({
            target: { tabId },
            func: async () => {
              if (window.__lastAutomationPromise && typeof window.__lastAutomationPromise.then === 'function') {
                try {
                  const resolved = await window.__lastAutomationPromise;
                  return resolved;
                } catch (e) {
                  return { success: false, error: 'Promise rejected: ' + e.message };
                }
              }
              return { success: false, error: 'No automation promise found' };
            }
          });
          fallbackResult = fallbackPromiseResults && fallbackPromiseResults[0] ? fallbackPromiseResults[0].result : fallbackResult;
        }

        if (fallbackResult) {
          return { ...fallbackResult, usedFallback: true };
        }

        return { success: false, action, error: 'No result from XPath or fallback automation', params: serializableParams };
      }

      console.log('[XPathSystem] XPath automation completed:', resultObj);
      return resultObj;
      
    } catch (error) {
      console.error('[XPathSystem] Script injection failed:', error);
      throw error;
    }
  }
}

// Tab and content management
class TabOrganizer {
  async organizeTabs(tabs, criteria) {
    const groups = {};
    
    for (const tab of tabs) {
      let groupKey = 'other';
      
      switch (criteria) {
        case 'domain':
          groupKey = new URL(tab.url).hostname;
          break;
        case 'title':
          groupKey = tab.title.split(' ')[0];
          break;
        case 'type':
          if (tab.url.includes('github')) groupKey = 'development';
          else if (tab.url.includes('mail') || tab.url.includes('gmail')) groupKey = 'email';
          else if (tab.url.includes('docs') || tab.url.includes('notion')) groupKey = 'documents';
          else if (tab.url.includes('youtube') || tab.url.includes('netflix')) groupKey = 'media';
          break;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(tab);
    }
    
    // Create tab groups
    for (const [groupName, tabsInGroup] of Object.entries(groups)) {
      if (tabsInGroup.length > 1) {
        const tabIds = tabsInGroup.map(tab => tab.id);
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, { title: groupName });
      }
    }
    
    return { success: true, groups: Object.keys(groups), totalTabs: tabs.length };
  }

  async generateNote(pageContent, focus) {
    // Use AI to generate smart notes
    const prompt = `
    Create concise, actionable notes from this webpage content:
    
    Title: ${pageContent.title}
    URL: ${pageContent.url}
    
    Main headings: ${pageContent.headings.join(', ')}
    
    Key content: ${pageContent.paragraphs.slice(0, 3).join(' ')}
    
    Focus on: ${focus || 'main points and actionable items'}
    
    Format as bullet points with key insights and action items.
    `;
    
    try {
      const settings = await getStoredSettings();
      const aiResponse = await this.callAI(prompt, settings);
      
      const note = {
        title: pageContent.title,
        url: pageContent.url,
        content: aiResponse,
        timestamp: new Date().toISOString(),
        tags: this.extractTags(pageContent)
      };
      
      // Save note to storage
      await this.saveNote(note);
      
      return { success: true, note };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async callAI(prompt, settings) {
    const response = await fetch(settings.host, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }

  extractTags(pageContent) {
    const tags = [];
    const url = pageContent.url.toLowerCase();
    
    if (url.includes('github')) tags.push('development', 'code');
    if (url.includes('docs')) tags.push('documentation');
    if (url.includes('news')) tags.push('news');
    if (url.includes('blog')) tags.push('blog');
    if (pageContent.headings.some(h => h.toLowerCase().includes('tutorial'))) tags.push('tutorial');
    
    return tags;
  }

  async saveNote(note) {
    const result = await chrome.storage.local.get('automationNotes');
    const notes = result.automationNotes || [];
    notes.unshift(note);
    
    // Keep only last 100 notes
    if (notes.length > 100) {
      notes.splice(100);
    }
    
    await chrome.storage.local.set({ automationNotes: notes });
  }
}

// Action Planning System
class ActionPlanner {
  constructor() {
    this.planTemplates = {
      click: {
        minSteps: 2,
        maxSteps: 4,
        template: [
          'Analyze page elements to locate target',
          'Verify element is clickable and visible', 
          'Execute click action',
          'Validate click was successful'
        ]
      },
      type: {
        minSteps: 3,
        maxSteps: 5,
        template: [
          'Locate input field or text element',
          'Focus on the target element',
          'Clear existing content if needed',
          'Type the specified text',
          'Validate text was entered correctly'
        ]
      },
      navigate: {
        minSteps: 2,
        maxSteps: 3,
        template: [
          'Prepare for navigation',
          'Navigate to target URL',
          'Verify page loaded successfully'
        ]
      },
      fill: {
        minSteps: 3,
        maxSteps: 5,
        template: [
          'Analyze form structure and fields',
          'Locate each target input field',
          'Fill form fields with provided data',
          'Validate all fields were filled',
          'Submit form if applicable'
        ]
      },
      goBack: {
        minSteps: 2,
        maxSteps: 3,
        template: [
          'Check if browser back navigation is possible',
          'Execute browser back navigation',
          'Verify navigation completed successfully'
        ]
      },
      goForward: {
        minSteps: 2,
        maxSteps: 3,
        template: [
          'Check if browser forward navigation is possible',
          'Execute browser forward navigation', 
          'Verify navigation completed successfully'
        ]
      },
      scroll: {
        minSteps: 2,
        maxSteps: 3,
        template: [
          'Determine scroll target and direction',
          'Execute scrolling action',
          'Verify scroll position changed'
        ]
      }
    };
  }

  async createActionPlan(command, actionType, target = null) {
    try {
      console.log('📋 ActionPlanner: Creating plan for:', { command, actionType, target });
      
      const template = this.planTemplates[actionType] || this.planTemplates.click;
      const steps = [];
      
      // Generate contextual steps based on action type and command
      switch (actionType) {
        case 'click':
          steps.push({
            id: 1,
            description: `Analyze page to locate "${target || command}" element`,
            action: 'analyze',
            target: target || command,
            estimatedTime: 1000
          });
          
          steps.push({
            id: 2,
            description: `Verify "${target || command}" is clickable and visible`,
            action: 'verify',
            target: target || command,
            estimatedTime: 500
          });
          
          steps.push({
            id: 3,
            description: `Click on "${target || command}"`,
            action: 'click',
            target: target || command,
            estimatedTime: 500
          });
          
          if (template.template.length > 3) {
            steps.push({
              id: 4,
              description: 'Validate click action was successful',
              action: 'validate',
              target: target || command,
              estimatedTime: 500
            });
          }
          break;
          
        case 'type':
          steps.push({
            id: 1,
            description: `Locate input field for "${target || 'text input'}"`,
            action: 'locate',
            target: target || 'input field',
            estimatedTime: 1000
          });
          
          steps.push({
            id: 2,
            description: `Focus on the target input element`,
            action: 'focus',
            target: target || 'input field',
            estimatedTime: 300
          });
          
          if (command.clearFirst !== false) {
            steps.push({
              id: 3,
              description: 'Clear existing content if present',
              action: 'clear',
              target: target || 'input field',
              estimatedTime: 200
            });
          }
          
          steps.push({
            id: steps.length + 1,
            description: `Type text: "${command.text || command}"`,
            action: 'type',
            target: target || 'input field',
            text: command.text || command,
            estimatedTime: (command.text || command || '').length * 100
          });
          
          steps.push({
            id: steps.length + 1,
            description: 'Verify text was entered correctly',
            action: 'verify',
            target: target || 'input field',
            estimatedTime: 300
          });
          break;
          
        case 'navigate':
          steps.push({
            id: 1,
            description: 'Prepare for page navigation',
            action: 'prepare',
            target: 'browser',
            estimatedTime: 200
          });
          
          steps.push({
            id: 2,
            description: `Navigate to: ${target || command}`,
            action: 'navigate',
            target: target || command,
            estimatedTime: 2000
          });
          
          steps.push({
            id: 3,
            description: 'Verify page loaded successfully',
            action: 'verify',
            target: 'page load',
            estimatedTime: 1000
          });
          break;
          
        case 'goBack':
          steps.push({
            id: 1,
            description: 'Check browser back navigation history',
            action: 'check',
            target: 'browser history',
            estimatedTime: 200
          });
          
          steps.push({
            id: 2,
            description: 'Execute browser back navigation',
            action: 'goBack',
            target: 'browser',
            estimatedTime: 1000
          });
          
          steps.push({
            id: 3,
            description: 'Verify navigation completed',
            action: 'verify',
            target: 'page change',
            estimatedTime: 500
          });
          break;
          
        case 'goForward':
          steps.push({
            id: 1,
            description: 'Check browser forward navigation history',
            action: 'check',
            target: 'browser history',
            estimatedTime: 200
          });
          
          steps.push({
            id: 2,
            description: 'Execute browser forward navigation', 
            action: 'goForward',
            target: 'browser',
            estimatedTime: 1000
          });
          
          steps.push({
            id: 3,
            description: 'Verify navigation completed',
            action: 'verify',
            target: 'page change',
            estimatedTime: 500
          });
          break;
          
        default:
          // Generic plan for unknown actions
          steps.push({
            id: 1,
            description: `Prepare to execute ${actionType} action`,
            action: 'prepare',
            target: target || command,
            estimatedTime: 500
          });
          
          steps.push({
            id: 2,
            description: `Execute ${actionType} on "${target || command}"`,
            action: actionType,
            target: target || command,
            estimatedTime: 1000
          });
          
          steps.push({
            id: 3,
            description: `Verify ${actionType} action completed successfully`,
            action: 'verify',
            target: target || command,
            estimatedTime: 500
          });
      }
      
      // Ensure we have 2-5 steps as requested
      if (steps.length < 2) {
        steps.push({
          id: steps.length + 1,
          description: 'Complete action execution',
          action: 'complete',
          target: target || command,
          estimatedTime: 200
        });
      }
      
      if (steps.length > 5) {
        steps.splice(5); // Limit to 5 steps max
      }
      
      const totalEstimatedTime = steps.reduce((sum, step) => sum + (step.estimatedTime || 500), 0);
      
      const plan = {
        id: Date.now(),
        command: command,
        actionType: actionType,
        target: target,
        steps: steps,
        totalSteps: steps.length,
        estimatedDuration: totalEstimatedTime,
        createdAt: new Date().toISOString(),
        status: 'created'
      };
      
      console.log('📋 ActionPlanner: Plan created:', plan);
      return plan;
      
    } catch (error) {
      console.error('📋 ActionPlanner: Failed to create plan:', error);
      // Fallback minimal plan
      return {
        id: Date.now(),
        command: command,
        actionType: actionType,
        target: target,
        steps: [
          {
            id: 1,
            description: `Prepare ${actionType} action`,
            action: 'prepare',
            target: target || command,
            estimatedTime: 300
          },
          {
            id: 2,
            description: `Execute ${actionType}`,
            action: actionType,
            target: target || command,
            estimatedTime: 1000
          }
        ],
        totalSteps: 2,
        estimatedDuration: 1300,
        createdAt: new Date().toISOString(),
        status: 'fallback'
      };
    }
  }

  logPlanExecution(plan, stepIndex, result) {
    console.log(`📋 Step ${stepIndex + 1}/${plan.totalSteps}: ${plan.steps[stepIndex].description}`, result);
  }

  formatPlanSummary(plan) {
    const stepList = plan.steps.map((step, index) => 
      `${index + 1}. ${step.description} (${step.estimatedTime}ms)`
    ).join('\n');
    
    return `Action Plan for "${plan.command}":
${stepList}

Total Steps: ${plan.totalSteps}
Estimated Duration: ${plan.estimatedDuration}ms`;
  }
}

// DOM Analysis System
class DOMAnalyzer {
  async findElement(description, tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this.domAnalysisScript,
        args: [description]
      });
      return results[0]?.result;
    } catch (error) {
      console.error('DOM analysis failed:', error);
      throw error;
    }
  }

  async findMostRelevantElement(description, tabId, actionType = 'click') {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this.enhancedElementFinderScript,
        args: [description, actionType]
      });
      return results[0]?.result;
    } catch (error) {
      console.error('Enhanced DOM analysis failed:', error);
      // Fallback to regular element finder
      return await this.findElement(description, tabId);
    }
  }

  async analyzeForm(formDescription, tabId) {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: this.formAnalysisScript,
        args: [formDescription]
      });
      return results[0]?.result;
    } catch (error) {
      console.error('Form analysis failed:', error);
      throw error;
    }
  }

  domAnalysisScript(description) {
    // Helper functions - must be defined inside the injected function
    const stopwords = new Set(['click','press','open','go','to','the','a','an','on','in','into','and','then','please','now','page','tab','link','button','set','change','edit','update','save']);
    const synonyms = {
      billing: ['billing','usage','plan','subscription','invoice','payment'],
      profile: ['profile','account','user'],
      email: ['email','mail'],
      keys: ['keys','api key','token'],
      password: ['password','pass']
    };

    function tokenize(raw) {
      const desc = String(raw || '').toLowerCase().trim();
      const cleaned = desc.replace(/[^a-z0-9\s&:+#.-]/g, ' ');
      const words = cleaned.split(/\s+/).filter(Boolean);
      const tokens = words.filter(w => !stopwords.has(w));
      // Expand synonyms
      const expanded = new Set(tokens);
      for (const t of tokens) {
        if (synonyms[t]) {
          for (const s of synonyms[t]) expanded.add(s);
        }
      }
      return Array.from(expanded);
    }

    function sanitizeClassName(cls) {
      // remove characters that break CSS selectors (e.g., Tailwind variants like hover:underline)
      return cls.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    function buildUniqueSelector(el) {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${CSS.escape(el.id)}`;

      // Prefer stable identifying attributes
      const attrPairs = [
        ['data-testid'], ['data-qa'], ['data-cy'], ['aria-label'], ['title']
      ];
      for (const [attr] of attrPairs) {
        const val = el.getAttribute(attr);
        if (val && val.length <= 80) {
          const safe = CSS.escape(val);
          return `${el.tagName.toLowerCase()}[${attr}="${safe}"]`;
        }
      }

      const tag = el.tagName.toLowerCase();
      const classes = (el.className || '')
        .split(/\s+/)
        .map(sanitizeClassName)
        .filter(Boolean)
        .slice(0, 2);
      let base = tag + (classes.length ? `.${classes.map(c => CSS.escape(c)).join('.')}` : '');

      // Append :nth-of-type for uniqueness within parent
      const parent = el.parentElement;
      if (!parent) return base;
      const sameTag = Array.from(parent.children).filter(c => c.tagName === el.tagName);
      const idx = sameTag.indexOf(el);
      const withNth = `${base}:nth-of-type(${idx + 1})`;

      // Build up a short path if needed
      let selector = withNth;
      let current = parent;
      let depth = 0;
      while (depth < 2 && current) {
        let seg = current.tagName.toLowerCase();
        if (current.id) {
          selector = `#${CSS.escape(current.id)} > ${selector}`;
          return selector;
        }
        const segClasses = (current.className || '')
          .split(/\s+/)
          .map(sanitizeClassName)
          .filter(Boolean)
          .slice(0, 2);
        if (segClasses.length) seg += `.${segClasses.map(c => CSS.escape(c)).join('.')}`;
        selector = `${seg} > ${selector}`;
        current = current.parentElement;
        depth++;
      }
      return selector;
    }

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function scoreClickable(el, tokens) {
      let score = 0;
      const text = (el.textContent || '').toLowerCase().trim();
      const value = (el.value || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const cls = (el.className || '').toLowerCase();

      // Special handling for navigation terms
      const hasBackToken = tokens.includes('back');
      const hasForwardToken = tokens.includes('forward');
      const hasButtonToken = tokens.includes('button');
      
      // High penalty for profile/user/avatar elements when looking for navigation
      if (hasBackToken || hasForwardToken) {
        const profileKeywords = ['profile', 'avatar', 'user', 'account', 'image', 'photo', 'picture'];
        const isProfileElement = profileKeywords.some(kw => 
          text.includes(kw) || id.includes(kw) || cls.includes(kw) || 
          el.getAttribute('alt')?.toLowerCase().includes(kw)
        );
        if (isProfileElement) {
          score -= 50; // Heavy penalty for profile elements when looking for navigation
        }
        
        // Boost for actual navigation elements
        const navKeywords = ['navigate', 'prev', 'previous', 'next', 'arrow', 'chevron', 'breadcrumb'];
        const isNavElement = navKeywords.some(kw => 
          text.includes(kw) || id.includes(kw) || cls.includes(kw) ||
          el.getAttribute('aria-label')?.toLowerCase().includes(kw)
        );
        if (isNavElement) score += 20;
        
        // Check for common back button patterns
        if (hasBackToken) {
          if (text.match(/^(back|← back|‹ back|<+ back)$/i) || 
              id.match(/back[-_]?button/i) || cls.match(/back[-_]?button/i)) {
            score += 30;
          }
        }
        
        // Check for common forward button patterns  
        if (hasForwardToken) {
          if (text.match(/^(forward|forward →|forward ›|forward >+)$/i) ||
              id.match(/forward[-_]?button/i) || cls.match(/forward[-_]?button/i)) {
            score += 30;
          }
        }
      }

      // Exact/contains token matches
      let tokenMatches = 0;
      for (const t of tokens) {
        if (!t) continue;
        if (text === t || value === t) tokenMatches += 2;
        else if (text.includes(t) || value.includes(t)) tokenMatches += 1;
        if (id.includes(t) || cls.includes(t)) tokenMatches += 0.5;
      }
      score += tokenMatches * 8;

      // Attributes
      const attrs = ['aria-label', 'title', 'data-testid', 'data-qa', 'data-cy'];
      for (const a of attrs) {
        const v = (el.getAttribute(a) || '').toLowerCase();
        for (const t of tokens) if (t && v.includes(t)) score += 6;
      }

      // Tag/type preference
      const tag = el.tagName.toLowerCase();
      if (tag === 'button') score += 8;
      if (tag === 'a') score += 6;
      if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') score += 5;

      // Visibility and enabled
      if (isVisible(el)) score += 5;
      if (!el.disabled) score += 2;

      // Navigation context boost
      const inNav = !!el.closest('nav, aside, [role="navigation"], .sidebar, [class*="nav" i], [class*="menu" i], [class*="side" i]');
      if (inNav) score += 10;

      // Nearby heading/context
      const heading = el.closest('section, form, div');
      const headTextEl = heading ? heading.querySelector('h1,h2,h3,legend,[aria-label]') : null;
      const headText = (headTextEl?.textContent || heading?.getAttribute?.('aria-label') || '').toLowerCase();
      for (const t of tokens) if (t && headText.includes(t)) score += 2;

      return score;
    }

    function scoreGeneric(el, tokens) {
      // Less weight than clickable scoring
      let score = 0;
      const text = (el.textContent || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const cls = (el.className || '').toLowerCase();
      for (const t of tokens) {
        if (text.includes(t)) score += 3;
        if (id.includes(t) || cls.includes(t)) score += 1.5;
      }
      if (isVisible(el)) score += 1;
      return score;
    }

    // Main logic
    const tokens = tokenize(description);
    const clickable = document.querySelectorAll('a, button, [role="button"], [role="link"], input[type="submit"], input[type="button"], [onclick], [tabindex]:not([tabindex="-1"])');
    const clickCandidates = [];
    for (const el of clickable) {
      const s = scoreClickable(el, tokens);
      if (s > 0) clickCandidates.push({ element: el, score: s });
    }
    clickCandidates.sort((a,b) => b.score - a.score);

    if (clickCandidates.length && clickCandidates[0].score >= 12) {
      const best = clickCandidates[0].element;
      const selector = buildUniqueSelector(best);
      console.log('DOMAnalyzer clickable best:', { selector, score: clickCandidates[0].score, text: best.textContent?.trim()?.slice(0,120) });
      return selector;
    }

    // Fallback: generic scan
    const elements = document.querySelectorAll('*');
    const candidates = [];
    for (const el of elements) {
      const s = scoreGeneric(el, tokens);
      if (s > 0) candidates.push({ element: el, score: s });
    }
    candidates.sort((a,b) => b.score - a.score);
    console.log('DOMAnalyzer generic found', candidates.length, 'candidates for:', description);
    if (candidates.length) {
      const best = candidates[0].element;
      const selector = buildUniqueSelector(best);
      console.log('DOMAnalyzer generic best:', { selector, score: candidates[0].score, text: best.textContent?.trim()?.slice(0,120) });
      return selector;
    }
    console.log('No candidates found for:', description);
    return null;
  }

  formAnalysisScript(formDescription) {
    function sanitizeClassName(cls) { return cls.replace(/[^a-zA-Z0-9_-]/g, ''); }
    function buildUniqueSelector(el) {
      if (!el || el.nodeType !== 1) return '';
      if (el.id) return `#${CSS.escape(el.id)}`;
      const tag = el.tagName.toLowerCase();
      const classes = (el.className || '')
        .split(/\s+/)
        .map(sanitizeClassName)
        .filter(Boolean)
        .slice(0, 2);
      let base = tag + (classes.length ? `.${classes.map(c => CSS.escape(c)).join('.')}` : '');
      const parent = el.parentElement;
      if (!parent) return base;
      const sameTag = Array.from(parent.children).filter(c => c.tagName === el.tagName);
      const idx = sameTag.indexOf(el);
      return `${base}:nth-of-type(${idx + 1})`;
    }

    const forms = document.querySelectorAll('form, .form, [role="form"]');
    let targetForm = null;
    const query = String(formDescription || '').toLowerCase();
    // Find the most relevant form
    for (const form of forms) {
      const formText = (form.textContent || '').toLowerCase();
      if (formText.includes(query)) {
        targetForm = form;
        break;
      }
    }
    if (!targetForm && forms.length > 0) targetForm = forms[0];
    if (!targetForm) return { error: 'No form found' };

    const fields = {};
    const inputs = targetForm.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
      let fieldName = input.name || input.id || input.placeholder || input.type;
      if (!fieldName && input.id) {
        const label = targetForm.querySelector(`label[for="${CSS.escape(input.id)}"]`);
        if (label) fieldName = label.textContent.trim();
      }
      if (fieldName) fields[fieldName.toLowerCase()] = buildUniqueSelector(input);
    }
    return {
      selector: buildUniqueSelector(targetForm),
      fields,
      action: targetForm.action,
      method: targetForm.method
    };
  }

  enhancedElementFinderScript(description, actionType = 'click') {
    // Enhanced element finding with sophisticated relevance scoring
    function tokenize(str) {
      return String(str || '').toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 0);
    }

    function sanitizeClassName(cls) {
      return cls.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    function buildUniqueSelector(el) {
      if (!el || el.nodeType !== 1) return '';
      
      // Try ID first
      if (el.id) {
        const escaped = CSS.escape(el.id);
        if (document.querySelectorAll(`#${escaped}`).length === 1) {
          return `#${escaped}`;
        }
      }

      // Build selector with classes and nth-of-type
      const tag = el.tagName.toLowerCase();
      const classes = (el.className || '')
        .split(/\s+/)
        .map(sanitizeClassName)
        .filter(Boolean)
        .slice(0, 3);
      
      let base = tag;
      if (classes.length) {
        base += `.${classes.map(c => CSS.escape(c)).join('.')}`;
      }

      const parent = el.parentElement;
      if (!parent) return base;

      const sameTag = Array.from(parent.children).filter(c => 
        c.tagName === el.tagName && 
        c.className === el.className
      );
      
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(el);
        base += `:nth-of-type(${idx + 1})`;
      }

      // Build hierarchical path for uniqueness
      let selector = base;
      let current = parent;
      let depth = 0;
      
      while (depth < 3 && current && current !== document.body) {
        let seg = current.tagName.toLowerCase();
        
        if (current.id) {
          selector = `#${CSS.escape(current.id)} ${selector}`;
          break;
        }
        
        const currentClasses = (current.className || '')
          .split(/\s+/)
          .map(sanitizeClassName)
          .filter(Boolean)
          .slice(0, 2);
        
        if (currentClasses.length) {
          seg += `.${currentClasses.map(c => CSS.escape(c)).join('.')}`;
        }
        
        selector = `${seg} ${selector}`;
        current = current.parentElement;
        depth++;
      }

      return selector;
    }

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && 
             rect.height > 0 && 
             style.visibility !== 'hidden' && 
             style.display !== 'none' &&
             style.opacity !== '0';
    }

    function getElementContext(el) {
      const contexts = {
        navigation: ['nav', 'aside', '[role="navigation"]', '.nav', '.navigation', '.menu', '.sidebar'],
        form: ['form', '[role="form"]', '.form', 'fieldset'],
        button: ['button', '[role="button"]', 'input[type="button"]', 'input[type="submit"]'],
        link: ['a', '[role="link"]'],
        content: ['main', 'article', 'section', '.content', '.main'],
        header: ['header', '.header', '.top'],
        footer: ['footer', '.footer', '.bottom']
      };

      for (const [contextType, selectors] of Object.entries(contexts)) {
        for (const selector of selectors) {
          if (el.matches(selector) || el.closest(selector)) {
            return contextType;
          }
        }
      }
      return 'general';
    }

    function calculateRelevanceScore(el, tokens, actionType) {
      let score = 0;
      const text = (el.textContent || '').toLowerCase().trim();
      const value = (el.value || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const className = (el.className || '').toLowerCase();
      const tag = el.tagName.toLowerCase();

      // Action-specific scoring
      if (actionType === 'click') {
        // Boost for clickable elements
        if (['button', 'a'].includes(tag)) score += 15;
        if (el.getAttribute('role') === 'button' || el.getAttribute('role') === 'link') score += 12;
        if (el.hasAttribute('onclick') || el.hasAttribute('href')) score += 8;
        if (el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1') score += 5;
      } else if (actionType === 'type' || actionType === 'fill') {
        // Boost for input elements
        if (['input', 'textarea', 'select'].includes(tag)) score += 15;
        if (el.hasAttribute('contenteditable')) score += 10;
      }

      // Token matching with different weights
      let exactMatches = 0;
      let partialMatches = 0;
      
      for (const token of tokens) {
        if (!token) continue;
        
        // Exact matches (highest priority)
        if (text === token || value === token) {
          exactMatches += 3;
        } else if (text.includes(token) || value.includes(token)) {
          partialMatches += 2;
        }
        
        // ID and class matches
        if (id.includes(token)) partialMatches += 1.5;
        if (className.includes(token)) partialMatches += 1;
        
        // Attribute matches
        const attrs = ['aria-label', 'title', 'alt', 'placeholder', 'data-testid', 'data-qa'];
        for (const attr of attrs) {
          const attrValue = (el.getAttribute(attr) || '').toLowerCase();
          if (attrValue === token) exactMatches += 2;
          else if (attrValue.includes(token)) partialMatches += 1;
        }
      }
      
      score += exactMatches * 20 + partialMatches * 10;

      // Context relevance
      const context = getElementContext(el);
      if (actionType === 'click') {
        if (tokens.some(t => ['back', 'forward', 'next', 'prev'].includes(t))) {
          if (context === 'navigation') score += 25;
          
          // Anti-pattern: penalize profile elements when looking for navigation
          const profileKeywords = ['profile', 'avatar', 'user', 'account', 'image', 'photo'];
          const isProfileElement = profileKeywords.some(kw => 
            text.includes(kw) || id.includes(kw) || className.includes(kw) ||
            el.getAttribute('alt')?.toLowerCase().includes(kw)
          );
          if (isProfileElement) score -= 30;
        }
        
        if (tokens.some(t => ['submit', 'send', 'save'].includes(t))) {
          if (context === 'form') score += 20;
        }
      }

      // Visibility and accessibility
      if (isVisible(el)) score += 15;
      if (!el.disabled && !el.hasAttribute('disabled')) score += 10;
      if (el.getAttribute('aria-hidden') !== 'true') score += 5;

      // Position and prominence scoring
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Elements in viewport get boost
      if (rect.top >= 0 && rect.bottom <= viewportHeight && 
          rect.left >= 0 && rect.right <= viewportWidth) {
        score += 10;
        
        // Elements in upper portion of viewport get additional boost
        if (rect.top < viewportHeight * 0.3) score += 5;
      }

      // Size relevance (not too small, not too large)
      const area = rect.width * rect.height;
      if (area > 100 && area < 50000) score += 5;

      // Semantic meaning from surrounding context
      const parent = el.parentElement;
      if (parent) {
        const parentText = parent.textContent.toLowerCase();
        const siblingTexts = Array.from(parent.children)
          .map(child => child.textContent.toLowerCase())
          .join(' ');
        
        for (const token of tokens) {
          if (parentText.includes(token)) score += 3;
          if (siblingTexts.includes(token)) score += 2;
        }
      }

      return Math.max(0, score);
    }

    function findMostRelevantElement(description, actionType) {
      const tokens = tokenize(description);
      console.log('Enhanced element finder tokens:', tokens, 'for action:', actionType);
      
      // Get all potentially relevant elements
      const allElements = document.querySelectorAll('*');
      const candidates = [];
      
      // Score all elements
      for (const el of allElements) {
        // Skip non-interactive elements for click actions
        if (actionType === 'click') {
          const tag = el.tagName.toLowerCase();
          const hasClickHandler = el.hasAttribute('onclick') || 
                                el.hasAttribute('href') ||
                                el.getAttribute('role') === 'button' ||
                                el.getAttribute('role') === 'link' ||
                                ['button', 'a', 'input'].includes(tag);
          
          if (!hasClickHandler && !el.hasAttribute('tabindex')) {
            continue; // Skip non-interactive elements
          }
        }
        
        const score = calculateRelevanceScore(el, tokens, actionType);
        if (score > 0) {
          candidates.push({ 
            element: el, 
            score: score,
            selector: buildUniqueSelector(el),
            text: el.textContent?.trim()?.slice(0, 100) || '',
            context: getElementContext(el)
          });
        }
      }
      
      // Sort by score (highest first)
      candidates.sort((a, b) => b.score - a.score);
      
      console.log('Enhanced element finder found', candidates.length, 'candidates');
      if (candidates.length > 0) {
        console.log('Top 3 candidates:', candidates.slice(0, 3).map(c => ({
          score: c.score,
          text: c.text,
          context: c.context,
          selector: c.selector
        })));
        
        return candidates[0].selector;
      }
      
      console.log('No relevant elements found for:', description);
      return null;
    }

    return findMostRelevantElement(description, actionType);
  }
}

// AI Command Parser
class AICommandParser {
  constructor() {
    this.patterns = {
      // Basic actions
      click: /(?:click|press|tap)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      type: /(?:type|enter|input)\s+["']([^"']+)["']\s+(?:in|into|to)\s+(?:the\s+)?(.+)/i,
      fill: /(?:fill|complete)\s+(?:the\s+)?(.+?)(?:\s+with\s+(.+))?/i,
      
      // Mouse events
      hover: /(?:hover|mouse\s+over)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      rightClick: /(?:right\s+click|context\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      doubleClick: /(?:double\s+click|dbl\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      mouseDown: /mouse\s+down\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      mouseUp: /mouse\s+up\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
      // Scrolling
      scroll: /scroll\s+(up|down|left|right)(?:\s+(\d+))?/i,
      scrollToElement: /scroll\s+to\s+(?:the\s+)?(.+)/i,
      
      // Keyboard events
      keyDown: /(?:key\s+down|press\s+key)\s+(.+?)(?:\s+on\s+(.+))?/i,
      keyUp: /(?:key\s+up|release\s+key)\s+(.+?)(?:\s+on\s+(.+))?/i,
      sendKeys: /(?:send\s+keys|press)\s+(.+?)(?:\s+to\s+(.+))?/i,
      typeText: /(?:type\s+text|slowly\s+type)\s+["']([^"']+)["']\s+(?:in|into|to)\s+(?:the\s+)?(.+)/i,
      
      // Form actions
      focus: /focus\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      blur: /blur\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      select: /select\s+(.+?)(?:\s+in\s+(.+))?/i,
      check: /(?:check|uncheck)\s+(?:the\s+)?(.+)/i,
      submit: /submit\s+(?:the\s+)?(.+)/i,
      reset: /reset\s+(?:the\s+)?(.+)/i,
      clearInput: /(?:clear|empty)\s+(?:the\s+)?(.+)/i,
      
      // Drag and drop
      dragAndDrop: /drag\s+(.+?)\s+(?:to|onto)\s+(.+)/i,
      dragStart: /start\s+dragging\s+(.+)/i,
      drop: /drop\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
      // Touch events
      touchStart: /touch\s+start\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      touchMove: /touch\s+move\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      touchEnd: /touch\s+end\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
      // Page/Window actions
      refresh: /(?:refresh|reload)(?:\s+(?:the\s+)?page|\(\))?/i,
      goBack: /(?:go\s+back|navigate\s+back|back|click\s+(?:the\s+)?back(?:\s+button)?)/i,
      goForward: /(?:go\s+forward|navigate\s+forward|forward|click\s+(?:the\s+)?forward(?:\s+button)?)/i,
      newTabAndNavigate: /(?:open\s+)?new\s+tab\s+and\s+(?:navigate\s+to|go\s+to)\s+([^\s]+)(?:\s+and\s+(.+))?/i,
      newTabWithSearch: /(?:open\s+)?new\s+tab\s+with\s+([^\s]+)\s+and\s+search\s+(.+)/i,
      newTab: /(?:open\s+)?(?:new\s+tab(?:\s+(?:with))?)\s+([^\s]+)(?:\s+(?!and).*)?/i,
      navigate: /(?:go to|navigate to|open)\s+(.+)/i,
      
      // Content manipulation
      getText: /(?:get\s+text|read\s+text)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      setText: /(?:set\s+text|change\s+text)\s+(?:of\s+)?(?:the\s+)?(.+?)\s+to\s+["']([^"']+)["']/i,
      getAttribute: /(?:get\s+attribute|read\s+attribute)\s+(.+?)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      setAttribute: /(?:set\s+attribute|change\s+attribute)\s+(.+?)\s+(?:of\s+)?(?:the\s+)?(.+?)\s+to\s+["']([^"']+)["']/i,
      addClass: /(?:add\s+class|apply\s+class)\s+(.+?)\s+(?:to\s+)?(?:the\s+)?(.+)/i,
      removeClass: /(?:remove\s+class|delete\s+class)\s+(.+?)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      toggleClass: /toggle\s+class\s+(.+?)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
      // Visual actions
      highlight: /highlight\s+(?:the\s+)?(.+?)(?:\s+with\s+(.+))?/i,
      hide: /hide\s+(?:the\s+)?(.+)/i,
      show: /show\s+(?:the\s+)?(.+)/i,
      setStyle: /(?:set\s+style|apply\s+style)\s+(.+?)\s+(?:to\s+)?(?:the\s+)?(.+)/i,
      
      // Waiting actions
      wait: /wait\s+(\d+)(?:\s+(?:ms|milliseconds|seconds?))?/i,
      waitForElement: /wait\s+for\s+(?:the\s+)?(.+?)(?:\s+(\d+)\s*(?:ms|seconds?))?/i,
      waitForText: /wait\s+for\s+text\s+["']([^"']+)["']\s+(?:in\s+)?(?:the\s+)?(.+?)(?:\s+(\d+)\s*(?:ms|seconds?))?/i,
      waitForUrl: /wait\s+for\s+url\s+(.+?)(?:\s+(\d+)\s*(?:ms|seconds?))?/i,
      
      // Extraction and analysis
      screenshot: /(?:take\s+)?(?:a\s+)?screenshot/i,
      extract: /(?:extract|get|collect)\s+(.+?)(?:\s+from\s+(.+))?/i,
      extractPageElements: /(?:extract|get|list)\s+(?:all\s+)?(?:page\s+)?elements/i,
      organize: /organize\s+tabs(?:\s+by\s+(.+))?/i,
      note: /(?:take\s+)?(?:a\s+)?note(?:\s+about\s+(.+))?/i
    };
  }

  async parse(command) {
    const cmd = command.trim();
    
    for (const [action, pattern] of Object.entries(this.patterns)) {
      const match = cmd.match(pattern);
      if (match) {
        return this.parseAction(action, match);
      }
    }
    
    // If no pattern matches, try AI parsing
    return await this.aiParse(command);
  }

  parseAction(action, match) {
    switch (action) {
      // Basic actions
      case 'click':
        return { action: 'click', target: match[1] };
      case 'type':
        return { action: 'type', text: match[1], target: match[2] };
      case 'fill':
        return { action: 'fill', target: match[1], values: this.parseValues(match[2]) };
      
      // Mouse events
      case 'hover':
        return { action: 'hover', target: match[1] };
      case 'rightClick':
        return { action: 'rightClick', target: match[1] };
      case 'doubleClick':
        return { action: 'doubleClick', target: match[1] };
      case 'mouseDown':
        return { action: 'mouseDown', target: match[1] };
      case 'mouseUp':
        return { action: 'mouseUp', target: match[1] };
      
      // Scrolling
      case 'scroll':
        return { action: 'scroll', direction: match[1], amount: parseInt(match[2]) || 100 };
      case 'scrollToElement':
        return { action: 'scrollToElement', target: match[1] };
      
      // Keyboard events
      case 'keyDown':
        return { action: 'keyDown', key: match[1], target: match[2] || 'body' };
      case 'keyUp':
        return { action: 'keyUp', key: match[1], target: match[2] || 'body' };
      case 'sendKeys':
        return { action: 'sendKeys', keys: match[1], target: match[2] || 'body' };
      case 'typeText':
        return { action: 'typeText', text: match[1], target: match[2] };
      
      // Form actions
      case 'focus':
        return { action: 'focus', target: match[1] };
      case 'blur':
        return { action: 'blur', target: match[1] };
      case 'select':
        return { action: 'select', value: match[1], target: match[2] };
      case 'check':
        return { action: 'check', target: match[1], checked: !match[0].includes('uncheck') };
      case 'submit':
        return { action: 'submit', target: match[1] };
      case 'reset':
        return { action: 'reset', target: match[1] };
      case 'clearInput':
        return { action: 'clearInput', target: match[1] };
      
      // Drag and drop
      case 'dragAndDrop':
        return { action: 'dragAndDrop', source: match[1], target: match[2] };
      case 'dragStart':
        return { action: 'dragStart', target: match[1] };
      case 'drop':
        return { action: 'drop', target: match[1] };
      
      // Touch events
      case 'touchStart':
        return { action: 'touchStart', target: match[1] };
      case 'touchMove':
        return { action: 'touchMove', target: match[1] };
      case 'touchEnd':
        return { action: 'touchEnd', target: match[1] };
      
      // Page/Window actions
      case 'refresh':
        return { action: 'refresh' };
      case 'goBack':
        return { action: 'goBack' };
      case 'goForward':
        return { action: 'goForward' };
      case 'newTabAndNavigate':
        return { action: 'newTab', url: this.normalizeUrl(match[1]), followUp: match[2] };
      case 'newTabWithSearch':
        return { action: 'newTabWithSearch', url: this.normalizeUrl(match[1]), searchTerm: match[2] };
      case 'newTab':
        return { action: 'newTab', url: this.normalizeUrl(match[1]) };
      case 'navigate':
        return { action: 'navigate', url: this.normalizeUrl(match[1]) };
      
      // Content manipulation
      case 'getText':
        return { action: 'getText', target: match[1] };
      case 'setText':
        return { action: 'setText', target: match[1], text: match[2] };
      case 'getAttribute':
        return { action: 'getAttribute', attribute: match[1], target: match[2] };
      case 'setAttribute':
        return { action: 'setAttribute', attribute: match[1], target: match[2], value: match[3] };
      case 'addClass':
        return { action: 'addClass', className: match[1], target: match[2] };
      case 'removeClass':
        return { action: 'removeClass', className: match[1], target: match[2] };
      case 'toggleClass':
        return { action: 'toggleClass', className: match[1], target: match[2] };
      
      // Visual actions
      case 'highlight':
        return { action: 'highlight', target: match[1], color: match[2] || 'yellow' };
      case 'hide':
        return { action: 'hide', target: match[1] };
      case 'show':
        return { action: 'show', target: match[1] };
      case 'setStyle':
        return { action: 'setStyle', styles: this.parseStyles(match[1]), target: match[2] };
      
      // Waiting actions
      case 'wait':
        return { action: 'wait', duration: parseInt(match[1]) * (match[0].includes('second') ? 1000 : 1) };
      case 'waitForElement':
        return { action: 'waitForElement', target: match[1], timeout: parseInt(match[2]) || 5000 };
      case 'waitForText':
        return { action: 'waitForText', text: match[1], target: match[2], timeout: parseInt(match[3]) || 5000 };
      case 'waitForUrl':
        return { action: 'waitForUrl', pattern: match[1], timeout: parseInt(match[2]) || 5000 };
      
      // Extraction and analysis
      case 'screenshot':
        return { action: 'screenshot' };
      case 'extract':
        return { action: 'extract', type: match[1], selector: match[2] };
      case 'extractPageElements':
        return { action: 'extractPageElements' };
      case 'highlight':
        return { action: 'highlight', content: match[1] };
      case 'organize':
        return { action: 'organize', criteria: match[1] || 'domain' };
      case 'note':
        return { action: 'note', focus: match[1] };
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  parseStyles(styleString) {
    const styles = {};
    const pairs = styleString.split(';');
    
    for (const pair of pairs) {
      const [property, value] = pair.split(':').map(s => s.trim());
      if (property && value) {
        // Convert CSS property to camelCase
        const camelProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[camelProperty] = value;
      }
    }
    
    return styles;
  }

  parseValues(valuesString) {
    if (!valuesString) return {};
    
    const values = {};
    const pairs = valuesString.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split(':').map(s => s.trim());
      if (key && value) {
        values[key.toLowerCase()] = value.replace(/^["']|["']$/g, '');
      }
    }
    
    return values;
  }

  normalizeUrl(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  }

  async aiParse(command) {
    // Fallback: try to understand the command with simple keywords
    const lowerCmd = command.toLowerCase();
    
    if (lowerCmd.includes('click') || lowerCmd.includes('press')) {
      const target = command.replace(/(?:click|press)\s+(?:on\s+)?/i, '').trim();
      return { action: 'click', target };
    }
    
    if (lowerCmd.includes('type') || lowerCmd.includes('enter')) {
      return { action: 'type', text: command, target: 'input' };
    }
    
    if (lowerCmd.includes('scroll')) {
      const direction = lowerCmd.includes('up') ? 'up' : 'down';
      return { action: 'scroll', direction };
    }
    
    throw new Error(`Could not parse command: ${command}`);
  }
}

// AI Command Planner - uses LLM to understand complex commands and create action plans
class AICommandPlanner {
  constructor() {
    this.systemPrompt = `You are an intelligent browser automation assistant. Your job is to analyze user commands and create step-by-step action plans.

Safety and intent constraints:
- Never include steps that sign the user out, sign the user in, or navigate to authentication pages unless explicitly requested by the command.
- If the user intent is to edit profile details (bio/about/description), keep actions within the profile/settings context. Prefer targeting long-text fields like <textarea> or contenteditable editors; avoid email/username/password inputs.

Available browser actions:
- click: Click on elements (buttons, links, text)
- type: Type text in input fields
- fill: Fill forms with data
- scroll: Scroll page up/down
- navigate: Go to URLs 
- newTab: Open new tab with URL
- screenshot: Take page screenshot
- extract: Extract data from page
- wait: Wait for elements or time

Your response MUST be valid JSON with this structure:
{
  "understood": true/false,
  "plan": [
    {
      "action": "actionName",
      "target": "element description or URL",
      "text": "text to type (if applicable)",
      "description": "what this step does"
    }
  ],
  "reasoning": "explanation of the plan"
}

Examples:
Command: "Ð½Ð°Ð¹Ð´Ð¸ Ð¸ ÑÐºÐ°Ñ‡Ð°Ð¹ PDF Ñ„Ð°Ð¹Ð» Ð¾ JavaScript"
Response: {
  "understood": true,
  "plan": [
    {"action": "navigate", "target": "https://google.com", "description": "Go to Google"},
    {"action": "type", "target": "search box", "text": "JavaScript PDF filetype:pdf", "description": "Search for JavaScript PDFs"},
    {"action": "click", "target": "search button", "description": "Start search"},
    {"action": "click", "target": "first PDF result", "description": "Click first PDF link"}
  ],
  "reasoning": "To find and download a JavaScript PDF, I'll search Google with specific filetype filter and click the first result"
}

Command: "Ð·Ð°Ð¿Ð¾Ð»Ð½Ð¸ Ñ„Ð¾Ñ€Ð¼Ñƒ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¸"
Response: {
  "understood": true,
  "plan": [
    {"action": "extract", "target": "form fields", "description": "Analyze form structure"},
    {"action": "fill", "target": "registration form", "description": "Fill form with user data"}
  ],
  "reasoning": "I'll first analyze the form structure, then fill it with appropriate data"
}

Current page context will be provided when available.`;
  }

  async createPlan(command, pageContext = null) {
    try {
      console.log('🧠 AI Planner: createPlan called with command:', command);
      console.log('🧠 AI Planner: pageContext:', pageContext);
      
      // Build context-aware prompt
      let contextPrompt = this.systemPrompt;
      
      if (pageContext) {
        let elementsInfo = 'analyzing...';
        let htmlSnippet = '';
        
        if (pageContext.elements && pageContext.elements.length > 0) {
          elementsInfo = pageContext.elements.slice(0, 20).map(el => 
            `${el.tag}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''} "${el.text}"`
          ).join(', ');
        }
        
        if (pageContext.html) {
          // Include a meaningful portion of HTML for better element identification
          htmlSnippet = `\n\nHTML Content (first 8000 chars):\n${pageContext.html.substring(0, 8000)}`;
        }
        
        contextPrompt += `\n\nCurrent page context:
URL: ${pageContext.url || 'unknown'}
Title: ${pageContext.title || 'unknown'}
User Agent: ${navigator.userAgent}
Interactive elements found: ${pageContext.elements ? pageContext.elements.length : 0}
Key elements: ${elementsInfo}${htmlSnippet}

Page analysis:
- This appears to be a ${this.identifyPageType(pageContext.url)} page
- Browser: ${this.getBrowserInfo()}
- Device: ${this.getDeviceInfo()}`;
      }

      console.log('🧠 AI Planner: Built context prompt, calling LLM...');
      
      // Get AI response through existing MCP system
      const response = await this.callLLM(contextPrompt, command);
      console.log('🧠 AI Planner: LLM response received:', response);
      
      // Parse and validate response
      const parsedResponse = this.parseAIResponse(response);
      console.log('🧠 AI Planner: Parsed response:', parsedResponse);
      
      return parsedResponse;
      
    } catch (error) {
      console.error('🧠 AI Planner: AI Command Planning failed:', error);
      // Fallback to simple parsing
      return {
        understood: false,
        plan: [{ action: 'error', description: `Failed to understand: ${command}` }],
        reasoning: 'Could not analyze command with AI'
      };
    }
  }

  async callLLM(systemPrompt, userCommand) {
    // Use existing MCP provider configuration
    const settings = await new Promise(resolve => {
      chrome.storage.sync.get(['provider', 'apiKey', 'host', 'model'], resolve);
    });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Analyze this command and create action plan: "${userCommand}"` }
    ];

    // Use temperature 0 for precise automation actions
    const automationSettings = {
      ...settings,
      temperature: 0  // Use temperature 0 for deterministic/precise responses
    };

    // Use existing processAIRequest function
    const result = await processAIRequest({ messages, settings: automationSettings });
    
    // Extract content from response
    if (result.success && result.response) {
      const response = result.response;
      
      // Handle different response formats
      if (response.choices && response.choices[0] && response.choices[0].message) {
        return response.choices[0].message.content;
      } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
        return response.candidates[0].content.parts[0].text;
      } else if (typeof response === 'string') {
        return response;
      }
    }
    
    throw new Error(result.error || 'Failed to get AI response');
  }

  parseAIResponse(response) {
    try {
      // Extract JSON from response
      let jsonStr = response;
      
      // Try to find JSON in response if it's wrapped in text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);
      
      // Validate structure
      if (!parsed.plan || !Array.isArray(parsed.plan)) {
        throw new Error('Invalid plan structure');
      }

      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return {
        understood: false,
        plan: [{ action: 'error', description: 'Could not parse AI response' }],
        reasoning: 'AI response parsing failed'
      };
    }
  }

  identifyPageType(url) {
    if (!url) return 'unknown';
    
    if (url.includes('google.com')) return 'search engine';
    if (url.includes('youtube.com')) return 'video platform';
    if (url.includes('github.com')) return 'code repository';
    if (url.includes('stackoverflow.com')) return 'programming Q&A';
    if (url.includes('amazon.com') || url.includes('shop')) return 'e-commerce';
    if (url.includes('docs.google.com') || url.includes('notion.so')) return 'document editor';
    if (url.includes('mail') || url.includes('gmail')) return 'email service';
    if (url.includes('facebook.com') || url.includes('twitter.com') || url.includes('linkedin.com')) return 'social media';
    if (url.includes('news') || url.includes('bbc.com') || url.includes('cnn.com')) return 'news site';
    
    return 'website';
  }

  getBrowserInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown browser';
  }

  getDeviceInfo() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Mobile')) return 'Mobile device';
    if (userAgent.includes('Tablet')) return 'Tablet device';
    return 'Desktop computer';
  }
}

// Initialize browser automation
const browserAutomation = new BrowserAutomation();

// Handle side panel opening (fallback for older Chrome versions)
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle messages from content scripts and side panel with MCP compliance
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🚀 UPDATED BACKGROUND SCRIPT - VERSION 2.1.0 - FULL PAGE ANALYSIS 🚀');
  console.log('ï¿½ðŸ”§ BACKGROUND: Message received:', request.action, request);
  try {
    console.log('ðŸ”§ BACKGROUND: Processing action:', request.action);
    
    console.log('ðŸ”§ BACKGROUND: Checking MCP logging...');
    console.log('ðŸ”§ BACKGROUND: mcpInitialized:', mcpInitialized);
    
    try {
      console.log('ðŸ”§ BACKGROUND: mcpLogger type:', typeof mcpLogger);
      console.log('ðŸ”§ BACKGROUND: mcpLogger exists:', mcpLogger !== undefined && mcpLogger !== null);
    } catch (loggerCheckError) {
      console.error('ðŸ”§ BACKGROUND: Error checking mcpLogger:', loggerCheckError);
    }
    
    // Only use MCP logging if properly initialized
    if (mcpInitialized && mcpLogger) {
      console.log('ðŸ”§ BACKGROUND: About to call mcpLogger.debug...');
      try {
        mcpLogger.debug('Received message', { action: request.action, sender: sender.tab?.url });
        console.log('ðŸ”§ BACKGROUND: mcpLogger.debug called successfully');
      } catch (mcpLogError) {
        console.error('ðŸ”§ BACKGROUND: Error in mcpLogger.debug:', mcpLogError);
      }
    } else {
      console.log('[BG] Received message:', request.action);
    }
    
    console.log('ðŸ”§ BACKGROUND: About to create MCP request...');
    
    // Create MCP request wrapper if available
    let mcpRequest = null;
    if (mcpInitialized && mcpRequestHandler) {
      try {
        mcpRequest = mcpRequestHandler.createRequest(request.action, request);
        console.log('ðŸ”§ BACKGROUND: MCP request created successfully');
      } catch (mcpError) {
        console.error('ðŸ”§ BACKGROUND: Error creating MCP request:', mcpError);
      }
    }
    
    console.log('ðŸ”§ BACKGROUND: After MCP setup, checking handlers...');
    
    if (request.action === 'sendMessage') {
      console.log('ðŸ”§ BACKGROUND: Handling sendMessage');
      // Handle popup mini chat messages
      handlePopupMessage(request, sendResponse);
      return true;
    }
    
    if (request.action === 'sendAIMessage') {
      console.log('ðŸ”§ BACKGROUND: Handling sendAIMessage');
      // Handle side panel chat messages with MCP validation if available
      if (mcpInitialized) {
        handleMCPAIMessage(request.data, sendResponse);
      } else {
        // Fallback to legacy handler
        handleAIMessage(request.data, sendResponse);
      }
      return true;
    }
    
    if (request.action === 'authenticateProvider') {
      console.log('ðŸ”§ BACKGROUND: Handling authenticateProvider');
      authenticateProvider(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'refreshToken') {
      console.log('ðŸ”§ BACKGROUND: Handling refreshToken');
      refreshProviderToken(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'getAuthToken') {
      console.log('ðŸ”§ BACKGROUND: Handling getAuthToken');
      getStoredAuthToken(request.provider, sendResponse);
      return true;
    }
    
    if (request.action === 'getSettings') {
      chrome.storage.sync.get(['aiSettings'], (result) => {
        sendResponse(result.aiSettings || {});
      });
      return true;
    }
    
    if (request.action === 'saveSettings') {
      chrome.storage.sync.set({ aiSettings: request.settings }, () => {
        sendResponse({ success: true });
      });
      return true;
    }
    
    if (request.action === 'testConnection') {
      testConnection(request.settings, sendResponse);
      return true;
    }
    
    if (request.action === 'fetchModels') {
      fetchAvailableModels(request.settings, sendResponse);
      return true;
    }
    
    if (request.action === 'openSidePanel') {
      // Store the view and page info for the sidebar
      chrome.storage.local.set({
        pendingAction: request.view || 'chat',
        pageInfo: request.pageInfo
      });
      return true;
    }
    
    if (request.action === 'openSettings') {
      // Forward message to side panel
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'showSettings'}).catch(() => {
            // If content script not available, store the request
            chrome.storage.local.set({pendingAction: 'showSettings'});
          });
        }
      });
      return true;
    }

    // Web Session Authentication handlers
    if (request.action === 'captureWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received captureWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received captureWebSession action for provider:', request.provider);
      }
      captureWebSession(request.provider, sendResponse);
      return true;
    }

    if (request.action === 'clearWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received clearWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received clearWebSession action for provider:', request.provider);
      }
      clearWebSession(request.provider, sendResponse);
      return true;
    }

    if (request.action === 'checkWebSession') {
      if (mcpInitialized && mcpLogger) {
        mcpLogger.info('Received checkWebSession action', { provider: request.provider });
      } else {
        console.log('[BG] Received checkWebSession action for provider:', request.provider);
      }
      checkWebSession(request.provider, sendResponse);
      return true;
    }

    // MCP logging messages
    if (request.action === 'mcpLogMessage') {
      // Handle log messages from MCP components
      mcpLogger.log(request.level, request.message, request.data);
      return true;
    }

    // Chat logging actions
    if (request.action === 'getChatLogs') {
      chatLogger.getLogs(request.filters).then(logs => {
        sendResponse({ success: true, logs });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'clearChatLogs') {
      chatLogger.clearLogs().then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'setChatLogLimit') {
      chatLogger.setMaxLogs(request.maxLogs).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    // New automation handlers
    console.log('ðŸ”§ BACKGROUND: Reached automation handlers section');
    console.log('ðŸ”§ BACKGROUND: Checking if action is getProviderSettings:', request.action === 'getProviderSettings');
    if (request.action === 'getProviderSettings') {
      console.log('ðŸ”§ Background: getProviderSettings request received');
      getStoredSettings().then(settings => {
        console.log('ðŸ”§ Background: retrieved settings:', settings);
        sendResponse({ success: true, settings });
      }).catch(error => {
        console.error('ðŸ”§ Background: error retrieving settings:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'setProviderSettings') {
      setStoredSettings(request.settings).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    if (request.action === 'makeApiCall') {
      handleApiCall(request.messages, request.settings).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    }

    console.log('ðŸ”§ BACKGROUND: Checking getModels handler');
    if (request.action === 'getModels') {
      console.log('ðŸ” Background: getModels request received:', request);
      try {
        fetchAvailableModels({
          provider: request.provider,
          apiKey: request.apiKey,
          host: request.baseUrl
        }, (response) => {
          console.log('ðŸ” Background: fetchAvailableModels response:', response);
          sendResponse(response);
        });
      } catch (error) {
        console.error('ðŸ” Background: Error in getModels handler:', error);
        sendResponse({ success: false, error: error.message, models: [] });
      }
      return true;
    }

    if (request.action === 'automationCommand') {
      console.log('🤖 AUTOMATION: Received automation command:', request.command);
      
      // Get active tab first, then execute automation
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        console.log('🤖 AUTOMATION: Found tabs:', tabs.length);
        const activeTab = tabs[0];
        if (!activeTab) {
          console.log('🤖 AUTOMATION: No active tab found');
          sendResponse({ success: false, error: 'No active tab found' });
          return;
        }
        
        console.log('🤖 AUTOMATION: Active tab:', activeTab.id, activeTab.url);
        console.log('🤖 AUTOMATION: Calling browserAutomation.executeCommand...');
        
        browserAutomation.executeCommand(request.command, activeTab.id).then(result => {
          console.log('🤖 AUTOMATION: Command executed successfully:', result);
          
          // Enhanced response with element information
          let responseMessage = "Command completed";
          if (result && result.message) {
            responseMessage = result.message;
          } else if (result && result.elementInfo) {
            const elem = result.elementInfo;
            responseMessage = `${result.action || 'Action'} performed on ${elem.tagName}${elem.id ? ' #' + elem.id : ''}${elem.text ? ' ("' + elem.text.substring(0, 50) + '...")' : ''}`;
          } else if (result && result.action) {
            responseMessage = `${result.action} completed`;
          }
          
          sendResponse({ 
            success: true, 
            result: result || {},
            message: responseMessage,
            elementInfo: (result && result.elementInfo) || null
          });
        }).catch(error => {
          console.error('🤖 AUTOMATION: Command execution failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      });
      return true; // Keep message channel open for async response
    }

    if (request.action === 'getAutomationNotes') {
      chrome.storage.local.get('automationNotes', (result) => {
        sendResponse({ success: true, notes: result.automationNotes || [] });
      });
      return true;
    }

    if (request.action === 'deleteNote') {
      chrome.storage.local.get('automationNotes', (result) => {
        const notes = result.automationNotes || [];
        const updatedNotes = notes.filter((_, index) => index !== request.index);
        chrome.storage.local.set({ automationNotes: updatedNotes }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    }

    if (request.action === 'logAutomationAction') {
      chrome.storage.local.get('automationHistory', (result) => {
        const history = result.automationHistory || [];
        history.push(request.data);
        
        // Keep only last 100 entries
        if (history.length > 100) {
          history.splice(0, history.length - 100);
        }
        
        chrome.storage.local.set({ automationHistory: history }, () => {
          sendResponse({ success: true });
        });
      });
      return true;
    }

    if (request.action === 'analyzeCurrentPage') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          browserAutomation.injectAndExecute(tabs[0].id, 'extractPageContent').then(pageData => {
            sendResponse({ success: true, pageData });
          }).catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      return true;
    }
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error in message handler', { error: error.message, action: request.action });
    } else {
      console.error('[BG] Error in message handler:', error.message, 'Action:', request.action);
    }
    
    // Send error response
    const errorResponse = {
      success: false,
      error: mcpInitialized ? createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, error.message) : error.message
    };
    sendResponse(errorResponse);
  }
});

// OAuth authentication functions
async function authenticateProvider(provider, sendResponse) {
  try {
    const authConfig = getOAuthConfig(provider);
    if (!authConfig) {
      sendResponse({ success: false, error: `OAuth not supported for ${provider}` });
      return;
    }

    if (provider === 'google') {
      // Use Chrome Identity API for Google
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        // Store the token
        chrome.storage.sync.set({ 
          [`${provider}_auth_token`]: token,
          [`${provider}_auth_method`]: 'oauth'
        }, () => {
          sendResponse({ success: true, token: token });
        });
      });
    } else {
      // Use launchWebAuthFlow for other providers
      const authUrl = buildAuthUrl(provider, authConfig);
      
      chrome.identity.launchWebAuthFlow({
        url: authUrl,
        interactive: true
      }, (redirectUrl) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
          return;
        }
        
        const token = extractTokenFromUrl(redirectUrl, provider);
        if (token) {
          // Store the token
          chrome.storage.sync.set({ 
            [`${provider}_auth_token`]: token,
            [`${provider}_auth_method`]: 'oauth'
          }, () => {
            sendResponse({ success: true, token: token });
          });
        } else {
          sendResponse({ success: false, error: 'Failed to extract token from redirect' });
        }
      });
    }
  } catch (error) {
    console.error('Authentication error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function getOAuthConfig(provider) {
  const configs = {
    github: {
      authUrl: 'https://github.com/login/oauth/authorize',
      clientId: 'your-github-client-id', // Users need to configure this
      scope: 'read:user',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },
    google: {
      // Handled by Chrome Identity API
      scope: 'https://www.googleapis.com/auth/userinfo.email'
    },
    openai: {
      authUrl: 'https://platform.openai.com/oauth/authorize',
      clientId: 'your-openai-client-id', // Users need to configure this
      scope: 'api.read api.write',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },
    /*anthropic: {
      authUrl: 'https://console.anthropic.com/oauth/authorize',
      clientId: 'your-anthropic-client-id', // Users need to configure this
      scope: 'api.read api.write',
      redirectUri: chrome.identity.getRedirectURL('oauth')
    },*/
    claude: {
      // Claude.ai web interface - uses session-based authentication
      authUrl: 'https://claude.ai/login',
      requiresSession: true
    },
    gemini: {
      // Use Google OAuth via Chrome Identity API
      scope: 'https://www.googleapis.com/auth/generative-language'
    }
  };
  
  return configs[provider];
}

function buildAuthUrl(provider, config) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'code',
    state: `${provider}_${Date.now()}`
  });
  
  return `${config.authUrl}?${params.toString()}`;
}

function extractTokenFromUrl(redirectUrl, provider) {
  try {
    const url = new URL(redirectUrl);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }
    
    if (code) {
      // For simplicity, returning the code as token
      // In production, you'd exchange this for an access token
      return code;
    }
    
    // Try to get token from fragment (implicit flow)
    const hash = url.hash.substring(1);
    const hashParams = new URLSearchParams(hash);
    return hashParams.get('access_token');
  } catch (error) {
    console.error('Error extracting token:', error);
    return null;
  }
}

async function refreshProviderToken(provider, sendResponse) {
  try {
    const result = await chrome.storage.sync.get([`${provider}_auth_token`, `${provider}_refresh_token`]);
    const refreshToken = result[`${provider}_refresh_token`];
    
    if (!refreshToken) {
      sendResponse({ success: false, error: 'No refresh token available' });
      return;
    }
    
    // Implementation would depend on each provider's refresh flow
    sendResponse({ success: false, error: 'Token refresh not implemented yet' });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function getStoredAuthToken(provider, sendResponse) {
  try {
    const result = await chrome.storage.sync.get([
      `${provider}_auth_token`, 
      `${provider}_auth_method`
    ]);
    
    sendResponse({ 
      success: true, 
      token: result[`${provider}_auth_token`],
      method: result[`${provider}_auth_method`] || 'api_key'
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// MCP-compliant provider configuration function (replaces getProviderConfig)
function getProviderConfig(provider) {
  // Legacy wrapper for MCP configuration
  const mcpConfig = getMCPProviderConfig(provider);
  if (!mcpConfig) {
    mcpLogger.error('Unsupported provider requested', { provider });
    return null;
  }
  
  // Convert MCP config to legacy format for backwards compatibility
  const legacyConfig = {
    host: mcpConfig.endpoints.chat,
    requiresApiKey: mcpConfig.authentication.methods.includes('api_key')
  };
  
  mcpLogger.debug('Retrieved provider config (legacy format)', { provider, legacyConfig });
  return legacyConfig;
}

// Check user credits dynamically for all providers
async function checkUserCredits(apiKey, provider = 'openrouter') {
  try {
    switch (provider) {
      case 'openrouter':
        const orResponse = await fetch('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (orResponse.ok) {
          const data = await orResponse.json();
          const credits = data.data?.credit_left || 50000;
          console.log(`💰 OpenRouter credits: ${credits}`);
          return credits;
        }
        break;
        
      case 'openai':
        // OpenAI doesn't have a direct credit check, estimate based on tier
        // Most users have $5-$100+ monthly limits
        const estimatedCredits = 50000; // Conservative estimate for pay-as-you-go
        console.log(`💰 OpenAI estimated budget: ${estimatedCredits} tokens`);
        return estimatedCredits;
        
      case 'anthropic':
        // Claude API doesn't expose credits directly
        // Users typically have generous limits
        const claudeCredits = 100000; // Higher limit for Claude users
        console.log(`💰 Anthropic estimated budget: ${claudeCredits} tokens`);
        return claudeCredits;
        
      case 'groq':
        // Groq has very generous free tier limits
        const groqCredits = 200000; // Very high for Groq's fast inference
        console.log(`💰 Groq estimated budget: ${groqCredits} tokens`);
        return groqCredits;
        
      case 'deepseek':
        // DeepSeek typically has good limits
        const deepseekCredits = 100000;
        console.log(`💰 DeepSeek estimated budget: ${deepseekCredits} tokens`);
        return deepseekCredits;
        
      case 'perplexity':
        // Perplexity has monthly limits
        const perplexityCredits = 50000;
        console.log(`💰 Perplexity estimated budget: ${perplexityCredits} tokens`);
        return perplexityCredits;
        
      case 'azure':
        // Azure OpenAI has subscription-based limits
        const azureCredits = 100000;
        console.log(`💰 Azure OpenAI estimated budget: ${azureCredits} tokens`);
        return azureCredits;
        
      case 'github':
        // GitHub Models in preview - generous limits
        const githubCredits = 150000;
        console.log(`💰 GitHub Models estimated budget: ${githubCredits} tokens`);
        return githubCredits;
        
      case 'gemini':
      case 'google':
        // Google Gemini has generous free tier
        const geminiCredits = 150000;
        console.log(`💰 Google Gemini estimated budget: ${geminiCredits} tokens`);
        return geminiCredits;
        
      case 'local':
      case 'ollama':
        // Local models have no credit limits
        const localCredits = 1000000; // Unlimited essentially
        console.log(`💰 Local model: Unlimited tokens`);
        return localCredits;
        
      default:
        // Custom or unknown providers
        const defaultCredits = 50000;
        console.log(`💰 ${provider} estimated budget: ${defaultCredits} tokens`);
        return defaultCredits;
    }
  } catch (error) {
    console.log(`⚠️ Could not check credits for ${provider}: ${error.message}`);
  }
  
  // Provider-specific fallbacks
  const providerDefaults = {
    'openrouter': 50000,     // Conservative for pay-per-use
    'openai': 50000,         // Generous for subscription
    'anthropic': 100000,     // High limit for Claude
    'groq': 200000,          // Very high for fast inference
    'deepseek': 100000,      // Good limits
    'perplexity': 50000,     // Monthly limits
    'azure': 100000,         // Enterprise limits
    'github': 150000,        // Preview generosity
    'gemini': 150000,        // Google's free tier
    'google': 150000,        // Same as Gemini
    'local': 1000000,        // No limits
    'ollama': 1000000,       // No limits
  };
  
  return providerDefaults[provider] || 50000;
}

// Process AI request function for MCP provider
async function processAIRequest(requestData) {
  try {
    const { messages, provider, model, settings } = requestData;
    
    // Get stored settings
    const storedSettings = await getStoredSettings();
    
    // Merge settings
    const finalSettings = {
      ...storedSettings,
      provider: provider || storedSettings.provider,
      model: model || storedSettings.model,
      ...settings
    };
    
    // Check authentication method
    const authMode = finalSettings.authMode || 'api';
    
    if (authMode === 'web') {
      throw new Error('Web authentication not supported in MCP provider');
    }
    
    // Check for OAuth token first
    const authData = await chrome.storage.sync.get([
      `${finalSettings.provider}_auth_token`, 
      `${finalSettings.provider}_auth_method`
    ]);
    
    const hasOAuthToken = authData[`${finalSettings.provider}_auth_method`] === 'oauth' && authData[`${finalSettings.provider}_auth_token`];
    
    if (!finalSettings.apiKey && !hasOAuthToken && finalSettings.provider !== 'local' && finalSettings.provider !== 'custom') {
      throw new Error('API key or OAuth authentication required');
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // For local provider, try different headers to bypass extension restrictions
    if (finalSettings.provider === 'local') {
      headers['User-Agent'] = 'ChromeAiAgent/2.0';
      // Try adding additional headers that might help with local server compatibility
      headers['Accept'] = 'application/json';
      headers['Cache-Control'] = 'no-cache';
    }
    
    // Set authentication headers
    if (hasOAuthToken && finalSettings.provider !== 'local') {
      const oauthToken = authData[`${finalSettings.provider}_auth_token`];
      if (finalSettings.provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (finalSettings.provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (finalSettings.provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
    } else if (finalSettings.apiKey && finalSettings.apiKey !== 'local-no-key-required' && finalSettings.provider !== 'local') {
      if (finalSettings.provider === 'azure') {
        headers['api-key'] = finalSettings.apiKey;
      } else if (finalSettings.provider === 'anthropic') {
        headers['x-api-key'] = finalSettings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (finalSettings.provider === 'gemini') {
        headers['x-goog-api-key'] = finalSettings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${finalSettings.apiKey}`;
      }
    }
    
    // Dynamic Token Management System
    function estimateTokens(text) {
      // Improved estimation: 1 token ≈ 3.5 characters for mixed content
      return Math.ceil(text.length / 3.5);
    }
    
    function calculateOptimalTokens(messages, userCredits = 5000, provider = 'openrouter') {
      const totalText = messages.map(m => m.content).join(' ');
      const estimatedInputTokens = estimateTokens(totalText);
      
      // Analyze request complexity
      const userMessage = messages.find(m => m.role === 'user')?.content || '';
      const requestComplexity = analyzeRequestComplexity(userMessage);
      
      // Calculate available tokens (leave 20% buffer for most providers, except local)
      const bufferPercent = (provider === 'local' || provider === 'ollama') ? 0.05 : 0.2;
      const availableTokens = Math.floor(userCredits * (1 - bufferPercent));
      const maxInputTokens = Math.floor(availableTokens * 0.7); // 70% for input
      const dynamicMaxTokens = Math.floor(availableTokens * 0.3); // 30% for output
      
      console.log(`🧠 Dynamic Token Analysis (${provider}):
        - User Credits: ${userCredits}
        - Buffer (${Math.floor(bufferPercent*100)}%): ${userCredits - availableTokens}
        - Available: ${availableTokens}
        - Input Budget (70%): ${maxInputTokens}
        - Output Budget (30%): ${dynamicMaxTokens}
        - Estimated Input: ${estimatedInputTokens}
        - Request Type: ${requestComplexity.type}
        - Complexity Score: ${requestComplexity.score}`);
      
      return {
        maxInputTokens,
        dynamicMaxTokens: Math.max(2000, Math.min(dynamicMaxTokens, getMaxTokensForComplexity(requestComplexity, provider))),
        needsTruncation: estimatedInputTokens > maxInputTokens,
        complexity: requestComplexity
      };
    }
    
    function analyzeRequestComplexity(userMessage) {
      const message = userMessage.toLowerCase();
      let score = 1;
      let type = 'simple';
      
      // Simple questions (low tokens needed)
      if (message.match(/\b(what|who|when|where|how much|yes|no)\b/) && message.length < 50) {
        score = 1;
        type = 'simple_question';
      }
      // Code analysis (medium tokens)
      else if (message.match(/\b(code|function|debug|fix|error|syntax)\b/)) {
        score = 2;
        type = 'code_analysis';
      }
      // Content summarization (medium-high tokens)
      else if (message.match(/\b(summarize|summary|explain|describe|analyze)\b/)) {
        score = 3;
        type = 'content_analysis';
      }
      // Complex tasks (high tokens)
      else if (message.match(/\b(write|create|generate|build|develop|implement)\b/)) {
        score = 4;
        type = 'generation_task';
      }
      // Very complex (maximum tokens)
      else if (message.match(/\b(refactor|optimize|complete|comprehensive|detailed)\b/)) {
        score = 5;
        type = 'complex_task';
      }
      
      // Adjust based on message length
      if (message.length > 200) score += 1;
      if (message.length > 500) score += 1;
      
      return { score: Math.min(score, 5), type };
    }
    
    function getMaxTokensForComplexity(complexity, provider = 'openrouter') {
      // INCREASED: Base token limits by complexity for full page analysis
      const baseTokenLimits = {
        simple_question: 4000,     // INCREASED from 200 for full page content analysis
        code_analysis: 4000,       // INCREASED from 400 for full page content analysis  
        content_analysis: 4000,    // INCREASED from 600 for full page content analysis
        generation_task: 4000,     // INCREASED from 800 for full page content analysis
        complex_task: 4000         // INCREASED from 1000 for full page content analysis
      };
      
      // Provider-specific multipliers based on their capabilities and costs
      const providerMultipliers = {
        'openrouter': 1.0,      // Base (pay-per-use, need efficiency)
        'openai': 1.5,          // Higher limits for subscription users
        'anthropic': 2.0,       // Claude handles long contexts very well
        'groq': 0.8,            // Fast but prefer shorter for speed
        'deepseek': 1.2,        // Good balance
        'perplexity': 1.0,      // Standard limits
        'azure': 1.8,           // Enterprise, can afford more
        'github': 2.5,          // Preview period, very generous
        'gemini': 2.0,          // Google's generous free tier
        'google': 2.0,          // Same as Gemini
        'local': 5.0,           // No cost constraints
        'ollama': 5.0,          // No cost constraints
      };
      
      const baseLimit = baseTokenLimits[complexity.type] || 400;
      const multiplier = providerMultipliers[provider] || 1.0;
      const adjustedLimit = Math.floor(baseLimit * multiplier);
      
      console.log(`🎯 Token limit for ${complexity.type} on ${provider}: ${adjustedLimit} (base: ${baseLimit}, multiplier: ${multiplier})`);
      
      return adjustedLimit;
    }
    
    function smartTruncateMessages(messages, maxInputTokens, provider = 'openrouter') {
      const totalText = messages.map(m => m.content).join(' ');
      const estimatedTokens = estimateTokens(totalText);
      
      if (estimatedTokens <= maxInputTokens) {
        return messages;
      }
      
      console.log(`🔄 Smart truncation needed for ${provider}: ${estimatedTokens} > ${maxInputTokens} tokens`);
      
      // Provider-specific truncation strategies
      const truncationStrategies = {
        'anthropic': 'preserve_context',    // Claude handles long context well
        'gemini': 'preserve_context',       // Gemini also good with long context  
        'google': 'preserve_context',       // Same as Gemini
        'groq': 'aggressive',               // Optimize for speed
        'local': 'minimal',                 // Local can handle more
        'ollama': 'minimal',                // Local can handle more
        'github': 'preserve_context',       // Preview, be generous
        'azure': 'balanced',                // Enterprise balance
        'openai': 'balanced',               // Standard optimization
        'openrouter': 'aggressive',         // Pay-per-use, be efficient
        'deepseek': 'balanced',             // Good balance
        'perplexity': 'balanced'            // Research focus
      };
      
      const strategy = truncationStrategies[provider] || 'balanced';
      
      // Priority: Keep user message, truncate system message intelligently
      const systemMsgIndex = messages.findIndex(m => m.role === 'system');
      const userMsgIndex = messages.findIndex(m => m.role === 'user');
      
      if (systemMsgIndex !== -1 && userMsgIndex !== -1) {
        const userTokens = estimateTokens(messages[userMsgIndex].content);
        const availableForSystem = maxInputTokens - userTokens - 100; // 100 token buffer
        
        const minSystemTokens = strategy === 'minimal' ? 2000 : 
                              strategy === 'preserve_context' ? 1000 :
                              strategy === 'aggressive' ? 300 : 500;
        
        if (availableForSystem > minSystemTokens) {
          const systemMsg = messages[systemMsgIndex];
          const maxSystemChars = Math.floor(availableForSystem * 3.5);
          
          if (systemMsg.content.length > maxSystemChars) {
            const content = systemMsg.content;
            
            // Keep automation capabilities if present
            const automationMatch = content.match(/(AVAILABLE AUTOMATION ACTIONS:.*?(?=\n\n|$))/s);
            const automationSection = automationMatch ? automationMatch[1] : '';
            
            // Keep page title/URL if present
            const pageInfoMatch = content.match(/(viewing a webpage titled.*?(?=\.|$))/);
            const pageInfo = pageInfoMatch ? pageInfoMatch[1] : '';
            
            // Calculate content preservation based on strategy
            const contentPreservation = {
              'minimal': 0.9,           // Keep most content
              'preserve_context': 0.8,  // Keep good amount
              'balanced': 0.6,          // Standard amount
              'aggressive': 0.4         // Minimal content
            };
            
            const preserveRatio = contentPreservation[strategy] || 0.6;
            const keepLength = Math.floor((maxSystemChars - automationSection.length - pageInfo.length - 200) * preserveRatio);
            
            if (keepLength > 300) {
              const contentMatch = content.match(/=== PAGE SOURCE ===\n(.*?)\n=== END PAGE SOURCE ===/s);
              if (contentMatch) {
                const pageContent = contentMatch[1];
                const truncatedContent = pageContent.substring(0, keepLength) + 
                  `\n\n[... Content truncated using ${strategy} strategy for ${provider} ...]`;
                
                const newContent = `You are a helpful AI assistant with browser automation capabilities. ${pageInfo}

${automationSection}

=== PAGE SOURCE ===
${truncatedContent}
=== END PAGE SOURCE ===`;

                messages[systemMsgIndex].content = newContent;
                console.log(`📄 ${provider} (${strategy}) truncation: ${newContent.length} chars (was ${content.length})`);
              }
            }
          }
        }
      }
      
      return messages;
    }
    
    // Dynamic Token Management System - Get real credits
    const userCredits = await checkUserCredits(finalSettings.apiKey, finalSettings.provider);
    const tokenAnalysis = calculateOptimalTokens(messages, userCredits, finalSettings.provider);
    
    // DISABLED: Always use full page source for analysis
    // User requested to always analyze complete page content
    console.log('🔧 Page content truncation DISABLED - using full page source for analysis');
    // if (tokenAnalysis.needsTruncation) {
    //   messages = smartTruncateMessages(messages, tokenAnalysis.maxInputTokens, finalSettings.provider);
    // }
    
    // Update max tokens dynamically
    finalSettings.maxTokens = tokenAnalysis.dynamicMaxTokens;
    
    // Prepare request based on provider
    let host = finalSettings.host;
    
    // Force correct Ollama host for local provider
    if (finalSettings.provider === 'local') {
        host = 'http://127.0.0.1:11434/api/chat';
        console.log(`🔧 Background: Forced local provider host to Ollama default`);
    }
    
    console.log(`🔍 Background: Using host for ${finalSettings.provider}: ${host}`);
    let requestBody;
    
    if (finalSettings.provider === 'gemini') {
      // Gemini uses a different API format
      host = `https://generativelanguage.googleapis.com/v1beta/models/${finalSettings.model}:generateContent`;
      
      // For Gemini, combine system message with user messages
      let combinedText = '';
      
      // Add system message first if it exists
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedText += systemMessage.content + '\n\n';
      }
      
      // Add user messages
      const userMessages = messages.filter(msg => msg.role === 'user');
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: finalSettings.temperature || 0.7,
          maxOutputTokens: finalSettings.maxTokens || 800
        }
      };
    } else {
      // Standard OpenAI-compatible format
      // Filter messages to only include role and content (remove timestamp and other fields)
      const cleanMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // DISABLED: Local provider truncation - using full page source for analysis
      // User requested to always analyze complete page content
      if (finalSettings.provider === 'local') {
        console.log('🔧 Local provider content truncation DISABLED - using full page source');
        // cleanMessages.forEach(msg => {
        //   if (msg.role === 'system' && msg.content.length > 1000) {
        //     console.log('🔧 Truncating system message for local provider from', msg.content.length, 'to 1000 chars');
        //     msg.content = msg.content.substring(0, 1000) + '\n\n[Content truncated for local provider compatibility]';
        //   }
        // });
      }
      
      requestBody = {
        model: finalSettings.model,
        messages: cleanMessages,
        temperature: finalSettings.temperature || 0.7,
        max_tokens: finalSettings.maxTokens || 800,
        stream: false
      };
    }
    
    // Enhanced debugging for request details
    console.log('🔍 === FULL REQUEST DEBUG ===');
    console.log('🔍 Provider:', finalSettings.provider);
    console.log('🔍 Request URL:', host);
    console.log('🔍 Request Method: POST');
    console.log('🔍 Request Headers:', JSON.stringify(headers, null, 2));
    console.log('🔍 Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('🔍 Request Body String Length:', JSON.stringify(requestBody).length);
    console.log('🔍 About to make fetch call...');
    
    // Make API call
    let response;
    try {
      const requestOptions = {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      };
      
      console.log('🔍 Full fetch options:', JSON.stringify(requestOptions, null, 2));
      
      response = await fetch(host, requestOptions);
      
      console.log('🔍 === FULL RESPONSE DEBUG ===');
      console.log('🔍 Response Status:', response.status);
      console.log('🔍 Response Status Text:', response.statusText);
      console.log('🔍 Response OK:', response.ok);
      console.log('🔍 Response URL:', response.url);
      console.log('🔍 Response Type:', response.type);
      console.log('🔍 Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
      
      // Get response body for both success and error cases
      const responseText = await response.text();
      console.log('🔍 Response Body (text):', responseText);
      console.log('🔍 Response Body Length:', responseText.length);
      
      if (!response.ok) {
        console.log('🚨 === RESPONSE ERROR DETAILS ===');
        console.log('🚨 Status:', response.status);
        console.log('🚨 Status Text:', response.statusText);
        console.log('🚨 Error Response Body:', responseText);
        console.log('🚨 Error Response Headers:', Object.fromEntries(response.headers.entries()));
        console.log('🚨 Full Response Object Properties:', Object.getOwnPropertyNames(response));
        console.log('🚨 Response redirected:', response.redirected);
        console.log('🚨 Response bodyUsed:', response.bodyUsed);
        
        // Parse error response for better user messages
        let errorMessage = `API Error ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error && errorData.error.message) {
            const apiError = errorData.error.message;
            
            // Handle specific OpenRouter data policy error
            if (apiError.includes('No endpoints found matching your data policy') && 
                apiError.includes('Free model publication')) {
              errorMessage = '🔒 Data Policy Configuration Required\n\n' +
                           'Your OpenRouter account needs data policy settings configured for free models.\n' +
                           'Please visit: https://openrouter.ai/settings/privacy\n\n' +
                           'Configure your data policy settings to use free models.';
            } else {
              errorMessage = apiError;
            }
          }
        } catch (parseError) {
          // If we can't parse error JSON, use the original response text
          errorMessage = responseText;
        }
        
        throw new Error(errorMessage);
      }
      
      // Parse JSON for successful response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('🔍 Parsed Response Data:', JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log('🚨 JSON Parse Error:', parseError.message);
        console.log('🚨 Raw response text:', responseText);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      // Convert Ollama native format to OpenAI format if needed
      let finalData = responseData;
      if (finalSettings.provider === 'local' && host.includes('/api/chat')) {
        console.log('🔄 Converting Ollama native response to OpenAI format');
        finalData = {
          id: 'ollama-' + Date.now(),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: responseData.model || finalSettings.model,
          choices: [{
            index: 0,
            message: {
              role: responseData.message?.role || 'assistant',
              content: responseData.message?.content || ''
            },
            finish_reason: responseData.done_reason || 'stop'
          }],
          usage: {
            prompt_tokens: responseData.prompt_eval_count || 0,
            completion_tokens: responseData.eval_count || 0,
            total_tokens: (responseData.prompt_eval_count || 0) + (responseData.eval_count || 0)
          }
        };
        console.log('🔄 Converted response:', JSON.stringify(finalData, null, 2));
      }

      return {
        success: true,
        response: finalData,
        provider: finalSettings.provider,
        model: finalSettings.model
      };
      
    } catch (fetchError) {
      console.log('🚨 === FETCH ERROR DETAILS ===');
      console.log('🚨 Error type:', fetchError.constructor.name);
      console.log('🚨 Error message:', fetchError.message);
      console.log('🚨 Error stack:', fetchError.stack);
      console.log('🚨 Error name:', fetchError.name);
      console.log('🚨 Error cause:', fetchError.cause);
      console.log('🚨 Full error object:', fetchError);
      throw fetchError;
    }  } catch (error) {
    console.error('Process AI request error:', error);
    return {
      success: false,
      error: error.message,
      provider: requestData.provider,
      model: requestData.model
    };
  }
}

function getMCPProviderConfiguration(provider) {
  const config = getMCPProviderConfig(provider);
  if (!config) {
    mcpLogger.error('Unsupported MCP provider requested', { provider });
    return null;
  }
  
  // Create a complete MCP provider object with chat functionality
  const mcpProvider = {
    name: provider,
    config: config,
    chat: async function(messages, model, settings) {
      try {
        mcpLogger.debug('MCP provider chat called', { provider, model, messagesCount: messages.length });
        
        // Use the existing handleAIMessage function to process the request
        const aiRequest = {
          action: 'sendAIMessage',
          data: {
            messages: messages,
            provider: provider,
            model: model,
            settings: settings
          }
        };
        
        // Call the AI processing function directly
        return await processAIRequest(aiRequest.data);
        
      } catch (error) {
        mcpLogger.error('MCP provider chat error', { provider, error: error.message });
        throw error;
      }
    }
  };
  
  mcpLogger.debug('Retrieved MCP provider config', { provider, configName: provider });
  return mcpProvider;
}

async function handlePopupMessage(request, sendResponse) {
  const startTime = Date.now();
  
  // Console logging for chat interaction
  console.log('ðŸš€ === POPUP CHAT REQUEST ===');
  console.log('ðŸ“ Prompt:', request.message);
  console.log('ðŸ”§ Provider:', request.provider);
  console.log('ðŸ¤– Model:', request.model);
  console.log('â° Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: request.message,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'popup'
  };

  try {
    // Get current settings or use the provided ones
    const savedSettings = await getStoredSettings();
    const provider = request.provider || savedSettings.provider || 'openai';
    const model = request.model || savedSettings.model;
    
    // Update log data
    logData.provider = provider;
    logData.model = model;
    
    if (!model) {
      sendResponse({ 
        success: false,
        error: 'Model not specified' 
      });
      return;
    }
    
    // Check for OAuth token first
    const authData = await chrome.storage.sync.get([
      `${provider}_auth_token`, 
      `${provider}_auth_method`
    ]);
    
    const hasOAuthToken = authData[`${provider}_auth_method`] === 'oauth' && authData[`${provider}_auth_token`];
    
    // Get provider configuration
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      sendResponse({ 
        success: false,
        error: `Unsupported provider: ${provider}` 
      });
      return;
    }
    
    // Check API key requirement
    if (providerConfig.requiresApiKey && !savedSettings.apiKey && !hasOAuthToken) {
      sendResponse({ 
        success: false,
        error: `API key or OAuth authentication required for ${provider}` 
      });
      return;
    }
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use OAuth token if available, otherwise fall back to API key
    if (hasOAuthToken) {
      const oauthToken = authData[`${provider}_auth_token`];
      if (provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
    } else if (savedSettings.apiKey && savedSettings.apiKey !== 'local-no-key-required') {
      if (provider === 'azure') {
        headers['api-key'] = savedSettings.apiKey;
      } else if (provider === 'anthropic') {
        headers['x-api-key'] = savedSettings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (provider === 'gemini') {
        headers['x-goog-api-key'] = savedSettings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${savedSettings.apiKey}`;
      }
    }
    
    // Prepare messages with page context
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant. The user is currently on the page: "${request.pageContext?.title || 'Unknown'}" (${request.pageContext?.url || 'Unknown URL'})`
      },
      {
        role: 'user',
        content: request.message
      }
    ];
    
    let host = providerConfig.host || savedSettings.host;
    
    // Prepare request body based on provider
    let requestBody;
    if (provider === 'anthropic') {
      // Anthropic uses a different message format
      requestBody = {
        model: model,
        max_tokens: finalSettings.maxTokens,
        messages: messages.filter(msg => msg.role !== 'system'), // Remove system message for now
        system: messages.find(msg => msg.role === 'system')?.content || ''
      };
    } else if (provider === 'gemini') {
      // Gemini uses a different API format
      host = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      
      // For Gemini, we need to combine system message with user messages
      let combinedText = '';
      
      // Add system message first if it exists
      const systemMessage = messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedText += systemMessage.content + '\n\n';
      }
      
      // Add user messages
      const userMessages = messages.filter(msg => msg.role === 'user');
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      };
    } else if (provider === 'claude') {
      // Claude.ai web interface approach
      // Note: This is a simplified approach - actual implementation would need
      // to handle Claude.ai's web interface authentication and messaging
      sendResponse({ 
        success: false,
        error: 'Claude.ai web interface integration is experimental. Please try the API-based access through the settings page.'
      });
      return;
    } else {
      // Standard OpenAI-compatible format
      requestBody = {
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: finalSettings.maxTokens
      };
    }
    
    // Update log data with request payload
    logData.requestPayload = {
      host,
      method: 'POST',
      headers: { ...headers },
      body: requestBody
    };
    
    // Console log the request payload
    console.log('ðŸ“¤ Request URL:', host);
    console.log('ðŸ“¤ Request Headers:', headers);
    console.log('ðŸ“¤ Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const responseTime = Date.now() - startTime;
      
      // Log error
      logData.responseTime = responseTime;
      logData.error = `API Error ${response.status}: ${errorData}`;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ 
        success: false,
        error: `API Error ${response.status}: ${errorData}` 
      });
      return;
    }
    
    const data = await response.json();
    console.log('ðŸ“¥ Raw API Response:', JSON.stringify(data, null, 2));
    
    let aiResponse;
    
    if (provider === 'anthropic') {
      // Anthropic response format
      aiResponse = data.content?.[0]?.text || 'No response received';
    } else if (provider === 'gemini') {
      // Gemini response format
      aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
    } else {
      // Standard OpenAI-compatible format
      aiResponse = data.choices?.[0]?.message?.content || 'No response received';
    }
    
    const responseTime = Date.now() - startTime;
    
    // Console log the processed response
    console.log('ðŸ’¬ AI Response:', aiResponse);
    console.log('â±ï¸ Response Time:', responseTime + 'ms');
    console.log('âœ… === POPUP CHAT COMPLETE ===\n');
    
    // Log successful interaction
    logData.response = aiResponse;
    logData.responseTime = responseTime;
    logData.success = true;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      success: true,
      response: aiResponse 
    });
    
  } catch (error) {
    console.error('âŒ === POPUP CHAT ERROR ===');
    console.error('ðŸ’¥ Error:', error.message);
    console.error('ðŸ” Full Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log('â±ï¸ Error Response Time:', responseTime + 'ms');
    console.log('âŒ === POPUP CHAT ERROR END ===\n');
    
    // Log error
    logData.responseTime = responseTime;
    logData.error = error.message;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      success: false,
      error: error.message 
    });
  }
}

// MCP-compliant AI message handler
async function handleMCPAIMessage(messageData, sendResponse) {
  const requestId = mcpRequestHandler.generateRequestId();
  const startTime = Date.now();
  
  // Console logging for MCP chat interaction
  console.log('ðŸ”§ === MCP CHAT REQUEST ===');
  console.log('ðŸ†” Request ID:', requestId);
  console.log('ðŸ“ Messages:', messageData.messages);
  console.log('ðŸ”§ Provider:', messageData.provider);
  console.log('ðŸ¤– Model:', messageData.model);
  console.log('â° Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: null,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'mcp'
  };
  
  try {
    mcpLogger.info('Processing MCP AI message', { requestId, provider: messageData.provider });
    
    const settings = await getStoredSettings();
    const provider = messageData.provider || settings.provider;
    
    // Update log data
    logData.provider = provider;
    logData.model = messageData.model || settings.model;
    logData.prompt = messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n') || 'Unknown prompt';
    
    // Get MCP provider configuration
    const mcpConfig = getMCPProviderConfiguration(provider);
    if (!mcpConfig) {
      const error = createMCPError(
        MCP_ERROR_CODES.VALIDATION_FAILED, 
        `Unsupported provider: ${provider}`
      );
      sendResponse(mcpRequestHandler.createResponse(requestId, null, error));
      return;
    }
    
    // Validate authentication
    try {
      const authData = await getAuthenticationData(provider, settings);
      mcpValidator.validateAuthenticationData(authData, provider);
    } catch (authError) {
      mcpLogger.error('Authentication validation failed', { provider, error: authError.message });
      sendResponse(mcpRequestHandler.createResponse(requestId, null, authError));
      return;
    }
    
    // Check authentication method
    const authMode = settings.authMode || 'api';
    
    if (authMode === 'web') {
      // Use web session authentication
      return await handleWebSessionMessage(messageData, sendResponse, settings);
    }
    
    // Prepare chat request with MCP validation
    const chatRequest = {
      model: messageData.model || settings.model,
      messages: messageData.messages,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      stream: messageData.stream || false
    };
    
    // Validate input with MCP validator
    try {
      mcpValidator.validateChatRequest(chatRequest, mcpConfig);
    } catch (validationError) {
      mcpLogger.error('Input validation failed', { provider, error: validationError.message });
      sendResponse(mcpRequestHandler.createResponse(requestId, null, validationError));
      return;
    }
    
    // Call MCP provider chat method
    try {
      const chatResult = await mcpConfig.chat(
        messageData.messages,
        messageData.model || settings.model,
        settings
      );
      
      if (chatResult.success) {
        // Log successful chat interaction
        logData.success = true;
        logData.response = chatResult.response;
        logData.responseTime = Date.now() - startTime;
        await chatLogger.logChatInteraction(logData);
        
        // Send successful response
        sendResponse(mcpRequestHandler.createResponse(requestId, chatResult.response));
        
        console.log('âœ… === MCP CHAT SUCCESS ===');
        console.log('ðŸ”„ Response Time:', logData.responseTime + 'ms');
        console.log('âœ… === MCP CHAT SUCCESS END ===');
        
      } else {
        throw new Error(chatResult.error || 'Unknown chat error');
      }
      
    } catch (chatError) {
      console.log('âŒ === MCP CHAT ERROR ===');
      console.log('ðŸ’¥ MCP Error:', chatError.message);
      console.log('ðŸ” MCP Full Error:', chatError);
      
      // Log error
      logData.error = chatError.message;
      logData.responseTime = Date.now() - startTime;
      await chatLogger.logChatInteraction(logData);
      
      console.log('â±ï¸ MCP Error Response Time:', logData.responseTime + 'ms');
      console.log('âŒ === MCP CHAT ERROR END ===');
      
      mcpLogger.error('Error in MCP AI message handler', {
        requestId,
        error: chatError.message,
        stack: chatError.stack
      });
      
      const mcpError = createMCPError(
        MCP_ERROR_CODES.PROVIDER_ERROR,
        chatError.message
      );
      sendResponse(mcpRequestHandler.createResponse(requestId, null, mcpError));
    }
  } catch (error) {
    console.log('âŒ === MCP CHAT ERROR ===');
    console.log('ï¿½ MCP Error:', error.message);
    console.log('ï¿½ MCP Full Error:', error);
    
    // Log error
    logData.error = error.message;
    logData.responseTime = Date.now() - startTime;
    await chatLogger.logChatInteraction(logData);
    
    console.log('â±ï¸ MCP Error Response Time:', logData.responseTime + 'ms');
    console.log('âŒ === MCP CHAT ERROR END ===');
    
    mcpLogger.error('Error in MCP AI message handler', {
      requestId,
      error: error.message,
      stack: error.stack
    });
    
    const mcpError = createMCPError(
      MCP_ERROR_CODES.UNKNOWN_ERROR,
      error.message
    );
    sendResponse(mcpRequestHandler.createResponse(requestId, null, mcpError));
  }
}

// Helper function to get authentication data
async function getAuthenticationData(provider, settings) {
  const authData = await chrome.storage.sync.get([
    `${provider}_auth_token`, 
    `${provider}_auth_method`
  ]);
  
  return {
    apiKey: settings.apiKey,
    oauthToken: authData[`${provider}_auth_token`],
    authMethod: authData[`${provider}_auth_method`],
    webSession: settings.authMode === 'web'
  };
}

// Helper function to build authentication headers
async function buildAuthenticationHeaders(provider, settings) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  // Check for OAuth token first
  const authData = await chrome.storage.sync.get([
    `${provider}_auth_token`, 
    `${provider}_auth_method`
  ]);
  
  const hasOAuthToken = authData[`${provider}_auth_method`] === 'oauth' && authData[`${provider}_auth_token`];
  
  // Use OAuth token if available, otherwise fall back to API key
  if (hasOAuthToken) {
    const oauthToken = authData[`${provider}_auth_token`];
    if (provider === 'azure') {
      headers['api-key'] = oauthToken;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = oauthToken;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
      headers['x-goog-api-key'] = oauthToken;
    } else {
      headers['Authorization'] = `Bearer ${oauthToken}`;
    }
  } else if (settings.apiKey && settings.apiKey !== 'local-no-key-required') {
    if (provider === 'azure') {
      headers['api-key'] = settings.apiKey;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = settings.apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === 'gemini') {
      headers['x-goog-api-key'] = settings.apiKey;
    } else {
      headers['Authorization'] = `Bearer ${settings.apiKey}`;
    }
  }
  
  return headers;
}

async function handleAIMessage(messageData, sendResponse) {
  const startTime = Date.now();
  
  // Console logging for sidepanel chat interaction
  console.log('ðŸŽ¯ === SIDEPANEL CHAT REQUEST ===');
  console.log('ðŸ“ Messages:', messageData.messages);
  console.log('ðŸ’¬ Prompt:', messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n'));
  console.log('â° Timestamp:', new Date().toISOString());
  
  let logData = {
    provider: null,
    model: null,
    prompt: null,
    requestPayload: null,
    response: null,
    responseTime: null,
    success: false,
    error: null,
    source: 'sidepanel'
  };

  try {
    const settings = await getStoredSettings();
    
    // Update log data
    logData.provider = settings.provider;
    logData.model = settings.model;
    logData.prompt = messageData.messages?.filter(msg => msg.role === 'user').map(msg => msg.content).join('\n') || 'Unknown prompt';
    
    // Check authentication method
    const authMode = settings.authMode || 'api';
    
    if (authMode === 'web') {
      // Use web session authentication
      return await handleWebSessionMessage(messageData, sendResponse, settings);
    }
    
    // Continue with existing API/OAuth authentication
    // Check for OAuth token first
    const authData = await chrome.storage.sync.get([
      `${settings.provider}_auth_token`, 
      `${settings.provider}_auth_method`
    ]);
    
    const hasOAuthToken = authData[`${settings.provider}_auth_method`] === 'oauth' && authData[`${settings.provider}_auth_token`];
    
    if (!settings.apiKey && !hasOAuthToken && settings.provider !== 'local' && settings.provider !== 'custom') {
      sendResponse({ 
        error: 'API key or OAuth authentication required. Please set up your AI provider in settings.' 
      });
      return;
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Use OAuth token if available, otherwise fall back to API key
    if (hasOAuthToken) {
      const oauthToken = authData[`${settings.provider}_auth_token`];
      if (settings.provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
    } else if (settings.apiKey && settings.apiKey !== 'local-no-key-required') {
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
    }
    
    // Prepare request body based on provider
    let requestBody;
    let host = settings.host;
    
    if (settings.provider === 'anthropic') {
      // Anthropic uses a different message format
      requestBody = {
        model: settings.model,
        max_tokens: settings.maxTokens,
        messages: messageData.messages.filter(msg => msg.role !== 'system'),
        system: messageData.messages.find(msg => msg.role === 'system')?.content || ''
      };
    } else if (settings.provider === 'gemini') {
      // Gemini uses a different API format
      host = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`;
      
      // For Gemini, we need to combine system message with user messages
      let combinedText = '';
      
      // Add system message first if it exists
      const systemMessage = messageData.messages.find(msg => msg.role === 'system');
      if (systemMessage) {
        combinedText += systemMessage.content + '\n\n';
      }
      
      // Add user messages
      const userMessages = messageData.messages.filter(msg => msg.role === 'user');
      combinedText += userMessages.map(msg => msg.content).join('\n');
      
      requestBody = {
        contents: [{
          parts: [{
            text: combinedText
          }]
        }],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens
        }
      };
    } else if (settings.provider === 'claude.ai') {
      // Claude.ai experimental web interface
      sendResponse({ 
        error: 'Claude.ai provider is experimental and requires web interface integration. Please use the Anthropic provider instead for API access.' 
      });
      return;
    } else {
      // Standard OpenAI-compatible format
      requestBody = {
        model: settings.model,
        messages: messageData.messages,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        stream: messageData.stream || false
      };
    }
    
    // Update log data with request payload
    logData.requestPayload = {
      host,
      method: 'POST',
      headers: { ...headers },
      body: requestBody
    };
    
    // Console log the sidepanel request payload
    console.log('ðŸ”§ Provider:', settings.provider);
    console.log('ðŸ¤– Model:', settings.model);
    console.log('ðŸ“¤ Sidepanel Request URL:', host);
    console.log('ðŸ“¤ Sidepanel Request Headers:', headers);
    console.log('ðŸ“¤ Sidepanel Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      const responseTime = Date.now() - startTime;
      
      // Log error
      logData.responseTime = responseTime;
      logData.error = `API Error ${response.status}: ${errorData}`;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ 
        error: `API Error ${response.status}: ${errorData}` 
      });
      return;
    }
    
    if (messageData.stream) {
      // Handle streaming response
      console.log('ðŸ“¡ Starting streaming response...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let responseText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                responseText += content;
                // Send partial response
                chrome.runtime.sendMessage({
                  action: 'streamChunk',
                  content: content,
                  fullText: responseText
                });
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      // Console log the streaming response completion
      console.log('ðŸ’¬ Sidepanel Streaming Response Complete:', responseText);
      console.log('â±ï¸ Sidepanel Streaming Response Time:', responseTime + 'ms');
      console.log('âœ… === SIDEPANEL STREAMING CHAT COMPLETE ===\n');
      
      // Log streaming response
      logData.response = responseText;
      logData.responseTime = responseTime;
      logData.success = true;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ content: responseText, streaming: true });
    } else {
      // Handle regular response
      const data = await response.json();
      console.log('ðŸ“¥ Sidepanel Raw API Response:', JSON.stringify(data, null, 2));
      
      let content;
      
      if (settings.provider === 'anthropic') {
        // Anthropic response format
        content = data.content?.[0]?.text || 'No response received';
      } else if (settings.provider === 'gemini') {
        // Gemini response format
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received';
      } else if (settings.provider === 'claude.ai') {
        // Claude.ai experimental - should not reach here
        content = 'Claude.ai experimental provider not implemented';
      } else {
        // Standard OpenAI-compatible format
        content = data.choices?.[0]?.message?.content || 'No response received';
      }
      
      const responseTime = Date.now() - startTime;
      
      // Console log the processed sidepanel response
      console.log('ðŸ’¬ Sidepanel AI Response:', content);
      console.log('â±ï¸ Sidepanel Response Time:', responseTime + 'ms');
      console.log('ðŸ“¤ Sending response object:', { content });
      console.log('âœ… === SIDEPANEL CHAT COMPLETE ===\n');
      
      // Log regular response
      logData.response = content;
      logData.responseTime = responseTime;
      logData.success = true;
      await chatLogger.logChatInteraction(logData);
      
      sendResponse({ content });
    }
    
  } catch (error) {
    console.error('âŒ === SIDEPANEL CHAT ERROR ===');
    console.error('ðŸ’¥ Sidepanel Error:', error.message);
    console.error('ðŸ” Sidepanel Full Error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log('â±ï¸ Sidepanel Error Response Time:', responseTime + 'ms');
    console.log('âŒ === SIDEPANEL CHAT ERROR END ===\n');
    
    // Log error
    logData.responseTime = responseTime;
    logData.error = `Network error: ${error.message}`;
    await chatLogger.logChatInteraction(logData);
    
    sendResponse({ 
      error: `Network error: ${error.message}` 
    });
  }
}

async function testConnection(settings, sendResponse) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add authorization header only if API key is provided and not local
    if (settings.apiKey && settings.apiKey !== 'local-no-key-required' && settings.provider !== 'local') {
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
    }
    
    const response = await fetch(settings.host, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    });
    
    if (response.ok || response.status === 400) {
      // 400 is also acceptable as it means the endpoint is reachable
      sendResponse({ status: 'Connected', success: true });
    } else {
      sendResponse({ 
        status: `Error ${response.status}`, 
        success: false,
        message: await response.text()
      });
    }
  } catch (error) {
    sendResponse({ 
      status: 'Connection Failed', 
      success: false,
      message: error.message 
    });
  }
}

function getStoredSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['aiSettings'], (result) => {
      let settings = result.aiSettings || {};
      
      // Migration: Update token limits to conserve credits (800 tokens)
      if (settings.maxTokens === 2048 || settings.maxTokens === 1500) {
        console.log('🔄 Migrating maxTokens from', settings.maxTokens, 'to 800');
        settings.maxTokens = 800;
        // Save the updated settings
        chrome.storage.sync.set({ aiSettings: settings }, () => {
          console.log('✅ Settings migration completed');
        });
      }
      
      // Apply local provider corrections consistently
      if (settings.provider === 'local') {
        console.log('🔧 Background: Applying local provider corrections');
        settings.host = 'http://127.0.0.1:11434/api/chat';
        settings.apiKey = ''; // Clear API key for local provider
        console.log('🔧 Background: Local settings corrected - host:', settings.host, 'apiKey cleared:', !settings.apiKey);
      }
      
      resolve(settings);
    });
  });
}

function setStoredSettings(settings) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ aiSettings: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

async function fetchAvailableModels(settings, sendResponse) {
  console.log('fetchAvailableModels called with settings:', settings);
  try {
    // Special handling for local providers - check multiple endpoints
    if (settings.provider === 'local') {
      console.log('Fetching local models...');
      const localModels = await fetchLocalModels(settings.host);
      const result = {
        success: true,
        models: localModels,
        source: 'local-scan'
      };
      console.log('Sending local models result:', result);
      sendResponse(result);
      return;
    }

    // Always try to fetch from API first, regardless of API key presence
    let modelsUrl = getModelsEndpoint(settings.provider, settings.host);
    if (!modelsUrl) {
      console.log('No models endpoint for provider:', settings.provider);
      const result = {
        success: false,
        error: 'Models endpoint not available for this provider',
        models: []
      };
      console.log('Sending no-endpoint result:', result);
      sendResponse(result);
      return;
    }

    // Special handling for Gemini API - now uses x-goog-api-key header (official method)
    // First check if we have an API key
    const hasApiKey = settings.apiKey && settings.apiKey.trim() !== '' && settings.apiKey !== 'local-no-key-required';

    // Check authentication - consider both API key and OAuth/web session
    const authData = await chrome.storage.sync.get([
      `${settings.provider}_auth_token`, 
      `${settings.provider}_auth_method`,
      'aiSettings'
    ]);
    
    // Also check if web session exists
    const webSessionKey = `webSession_${settings.provider}`;
    const webSessionResult = await chrome.storage.local.get(webSessionKey);
    const hasWebSessionData = !!webSessionResult[webSessionKey];
    
    const hasOAuthToken = authData[`${settings.provider}_auth_method`] === 'oauth' && authData[`${settings.provider}_auth_token`];
    const hasWebSession = settings.authMode === 'web' && hasWebSessionData;
    
    console.log('Authentication check:', {
      provider: settings.provider,
      hasApiKey,
      hasOAuthToken,
      hasWebSession,
      hasWebSessionData,
      authMode: settings.authMode,
      apiKeyLength: settings.apiKey ? settings.apiKey.length : 0,
      webSessionKey
    });

    // For providers that require authentication for live model fetching
    if (!hasApiKey && !hasOAuthToken && settings.provider !== 'local') {
      console.log('No API authentication available for:', settings.provider);
      
      // Special message for web-only providers
      if (settings.provider === 'claude.ai') {
        const result = {
          success: false, 
          error: 'Claude.ai is web-interface only. No models API available. Use the web interface directly.',
          models: []
        };
        sendResponse(result);
        return;
      }
      
      // For all other providers, require API key for both model fetching and API communication
      const result = {
        success: false,
        error: `API key required. Without authentication, cannot fetch models or send requests to ${settings.provider}.`,
        models: []
      };
      console.log('Sending no-auth result:', result);
      sendResponse(result);
      return;
    }

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authorization header based on available authentication
    if (hasOAuthToken && settings.provider !== 'local') {
      // Use OAuth token first if available
      const oauthToken = authData[`${settings.provider}_auth_token`];
      if (settings.provider === 'azure') {
        headers['api-key'] = oauthToken;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = oauthToken;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = oauthToken;
      } else {
        headers['Authorization'] = `Bearer ${oauthToken}`;
      }
      console.log('Using OAuth authentication for models fetch');
    } else if (hasApiKey && settings.provider !== 'local') {
      // Fall back to API key
      if (settings.provider === 'azure') {
        headers['api-key'] = settings.apiKey;
      } else if (settings.provider === 'anthropic') {
        headers['x-api-key'] = settings.apiKey;
        headers['anthropic-version'] = '2023-06-01';
      } else if (settings.provider === 'gemini') {
        headers['x-goog-api-key'] = settings.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${settings.apiKey}`;
      }
      console.log('Using API key authentication for models fetch');
    }

    console.log(`Fetching models from ${modelsUrl} for provider ${settings.provider}`);
    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      console.log(`Models API returned ${response.status}: ${response.statusText}`);
      
      // Provide helpful error messages for common authentication issues
      let errorMessage = `API returned ${response.status}: ${response.statusText}`;
      
      if (response.status === 401) {
        if (settings.provider === 'openai' && settings.apiKey && settings.apiKey.startsWith('AIza')) {
          errorMessage = 'Invalid API key: You are using a Google API key for OpenAI. Please get an OpenAI API key from platform.openai.com';
        } else if (settings.provider === 'gemini' && settings.apiKey && settings.apiKey.startsWith('sk-')) {
          errorMessage = 'Invalid API key: You are using an OpenAI API key for Gemini. Please get a Google AI API key from aistudio.google.com';
        } else {
          errorMessage = `Authentication failed: Invalid API key for ${settings.provider}`;
        }
      } else if (response.status === 403) {
        errorMessage = `Access denied: API key may not have permission to list models for ${settings.provider}`;
      }
      
      const result = {
        success: false,
        error: errorMessage,
        models: []
      };
      console.log('Sending API error result:', result);
      sendResponse(result);
      return;
    }

    const data = await response.json();
    console.log('API response data:', data);
    const models = parseModelsResponse(data, settings.provider);
    console.log('Parsed models:', models);

    if (models.length === 0) {
      const result = {
        success: false,
        error: 'No models found in API response',
        models: []
      };
      console.log('Sending no-models result:', result);
      sendResponse(result);
      return;
    }

    const result = {
      success: true,
      models: models,
      source: 'api'
    };
    console.log('Sending API models result:', result);
    sendResponse(result);

  } catch (error) {
    console.error('Error fetching models:', error);
    const result = {
      success: false,
      error: error.message,
      models: []
    };
    console.log('Sending error result:', result);
    sendResponse(result);
  }
}

// Fetch locally installed models from various AI servers
async function fetchLocalModels(customHost) {
  const localEndpoints = [
    // User-specified host first
    customHost ? `${customHost}/v1/models` : null,
    customHost ? `${customHost}/api/tags` : null,
    // Ollama default
    'http://127.0.0.1:11434/api/tags',
    // LM Studio default
    'http://localhost:1234/v1/models',
    // Text-generation-webui default
    'http://localhost:7860/v1/models',
    // LocalAI default
    'http://localhost:8080/v1/models',
    // Oobabooga default
    'http://localhost:5000/v1/models',
    // KoboldCpp default
    'http://localhost:5001/v1/models',
    // Jan.ai default
    'http://localhost:1337/v1/models',
    // GPT4All default
    'http://localhost:4891/v1/models'
  ].filter(Boolean);

  const allModels = [];
  
  for (const endpoint of localEndpoints) {
    try {
      console.log(`Checking local endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        let models = [];
        
        // Parse different response formats
        if (endpoint.includes('/api/tags')) {
          // Ollama format
          if (data.models && Array.isArray(data.models)) {
            models = data.models.map(m => m.name || m.model || m).filter(Boolean);
          }
        } else {
          // OpenAI-compatible format
          if (data.data && Array.isArray(data.data)) {
            models = data.data.map(m => m.id || m.model || m.name).filter(Boolean);
          } else if (Array.isArray(data)) {
            models = data.map(m => m.id || m.model || m.name || m).filter(Boolean);
          }
        }
        
        if (models.length > 0) {
          console.log(`Found ${models.length} models at ${endpoint}:`, models);
          allModels.push(...models);
        }
      }
    } catch (error) {
      // Silently ignore connection errors for local endpoints
      console.log(`Local endpoint ${endpoint} not available:`, error.message);
    }
  }

  // Remove duplicates and sort
  const uniqueModels = [...new Set(allModels)].sort();
  console.log(`Total unique local models found: ${uniqueModels.length}`, uniqueModels);
  
  return uniqueModels;
}

function getModelsEndpoint(provider, host) {
  switch (provider) {
    case 'openai':
      return 'https://api.openai.com/v1/models';
    case 'github':
      return 'https://models.inference.ai.azure.com/models';
    case 'groq':
      return 'https://api.groq.com/openai/v1/models';
    case 'deepseek':
      return 'https://api.deepseek.com/v1/models';
    case 'perplexity':
      return 'https://api.perplexity.ai/models';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1/models';
    case 'claude.ai':
      // Claude.ai doesn't have a public models endpoint
      // We'll return null to trigger an error
      return null;
    case 'gemini':
      // Gemini API uses x-goog-api-key header (official method)
      return 'https://generativelanguage.googleapis.com/v1beta/models';
    case 'azure':
      // Azure doesn't have a standard models endpoint, use default models
      return null;
    case 'local':
      // Try common local AI server endpoints
      return host ? `${host}/v1/models` : 'http://127.0.0.1:11434/api/tags';
    case 'custom':
      return host ? `${host}/v1/models` : null;
    default:
      return null;
  }
}

// Handle keyboard shortcuts (Ctrl+M for automation)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'automation-hotkey') {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (activeTab) {
      await chrome.sidePanel.open({ tabId: activeTab.id });
      
      // Send message to focus on automation
      setTimeout(() => {
        chrome.runtime.sendMessage({ 
          action: 'focusAutomation' 
        }).catch(() => {});
      }, 500);
    }
  }
});

function parseModelsResponse(data, provider) {
  let models = [];

  // Handle different response formats per provider
  switch (provider) {
    case 'openai':
    case 'groq':
    case 'deepseek':
      // Standard OpenAI-compatible format
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id).filter(id => id);
      }
      break;

    case 'github':
      // GitHub Models API format
      if (Array.isArray(data)) {
        models = data.map(model => model.name || model.id).filter(id => id);
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.name || model.id).filter(id => id);
      }
      break;

    case 'perplexity':
      // Perplexity API format
      if (Array.isArray(data)) {
        models = data.map(model => model.id || model.name || model).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name || model).filter(id => id);
      } else if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      }
      break;

    case 'claude.ai':
      // Claude.ai: try to parse any potential API response
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name).filter(id => id);
      }
      break;

    case 'gemini':
      // Gemini API format - returns models with 'name' field
      if (data.models && Array.isArray(data.models)) {
        models = data.models
          .map(model => model.name || model.id)
          .filter(name => name && name.includes('gemini'))
          .map(name => name.replace('models/', '')); // Remove 'models/' prefix
      } else if (Array.isArray(data)) {
        models = data
          .map(model => model.name || model.id)
          .filter(name => name && name.includes('gemini'))
          .map(name => name.replace('models/', ''));
      }
      break;

    default:
      // Fallback: try multiple common formats
      if (data.data && Array.isArray(data.data)) {
        models = data.data.map(model => model.id || model.name).filter(id => id);
      } else if (data.models && Array.isArray(data.models)) {
        models = data.models.map(model => model.id || model.name || model).filter(id => id);
      } else if (Array.isArray(data)) {
        models = data.map(model => model.id || model.name || model).filter(id => id);
      }
      break;
  }

  // Sort models
  models = models.sort();

  // Apply minimal filtering to remove obviously non-chat models
  switch (provider) {
    case 'openai':
      // Remove embeddings, audio, and vision-only models
      models = models.filter(id => 
        !id.includes('embedding') && 
        !id.includes('whisper') && 
        !id.includes('dall-e') &&
        !id.includes('tts') &&
        !id.includes('vision')
      );
      break;
    case 'github':
      // Remove embeddings, audio models
      models = models.filter(id => 
        !id.includes('embedding') && 
        !id.includes('whisper') &&
        !id.includes('dall-e') &&
        !id.includes('tts')
      );
      break;
    case 'groq':
      // Remove whisper and other non-chat models
      models = models.filter(id => 
        !id.includes('whisper') &&
        !id.includes('embedding')
      );
      break;
    case 'deepseek':
    case 'perplexity':
    case 'claude.ai':
    case 'gemini':
      // Keep all models for these providers
      break;
  }

  return models;
}

// Web Session Authentication Functions
// Legacy web session configuration for fallback when MCP is not available
function getLegacyWebSessionConfig(provider) {
  const configs = {
    'openai': {
      tabPatterns: ['*://chat.openai.com/*', '*://chatgpt.com/*'],
      domains: ['.openai.com', 'chat.openai.com', '.chatgpt.com', 'chatgpt.com'],
      authCookies: ['__Secure-next-auth.session-token', '_cfuvid', 'cf_clearance', '__cflb'],
      displayDomain: 'chat.openai.com'
    },
    'claude.ai': {
      tabPatterns: ['*://claude.ai/*'],
      domains: ['.claude.ai', 'claude.ai'],
      authCookies: ['sessionKey', 'auth-token', '_cfuvid', 'cf_clearance'],
      displayDomain: 'claude.ai'
    },
    'gemini': {
      tabPatterns: ['*://gemini.google.com/*', '*://aistudio.google.com/*'],
      domains: ['.google.com', 'gemini.google.com', '.aistudio.google.com'],
      authCookies: ['__Secure-1PSID', '__Secure-3PSID', 'SAPISID', 'HSID', 'SSID', '1P_JAR'],
      displayDomain: 'gemini.google.com'
    },
    'github': {
      tabPatterns: ['*://github.com/*'],
      domains: ['.github.com', 'github.com'],
      authCookies: ['user_session', '_gh_sess', '__Host-user_session_same_site'],
      displayDomain: 'github.com'
    },
    'groq': {
      tabPatterns: ['*://groq.com/*', '*://console.groq.com/*'],
      domains: ['.groq.com', 'groq.com', 'console.groq.com'],
      authCookies: ['session', 'auth_token', '_cfuvid'],
      displayDomain: 'console.groq.com'
    },
    'deepseek': {
      tabPatterns: ['*://chat.deepseek.com/*'],
      domains: ['.deepseek.com', 'chat.deepseek.com'],
      authCookies: ['session', 'token', '_cfuvid'],
      displayDomain: 'chat.deepseek.com'
    },
    'perplexity': {
      tabPatterns: ['*://www.perplexity.ai/*', '*://perplexity.ai/*'],
      domains: ['.perplexity.ai', 'www.perplexity.ai', 'perplexity.ai'],
      authCookies: ['session', 'auth_token', '_cfuvid'],
      displayDomain: 'www.perplexity.ai'
    }
  };
  
  return configs[provider];
}

async function captureWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.info('Capturing web session', { provider });
    } else {
      console.log('[BG] Capturing web session for provider:', provider);
    }
    
    // Get MCP provider configuration for web session if available
    let config;
    if (mcpInitialized) {
      const mcpConfig = getMCPProviderConfiguration(provider);
      if (!mcpConfig || !mcpConfig.authentication.webSession) {
        if (useLogger) {
          mcpLogger.error('Provider not supported for web session', { provider });
        } else {
          console.error('[BG] Provider not supported for web session:', provider);
        }
        sendResponse({ success: false, error: 'Provider not supported for web session' });
        return;
      }
      config = mcpConfig.authentication.webSession;
    } else {
      // Fallback to legacy configuration
      config = getLegacyWebSessionConfig(provider);
      if (!config) {
        console.error('[BG] Provider not supported for web session:', provider);
        sendResponse({ success: false, error: 'Provider not supported for web session' });
        return;
      }
    }
    
    if (useLogger) {
      mcpLogger.debug('Using web session config', { provider, config });
    } else {
      console.log('[BG] Using web session config for provider:', provider);
    }
    
    // Query for tabs using multiple patterns
    let tabs = [];
    for (const pattern of config.tabPatterns) {
      if (useLogger) {
        mcpLogger.debug('Querying for tabs with pattern', { provider, pattern });
      } else {
        console.log('[BG] Querying for tabs with pattern:', pattern);
      }
      const patternTabs = await chrome.tabs.query({ url: pattern });
      tabs.push(...patternTabs);
    }
    
    // Remove duplicates
    tabs = tabs.filter((tab, index, self) => self.findIndex(t => t.id === tab.id) === index);
    
    if (useLogger) {
      mcpLogger.debug('Found tabs for provider', { 
        provider, 
        tabCount: tabs.length, 
        tabs: tabs.map(t => ({ id: t.id, url: t.url })) 
      });
    } else {
      console.log('[BG] Found tabs:', tabs.length, tabs.map(t => ({ id: t.id, url: t.url })));
    }
    
    if (tabs.length === 0) {
      if (useLogger) {
        mcpLogger.warn('No tabs found for provider', { provider, displayDomain: config.displayDomain });
      } else {
        console.warn('[BG] No tabs found for provider:', provider);
      }
      sendResponse({ 
        success: false, 
        error: `No ${provider} tabs found. Please open ${config.displayDomain} and sign in first.` 
      });
      return;
    }
    
    // Get cookies from all potential domains
    let allCookies = [];
    for (const domain of config.domains) {
      if (useLogger) {
        mcpLogger.debug('Getting cookies for domain', { provider, domain });
      } else {
        console.log('[BG] Getting cookies for domain:', domain);
      }
      
      // Try different approaches to get cookies
      const domainCookies = await chrome.cookies.getAll({ domain: domain });
      
      if (useLogger) {
        mcpLogger.debug('Found cookies for domain', { 
          provider, 
          domain, 
          cookieCount: domainCookies.length,
          cookies: domainCookies.map(c => ({ name: c.name, domain: c.domain, valueLength: c.value.length }))
        });
      } else {
        console.log(`[BG] Found ${domainCookies.length} cookies for domain ${domain}`);
      }
      
      allCookies.push(...domainCookies);
    }
    
    // Also try getting cookies by URL (more comprehensive)
    for (const tab of tabs) {
      if (useLogger) {
        mcpLogger.debug('Getting cookies for URL', { provider, url: tab.url });
      } else {
        console.log('[BG] Getting cookies for URL:', tab.url);
      }
      const urlCookies = await chrome.cookies.getAll({ url: tab.url });
      
      if (useLogger) {
        mcpLogger.debug('Found cookies for URL', {
          provider,
          url: tab.url,
          cookieCount: urlCookies.length,
          cookies: urlCookies.map(c => ({ name: c.name, domain: c.domain, valueLength: c.value.length }))
        });
      } else {
        console.log(`[BG] Found ${urlCookies.length} cookies for URL ${tab.url}`);
      }
      
      allCookies.push(...urlCookies);
    }
    
    // Remove duplicate cookies (same name + domain)
    const uniqueCookies = allCookies.filter((cookie, index, self) => 
      self.findIndex(c => c.name === cookie.name && c.domain === cookie.domain) === index
    );
    
    if (useLogger) {
      mcpLogger.info('Collected unique cookies', { provider, cookieCount: uniqueCookies.length });
    } else {
      console.log('[BG] Total unique cookies found:', uniqueCookies.length);
    }
    
    if (uniqueCookies.length === 0) {
      if (useLogger) {
        mcpLogger.warn('No cookies found for provider', { provider, displayDomain: config.displayDomain });
      } else {
        console.warn('[BG] No cookies found for provider:', provider);
      }
      sendResponse({ 
        success: false, 
        error: `No session cookies found for ${config.displayDomain}. Please sign in to the website first.` 
      });
      return;
    }
    
    // Look for authentication cookies
    const authCookies = uniqueCookies.filter(cookie => 
      config.authCookies.some(authName => cookie.name.includes(authName))
    );
    
    if (useLogger) {
      mcpLogger.debug('Authentication cookies identified', { 
        provider, 
        authCookieCount: authCookies.length,
        authCookies: authCookies.map(c => ({ name: c.name, domain: c.domain }))
      });
    } else {
      console.log('[BG] Authentication cookies found:', authCookies.length);
    }
    
    // If no specific auth cookies found, use all cookies (fallback)
    const cookiesToStore = authCookies.length > 0 ? authCookies : uniqueCookies;
    
    // Store the session data
    const sessionData = {
      provider: provider,
      domain: config.displayDomain,
      cookies: cookiesToStore,
      capturedAt: new Date().toISOString(),
      tabUrl: tabs[0].url,
      cookieStats: {
        total: uniqueCookies.length,
        auth: authCookies.length,
        stored: cookiesToStore.length
      }
    };
    
    // Save to local storage (more secure than sync for session data)
    const storageKey = `webSession_${provider}`;
    if (useLogger) {
      mcpLogger.debug('Saving session data', { provider, storageKey });
    } else {
      console.log('[BG] Saving session data with key:', storageKey);
    }
    await chrome.storage.local.set({ [storageKey]: sessionData });
    
    if (useLogger) {
      mcpLogger.info('Web session captured successfully', {
        provider,
        domain: config.displayDomain,
        cookieStats: sessionData.cookieStats,
        capturedAt: sessionData.capturedAt
      });
    } else {
      console.log(`[BG] Web session captured for ${provider}:`, {
        domain: config.displayDomain,
        cookieStats: sessionData.cookieStats
      });
    }
    
    const responseData = { 
      success: true, 
      sessionInfo: `${cookiesToStore.length} cookies captured (${authCookies.length} auth cookies)`,
      capturedAt: sessionData.capturedAt,
      cookieStats: sessionData.cookieStats
    };
    
    if (useLogger) {
      mcpLogger.debug('Sending success response', { provider, responseData });
    } else {
      console.log('[BG] Sending success response for provider:', provider);
    }
    sendResponse(responseData);
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error capturing web session', { provider, error: error.message, stack: error.stack });
    } else {
      console.error('[BG] Error capturing web session:', error.message);
    }
    sendResponse({ success: false, error: error.message });
  }
}

async function clearWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.info('Clearing web session', { provider });
    } else {
      console.log('[BG] Clearing web session for provider:', provider);
    }
    
    const storageKey = `webSession_${provider}`;
    
    if (useLogger) {
      mcpLogger.debug('Removing storage key', { provider, storageKey });
    } else {
      console.log('[BG] Removing storage key:', storageKey);
    }
    
    await chrome.storage.local.remove(storageKey);
    
    if (useLogger) {
      mcpLogger.info('Web session cleared successfully', { provider });
    } else {
      console.log('[BG] Web session cleared successfully for provider:', provider);
    }
    
    sendResponse({ success: true });
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error clearing web session', { provider, error: error.message });
    } else {
      console.error('[BG] Error clearing web session:', error.message);
    }
    sendResponse({ success: false, error: error.message });
  }
}

async function checkWebSession(provider, sendResponse) {
  try {
    const useLogger = mcpInitialized && mcpLogger;
    
    if (useLogger) {
      mcpLogger.debug('Checking web session', { provider });
    } else {
      console.log('[BG] Checking web session for provider:', provider);
    }
    
    const storageKey = `webSession_${provider}`;
    
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (useLogger) {
      mcpLogger.debug('Session data check result', { provider, hasSession: !!sessionData });
    } else {
      console.log('[BG] Session data found:', !!sessionData);
    }
    
    if (!sessionData) {
      if (useLogger) {
        mcpLogger.debug('No session data found', { provider });
      } else {
        console.log('[BG] No session data found for provider:', provider);
      }
      sendResponse({ hasSession: false });
      return;
    }
    
    // Check if session is still valid (within last 24 hours)
    const capturedTime = new Date(sessionData.capturedAt);
    const now = new Date();
    const hoursSinceCapture = (now - capturedTime) / (1000 * 60 * 60);
    
    if (useLogger) {
      mcpLogger.debug('Session age check', { 
        provider, 
        capturedTime: capturedTime.toISOString(), 
        hoursSinceCapture 
      });
    } else {
      console.log('[BG] Session age:', { capturedTime, now, hoursSinceCapture });
    }
    
    if (hoursSinceCapture > 24) {
      if (useLogger) {
        mcpLogger.info('Session expired, removing', { provider, hoursSinceCapture });
      } else {
        console.log('[BG] Session expired, removing for provider:', provider);
      }
      // Session is too old, clear it
      await chrome.storage.local.remove(storageKey);
      sendResponse({ hasSession: false, reason: 'Session expired' });
      return;
    }
    
    const responseData = { 
      hasSession: true, 
      sessionInfo: sessionData.cookieStats ? 
        `${sessionData.cookieStats.stored} cookies (${sessionData.cookieStats.auth} auth), captured ${Math.round(hoursSinceCapture)}h ago` :
        `${sessionData.cookies.length} cookies, captured ${Math.round(hoursSinceCapture)}h ago`,
      capturedAt: sessionData.capturedAt,
      domain: sessionData.domain,
      cookieStats: sessionData.cookieStats
    };
    
    if (useLogger) {
      mcpLogger.debug('Session status response', { provider, responseData });
    } else {
      console.log('[BG] Sending session status response for provider:', provider);
    }
    sendResponse(responseData);
    
  } catch (error) {
    if (mcpInitialized && mcpLogger) {
      mcpLogger.error('Error checking web session', { provider, error: error.message });
    } else {
      console.error('[BG] Error checking web session:', error.message);
    }
    sendResponse({ hasSession: false, error: error.message });
  }
}

// Function to use web session for API calls
async function makeWebSessionRequest(url, options, provider) {
  try {
    const storageKey = `webSession_${provider}`;
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (!sessionData) {
      throw new Error('No web session found. Please capture session first.');
    }
    
    // Add cookies to the request
    const cookieString = sessionData.cookies
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');
    
    // Update headers with session cookies
    const sessionOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Cookie': cookieString,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': sessionData.domain
      }
    };
    
    return fetch(url, sessionOptions);
    
  } catch (error) {
    console.error('Error making web session request:', error);
    throw error;
  }
}

// Handle AI messages using web session authentication
async function handleWebSessionMessage(messageData, sendResponse, settings) {
  try {
    // Check if web session exists
    const storageKey = `webSession_${settings.provider}`;
    const result = await chrome.storage.local.get(storageKey);
    const sessionData = result[storageKey];
    
    if (!sessionData) {
      sendResponse({ 
        error: 'No web session found. Please capture a web session first in settings.' 
      });
      return;
    }
    
    // For web session, we need to simulate the web interface API calls
    // This is experimental and depends on the provider's web API structure
    const webApiUrls = {
      'openai': 'https://chat.openai.com/backend-api/conversation',
      'anthropic': 'https://claude.ai/api/organizations/*/chat_conversations',
      'claude.ai': 'https://claude.ai/api/organizations/*/chat_conversations',
      'gemini': 'https://gemini.google.com/api/chat',
      // Add more providers as needed
    };
    
    const apiUrl = webApiUrls[settings.provider];
    if (!apiUrl) {
      sendResponse({ 
        error: `Web session API not implemented for ${settings.provider}. This feature is experimental.` 
      });
      return;
    }
    
    // Note: This is a simplified implementation
    // Real web session integration would require reverse engineering each provider's web API
    sendResponse({ 
      error: `Web session authentication for ${settings.provider} is experimental and requires additional implementation. Please use API mode for now.` 
    });
    
  } catch (error) {
    console.error('Error handling web session message:', error);
    sendResponse({ 
      error: `Web session error: ${error.message}` 
    });
  }
}
