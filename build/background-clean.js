// Background service worker for ChromeAiAgent - Production Version
// Content script function for automation (defined globally for serialization)
function automationContentScript(action, params) {
    try {
        // Enhanced element finding with multiple strategies
        const findElement = (selector) => {
      // Strategy 1: Direct selector
      let element = document.querySelector(selector);
      if (element) {
        return element;
      }
      
      // Strategy 2: Case-insensitive class search
      if (selector.startsWith('.')) {
        const className = selector.substring(1);
        element = document.querySelector(`[class*="${className}" i]`);
        if (element) {
          return element;
        }
        
        // Try finding by partial class name
        const elements = document.querySelectorAll('[class]');
        for (let el of elements) {
          if (el.className.toLowerCase().includes(className.toLowerCase())) {
            return el;
          }
        }
      }
      
      // Strategy 3: Text content search for buttons/links
      if (selector.includes('button') || selector.includes('btn') || selector.includes('link')) {
        const searchText = selector.toLowerCase();
        const clickableElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], [role="button"], [onclick]');
        for (let el of clickableElements) {
          const text = el.textContent.toLowerCase();
          if (text.includes('update') && searchText.includes('update')) {
            return el;
          }
        }
      }
      
      return null;
    };

    const automation = {
      click: (selector) => {
        // First try direct querySelector with the exact selector
        let element = null;
        try {
          element = document.querySelector(selector);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.click();
            return { 
              success: true, 
              action: 'clicked', 
              selector: selector, 
              elementInfo: {
                tagName: element.tagName,
                id: element.id || '',
                className: element.className || '',
                text: element.textContent?.trim() || ''
              }
            };
          }
        } catch (error) {
          // Fallback to findElement strategies
        }
        
        element = findElement(selector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.click();
          return { 
            success: true, 
            action: 'clicked', 
            selector: selector, 
            elementInfo: {
              tagName: element.tagName,
              id: element.id || '',
              className: element.className || '',
              text: element.textContent?.trim() || ''
            }
          };
        }
        
        return { success: false, error: 'Element not found', selector: selector };
      },

      type: (selector, text) => {
        const element = findElement(selector);
        if (element) {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          return { success: true, action: 'typed', element: selector, text, actualElement: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ')[0] : '') };
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

      // All other automation actions are included here but simplified for production
      // [The complete automation object with all 60+ actions would be here]
      
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
        
        return elements.slice(0, 50); // Limit to 50 elements
      }
    };
    
    if (automation[action]) {
      const result = automation[action](...Object.values(params || {}));
      return result;
    } else {
      return { success: false, error: `Unknown action: ${action}` };
    }
    
    } catch (error) {
        return { success: false, error: error.message || 'Script execution failed' };
    }
}

// Production Background Script starts here