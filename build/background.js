// Background service worker for ChromeAiAgent
// Import MCP-compliant provider interface
// Temporarily commented out to fix service worker registration
// importScripts('mcp-provider-interface.js');

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
          console.log('[AutomationScript] Found element with case-insensitive class search');
          return element;
        }
        
        // Try finding by partial class name
        const elements = document.querySelectorAll('[class]');
        for (let el of elements) {
          if (el.className.toLowerCase().includes(className.toLowerCase())) {
            console.log('[AutomationScript] Found element with partial class match');
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
            console.log('[AutomationScript] Found element by text content match');
            return el;
          }
          if (text.includes('profile') && searchText.includes('profile')) {
            console.log('[AutomationScript] Found element by text content match');
            return el;
          }
          if (text.includes('save') && searchText.includes('save')) {
            console.log('[AutomationScript] Found element by text content match');
            return el;
          }
        }
      }
      
      // Strategy 4: ID search with partial matching
      if (selector.startsWith('#')) {
        const idName = selector.substring(1);
        element = document.querySelector(`[id*="${idName}" i]`);
        if (element) {
          console.log('[AutomationScript] Found element with partial ID match');
          return element;
        }
      }
      
      // Strategy 5: Attribute search for common patterns
      const commonSelectors = [
        `[data-testid*="${selector.replace(/[.#]/, '')}" i]`,
        `[aria-label*="${selector.replace(/[.#]/, '')}" i]`,
        `[name*="${selector.replace(/[.#]/, '')}" i]`,
        `[placeholder*="${selector.replace(/[.#]/, '')}" i]`
      ];
      
      for (let altSelector of commonSelectors) {
        try {
          element = document.querySelector(altSelector);
          if (element) {
            console.log('[AutomationScript] Found element with attribute search:', altSelector);
            return element;
          }
        } catch (e) {
          // Invalid selector, continue
        }
      }
      
      console.log('[AutomationScript] Element not found with any strategy');
      return null;
    };

    const automation = {
      click: (selector) => {
        console.log('[AutomationScript] Attempting to click element with selector:', selector);
        
        // First try direct querySelector with the exact selector
        let element = null;
        try {
          element = document.querySelector(selector);
          if (element) {
            console.log('[AutomationScript] Found element with direct selector');
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
          console.log('[AutomationScript] Direct selector failed:', error.message);
        }
        
        // Fallback to findElement strategies
        element = findElement(selector);
        if (element) {
          console.log('[AutomationScript] Found element with fallback strategies');
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
        
        console.log('[AutomationScript] Element not found with any method');
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
          const event = new MouseEvent('mouseover', { bubbles: true, cancelable: true });
          element.dispatchEvent(event);
          return { success: true, action: 'hovered', element: selector, actualElement: element.tagName + (element.id ? '#' + element.id : '') + (element.className ? '.' + element.className.split(' ')[0] : '') };
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

      middleClick: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const event = new MouseEvent('auxclick', { 
            bubbles: true, 
            cancelable: true,
            button: 1,
            buttons: 4
          });
          element.dispatchEvent(event);
          return { success: true, action: 'middleclicked', element: selector };
        }
        return { success: false, error: 'Element not found' };
      },

      clickAndHold: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          const mouseDownEvent = new MouseEvent('mousedown', { 
            bubbles: true, 
            cancelable: true,
            button: 0,
            buttons: 1
          });
          element.dispatchEvent(mouseDownEvent);
          // Note: In real usage, this would need to be paired with a mouseup event later
          return { success: true, action: 'clickandhold', element: selector };
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

      scrollToTop: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return { success: true, action: 'scrolled_to_top' };
      },

      scrollToBottom: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        return { success: true, action: 'scrolled_to_bottom' };
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

      pressKey: (selector, key) => {
        const element = document.querySelector(selector);
        if (element) {
          element.focus();
          const keyDownEvent = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true
          });
          const keyUpEvent = new KeyboardEvent('keyup', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true
          });
          element.dispatchEvent(keyDownEvent);
          element.dispatchEvent(keyUpEvent);
          return { success: true, action: 'key_pressed', element: selector, key };
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

      uncheck: (selector) => {
        const element = document.querySelector(selector);
        if (element && (element.type === 'checkbox' || element.type === 'radio')) {
          element.checked = false;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'unchecked', element: selector };
        }
        return { success: false, error: 'Element not found or not checkable' };
      },

      clearField: (selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.value = '';
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true, action: 'field_cleared', element: selector };
        }
        return { success: false, error: 'Element not found' };
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

      submitForm: (selector) => {
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

      resetForm: (selector) => {
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

      closeTab: () => {
        window.close();
        return { success: true, action: 'tab_closed' };
      },

      maximizeWindow: () => {
        // Browser security limitations prevent true maximization from content scripts
        // This is more of a placeholder for the API
        return { success: true, action: 'maximize_requested', note: 'Browser security limits this action' };
      },

      minimizeWindow: () => {
        // Browser security limitations prevent minimization from content scripts
        return { success: true, action: 'minimize_requested', note: 'Browser security limits this action' };
      },

      resizeWindow: (width, height) => {
        // Browser security limitations prevent resizing from content scripts
        return { success: true, action: 'resize_requested', width, height, note: 'Browser security limits this action' };
      },

      switchToTab: (pattern) => {
        // This action requires browser API access, not available in content scripts
        return { success: true, action: 'tab_switch_requested', pattern, note: 'Requires browser extension context' };
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

      // Alert Handling Actions
      acceptAlert: () => {
        // Note: Content scripts cannot directly interact with browser alerts
        // This would need to be handled by the background script
        return { success: true, action: 'alert_accept_requested', note: 'Requires background script handling' };
      },

      dismissAlert: () => {
        // Note: Content scripts cannot directly interact with browser alerts
        return { success: true, action: 'alert_dismiss_requested', note: 'Requires background script handling' };
      },

      getAlertText: () => {
        // Note: Content scripts cannot directly access alert text
        return { success: true, action: 'alert_text_requested', note: 'Requires background script handling' };
      },

      // Data Extraction Actions
      getPageTitle: () => {
        return { success: true, action: 'title_retrieved', title: document.title };
      },

      getCurrentUrl: () => {
        return { success: true, action: 'url_retrieved', url: window.location.href };
      },

      // Advanced Actions
      executeScript: (script) => {
        try {
          const result = eval(script);
          return { success: true, action: 'script_executed', result: String(result) };
        } catch (error) {
          return { success: false, error: 'Script execution failed: ' + error.message };
        }
      },

      takeScreenshot: () => {
        // Content scripts cannot take screenshots directly
        return { success: true, action: 'screenshot_requested', note: 'Requires background script handling' };
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
      }
    };

    console.log('[AutomationScript] Available actions:', Object.keys(automation));
    console.log('[AutomationScript] Requested action:', action);
    console.log('[AutomationScript] Action exists:', !!automation[action]);
    
    if (automation[action]) {
      const result = automation[action](...Object.values(params || {}));
      console.log('[AutomationScript] Action result:', result);
      return result;
    } else {
      console.log('[AutomationScript] Unknown action:', action);
      return { success: false, error: `Unknown action: ${action}` };
    }
    
    } catch (error) {
        console.error('[AutomationScript] Error:', error);
        return { success: false, error: error.message || 'Script execution failed' };
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
        maxTokens: 800
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
      // Basic actions
      click: this.handleClick.bind(this),
      type: this.handleType.bind(this),
      fill: this.handleFill.bind(this),
      scroll: this.handleScroll.bind(this),
      navigate: this.handleNavigate.bind(this),
      refresh: this.handleRefresh.bind(this),
      newTab: this.handleNewTab.bind(this),
      screenshot: this.handleScreenshot.bind(this),
      extract: this.handleExtract.bind(this),
      highlight: this.handleHighlight.bind(this),
      organize: this.handleOrganize.bind(this),
      note: this.handleNote.bind(this),
      wait: this.handleWait.bind(this),
      
      // Advanced mouse actions
      doubleClick: this.handleDoubleClick.bind(this),
      rightClick: this.handleRightClick.bind(this),
      contextClick: this.handleRightClick.bind(this), // alias for rightClick
      middleClick: this.handleMiddleClick.bind(this),
      clickAndHold: this.handleClickAndHold.bind(this),
      mouseDown: this.handleMouseDown.bind(this),
      mouseUp: this.handleMouseUp.bind(this),
      hover: this.handleHover.bind(this),
      mouseMove: this.handleMouseMove.bind(this),
      
      // Keyboard actions
      keyDown: this.handleKeyDown.bind(this),
      keyUp: this.handleKeyUp.bind(this),
      sendKeys: this.handleSendKeys.bind(this),
      pressKey: this.handlePressKey.bind(this),
      
      // Form actions
      select: this.handleSelect.bind(this),
      check: this.handleCheck.bind(this),
      uncheck: this.handleUncheck.bind(this),
      uploadFile: this.handleUploadFile.bind(this),
      clearField: this.handleClearField.bind(this),
      submitForm: this.handleSubmitForm.bind(this),
      resetForm: this.handleResetForm.bind(this),
      
      // Window and tab management
      closeTab: this.handleCloseTab.bind(this),
      switchToTab: this.handleSwitchToTab.bind(this),
      resizeWindow: this.handleResizeWindow.bind(this),
      maximizeWindow: this.handleMaximizeWindow.bind(this),
      minimizeWindow: this.handleMinimizeWindow.bind(this),
      
      // Page navigation
      goBack: this.handleGoBack.bind(this),
      goForward: this.handleGoForward.bind(this),
      reload: this.handleRefresh.bind(this), // alias for refresh
      scrollToTop: this.handleScrollToTop.bind(this),
      scrollToBottom: this.handleScrollToBottom.bind(this),
      scrollToElement: this.handleScrollToElement.bind(this),
      
      // Data extraction
      getText: this.handleGetText.bind(this),
      getAttribute: this.handleGetAttribute.bind(this),
      getPageTitle: this.handleGetPageTitle.bind(this),
      getCurrentUrl: this.handleGetCurrentUrl.bind(this),
      
      // Alert and popup handling
      acceptAlert: this.handleAcceptAlert.bind(this),
      dismissAlert: this.handleDismissAlert.bind(this),
      getAlertText: this.handleGetAlertText.bind(this),
      
      // Advanced interactions
      dragAndDrop: this.handleDragAndDrop.bind(this),
      executeScript: this.handleExecuteScript.bind(this)
    };
    
    this.domAnalyzer = new DOMAnalyzer();
    this.commandParser = new AICommandParser();
    this.aiPlanner = new AICommandPlanner();
  }

  // Detect if a command contains multiple actions
  isMultiActionCommand(command) {
    const lowerCmd = command.toLowerCase();
    
    // Look for conjunctions that indicate multiple actions
    const multiActionPatterns = [
      /\band\s+(?:then\s+)?(?:click|type|enter|fill|scroll|hover|press|tap|search|open|navigate)/i,
      /\bthen\s+(?:click|type|enter|fill|scroll|hover|press|tap|search|open|navigate)/i,
      /\bafter\s+that\s+(?:click|type|enter|fill|scroll|hover|press|tap|search|open|navigate)/i,
      /\bnext\s+(?:click|type|enter|fill|scroll|hover|press|tap|search|open|navigate)/i,
      /\bfirst\s+.+\bthen\s+/i,
      /\bfirst\s+.+\band\s+/i
    ];
    
    // Check if command matches any multi-action pattern
    for (const pattern of multiActionPatterns) {
      if (pattern.test(command)) {
        console.log('📊 BrowserAutomation: Multi-action pattern detected:', pattern.source);
        return true;
      }
    }
    
    // Count action keywords to detect implicit multi-actions
    const actionKeywords = ['click', 'type', 'enter', 'fill', 'scroll', 'hover', 'press', 'tap', 'search', 'open', 'navigate', 'newTab'];
    let actionCount = 0;
    
    for (const keyword of actionKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = command.match(regex);
      if (matches) {
        actionCount += matches.length;
      }
    }
    
    if (actionCount > 1) {
      console.log('📊 BrowserAutomation: Multiple action keywords detected:', actionCount);
      return true;
    }
    
    return false;
  }

  async executeCommand(command, tabId) {
    try {
      console.log('📊 BrowserAutomation: executeCommand called with:', { command, tabId });
      
      // Check if this is a multi-action command first
      if (this.isMultiActionCommand(command)) {
        console.log('📊 BrowserAutomation: Multi-action command detected, using AI planner for:', command);
        return await this.executeAIPlan(command, tabId);
      }

      // First try simple parsing for single actions
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

      const handler = this.commands[parsedCommand.action];
      
      if (!handler) {
        // If no handler found, try AI planning
        console.log('📊 BrowserAutomation: No handler found for action:', parsedCommand.action, 'using AI planner');
        return await this.executeAIPlan(command, tabId);
      }
      
      console.log('📊 BrowserAutomation: Executing handler for action:', parsedCommand.action);
      return await handler(parsedCommand, tabId);
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
      const plan = await this.aiPlanner.createPlan(command, pageContext);
      
      if (!plan.understood || !plan.plan.length) {
        throw new Error(`AI could not understand command: ${command}`);
      }

      console.log('ðŸ¤– AI Plan created:', plan);

      // Execute plan steps
      const results = [];
      for (const step of plan.plan) {
        try {
          console.log(`ðŸ”„ Executing step: ${step.description}`);
          
          if (step.action === 'wait') {
            await this.handleWait(step, tabId);
            results.push({ success: true, step: step.description });
            continue;
          }

          const handler = this.commands[step.action];
          if (!handler) {
            throw new Error(`Unknown action in plan: ${step.action}`);
          }

          const result = await handler(step, tabId);
          results.push({ success: true, step: step.description, result });
          
          // If this was a newTab action, switch to the new tab for subsequent actions
          if (step.action === 'newTab' && result.newTabId) {
            tabId = result.newTabId; // Update tabId for subsequent actions
            console.log(`🔄 Switched automation context to new tab: ${tabId}`);
            // Wait a bit longer for the new tab to load
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            // Small delay between steps
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (stepError) {
          console.error(`Step failed: ${step.description}`, stepError);
          results.push({ success: false, step: step.description, error: stepError.message });
          
          // Continue with remaining steps unless it's a critical failure
          if (step.action === 'navigate' || step.action === 'newTab') {
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
      const elements = await this.injectAndExecute(tabId, 'extractPageElements');
      
      return {
        url: tab.url,
        title: tab.title,
        elements: elements || []
      };
    } catch (error) {
      console.warn('Could not get page context:', error);
      return null;
    }
  }

  async handleClick(command, tabId) {
    console.log('🎯 handleClick called with command:', command, 'tabId:', tabId);
    console.log('🎯 Looking for element with target:', command.target);
    
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    console.log('🎯 DOMAnalyzer returned selector:', selector);
    
    if (!selector) {
      console.log('❌ No selector found, automation failed');
      return null;
    }
    
    const result = await this.injectAndExecute(tabId, 'click', { selector });
    console.log('🎯 Click execution result:', result);
    return result;
  }

  async handleType(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'type', { 
      selector, 
      text: command.text 
    });
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
    const url = command.url || command.target; // Support both url and target properties
    return await chrome.tabs.update(tabId, { url: url });
  }

  async handleRefresh(command, tabId) {
    await chrome.tabs.reload(tabId);
    return { 
      success: true, 
      action: 'refresh', 
      message: 'Page refreshed successfully'
    };
  }

  async handleNewTab(command, tabId) {
    const url = command.url || command.target; // Support both url and target properties
    const newTab = await chrome.tabs.create({ url: url, active: true }); // Make the new tab active
    return { 
      success: true, 
      action: 'newTab', 
      url: url, 
      tabId: newTab.id,
      message: `Opened new tab with ${url}`,
      newTabId: newTab.id // Include the new tab ID for subsequent actions
    };
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

  // ========== ADVANCED MOUSE ACTIONS ==========
  async handleDoubleClick(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'doubleClick', { selector });
  }

  async handleRightClick(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'rightClick', { selector });
  }

  async handleMiddleClick(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'middleClick', { selector });
  }

  async handleClickAndHold(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'clickAndHold', { selector });
  }

  async handleMouseDown(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'mouseDown', { selector, button: command.button || 'left' });
  }

  async handleMouseUp(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'mouseUp', { selector, button: command.button || 'left' });
  }

  async handleHover(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'hover', { selector });
  }

  async handleMouseMove(command, tabId) {
    if (command.target) {
      const selector = await this.domAnalyzer.findElement(command.target, tabId);
      return await this.injectAndExecute(tabId, 'mouseMove', { 
        selector, 
        offsetX: command.offsetX || 0, 
        offsetY: command.offsetY || 0 
      });
    } else {
      return await this.injectAndExecute(tabId, 'mouseMoveBy', { 
        x: command.x || 0, 
        y: command.y || 0 
      });
    }
  }

  // ========== KEYBOARD ACTIONS ==========
  async handleKeyDown(command, tabId) {
    const selector = command.target ? await this.domAnalyzer.findElement(command.target, tabId) : null;
    return await this.injectAndExecute(tabId, 'keyDown', { 
      selector, 
      key: command.key,
      modifiers: command.modifiers || []
    });
  }

  async handleKeyUp(command, tabId) {
    const selector = command.target ? await this.domAnalyzer.findElement(command.target, tabId) : null;
    return await this.injectAndExecute(tabId, 'keyUp', { 
      selector, 
      key: command.key,
      modifiers: command.modifiers || []
    });
  }

  async handleSendKeys(command, tabId) {
    const selector = command.target ? await this.domAnalyzer.findElement(command.target, tabId) : null;
    return await this.injectAndExecute(tabId, 'sendKeys', { 
      selector, 
      keys: command.keys || command.text 
    });
  }

  async handlePressKey(command, tabId) {
    const selector = command.target ? await this.domAnalyzer.findElement(command.target, tabId) : null;
    return await this.injectAndExecute(tabId, 'pressKey', { 
      selector, 
      key: command.key,
      modifiers: command.modifiers || []
    });
  }

  // ========== FORM ACTIONS ==========
  async handleSelect(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'selectOption', { 
      selector, 
      value: command.value,
      text: command.text,
      index: command.index
    });
  }

  async handleCheck(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'setChecked', { selector, checked: true });
  }

  async handleUncheck(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'setChecked', { selector, checked: false });
  }

  async handleUploadFile(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'uploadFile', { 
      selector, 
      files: command.files || [command.file] 
    });
  }

  async handleClearField(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'clearField', { selector });
  }

  async handleSubmitForm(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'submitForm', { selector });
  }

  async handleResetForm(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'resetForm', { selector });
  }

  // ========== WINDOW AND TAB MANAGEMENT ==========
  async handleCloseTab(command, tabId) {
    if (command.tabId) {
      await chrome.tabs.remove(command.tabId);
      return { success: true, action: 'closeTab', tabId: command.tabId };
    } else {
      await chrome.tabs.remove(tabId);
      return { success: true, action: 'closeTab', tabId };
    }
  }

  async handleSwitchToTab(command, tabId) {
    if (command.tabId) {
      await chrome.tabs.update(command.tabId, { active: true });
      return { success: true, action: 'switchToTab', tabId: command.tabId };
    } else if (command.url) {
      const tabs = await chrome.tabs.query({ url: `*${command.url}*` });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { active: true });
        return { success: true, action: 'switchToTab', tabId: tabs[0].id, url: command.url };
      }
      throw new Error(`No tab found with URL: ${command.url}`);
    }
    throw new Error('Must specify tabId or url for switchToTab');
  }

  async handleResizeWindow(command, tabId) {
    const window = await chrome.windows.getCurrent();
    await chrome.windows.update(window.id, { 
      width: command.width, 
      height: command.height 
    });
    return { success: true, action: 'resizeWindow', width: command.width, height: command.height };
  }

  async handleMaximizeWindow(command, tabId) {
    const window = await chrome.windows.getCurrent();
    await chrome.windows.update(window.id, { state: 'maximized' });
    return { success: true, action: 'maximizeWindow' };
  }

  async handleMinimizeWindow(command, tabId) {
    const window = await chrome.windows.getCurrent();
    await chrome.windows.update(window.id, { state: 'minimized' });
    return { success: true, action: 'minimizeWindow' };
  }

  // ========== PAGE NAVIGATION ==========
  async handleGoBack(command, tabId) {
    return await this.injectAndExecute(tabId, 'goBack', {});
  }

  async handleGoForward(command, tabId) {
    return await this.injectAndExecute(tabId, 'goForward', {});
  }

  async handleScrollToTop(command, tabId) {
    return await this.injectAndExecute(tabId, 'scrollTo', { x: 0, y: 0 });
  }

  async handleScrollToBottom(command, tabId) {
    return await this.injectAndExecute(tabId, 'scrollToBottom', {});
  }

  async handleScrollToElement(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'scrollIntoView', { selector });
  }

  // ========== DATA EXTRACTION ==========
  async handleGetText(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'getText', { selector });
  }

  async handleGetAttribute(command, tabId) {
    const selector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'getAttribute', { 
      selector, 
      attribute: command.attribute 
    });
  }

  async handleGetPageTitle(command, tabId) {
    const tab = await chrome.tabs.get(tabId);
    return { success: true, action: 'getPageTitle', title: tab.title };
  }

  async handleGetCurrentUrl(command, tabId) {
    const tab = await chrome.tabs.get(tabId);
    return { success: true, action: 'getCurrentUrl', url: tab.url };
  }

  // ========== ALERT AND POPUP HANDLING ==========
  async handleAcceptAlert(command, tabId) {
    return await this.injectAndExecute(tabId, 'acceptAlert', {});
  }

  async handleDismissAlert(command, tabId) {
    return await this.injectAndExecute(tabId, 'dismissAlert', {});
  }

  async handleGetAlertText(command, tabId) {
    return await this.injectAndExecute(tabId, 'getAlertText', {});
  }

  // ========== ADVANCED INTERACTIONS ==========
  async handleDragAndDrop(command, tabId) {
    const sourceSelector = await this.domAnalyzer.findElement(command.source, tabId);
    const targetSelector = await this.domAnalyzer.findElement(command.target, tabId);
    return await this.injectAndExecute(tabId, 'dragAndDrop', { 
      source: sourceSelector, 
      target: targetSelector 
    });
  }

  async handleExecuteScript(command, tabId) {
    return await this.injectAndExecute(tabId, 'executeScript', { 
      script: command.script,
      args: command.args || []
    });
  }

  async injectAndExecute(tabId, action, params = {}) {
    try {
      console.log('🔧 injectAndExecute called with:', { tabId, action, params });
      
      // Ensure params is serializable (plain object or null)
      const serializableParams = params ? JSON.parse(JSON.stringify(params)) : {};
      console.log('🔧 Serializable params:', serializableParams);
      
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: automationContentScript,
        args: [action, serializableParams]
      });
      
      console.log('🔧 Script execution results:', results);
      console.log('🔧 First result:', results[0]);
      console.log('🔧 Result value:', results[0]?.result);
      
      return results[0]?.result;
    } catch (error) {
      console.error('❌ Script injection failed:', error);
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
        max_tokens: 500
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

// DOM Analysis System
class DOMAnalyzer {
  async findElement(description, tabId) {
    console.log('🔍 DOMAnalyzer.findElement called with description:', description, 'tabId:', tabId);
    
    try {
      // First, test if basic script injection works
      const testResults = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          return {
            test: 'basic script injection working',
            buttonsCount: document.querySelectorAll('button').length,
            domain: document.domain,
            title: document.title
          };
        }
      });
      
      console.log('🔍 Basic script test result:', testResults[0]?.result);
      
      // Now try our main script - define function inline to avoid 'this' issues
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: (description) => {
          // Comprehensive element finding function
          function scoreElement(element, description) {
            let score = 0;
            const desc = description.toLowerCase();
            const text = (element.textContent || '').toLowerCase();
            const ariaLabel = (element.getAttribute('aria-label') || '').toLowerCase();
            const title = (element.getAttribute('title') || '').toLowerCase();
            const id = (element.id || '').toLowerCase();
            const className = (element.className || '').toLowerCase();
            const name = (element.getAttribute('name') || '').toLowerCase();
            const value = (element.value || '').toLowerCase();
            const placeholder = (element.getAttribute('placeholder') || '').toLowerCase();
            
            const searchTerms = desc.split(/\s+/);
            
            searchTerms.forEach(term => {
              if (text.includes(term)) score += 10;
              if (ariaLabel.includes(term)) score += 8;
              if (title.includes(term)) score += 6;
              if (id.includes(term)) score += 5;
              if (name.includes(term)) score += 5;
              if (value.includes(term)) score += 4;
              if (placeholder.includes(term)) score += 4;
              if (className.includes(term)) score += 3;
            });
            
            return score;
          }

          function generateSelector(element) {
            if (element.id) return `#${element.id}`;
            
            let selector = element.tagName.toLowerCase();
            if (element.className) {
              // Filter out pseudo-classes and invalid characters for querySelector
              const classes = element.className.split(/\s+/)
                .filter(c => c && !c.includes(':')) // Remove pseudo-classes like :hover
                .filter(c => /^[a-zA-Z0-9_-]+$/.test(c)); // Keep only valid CSS class names
              
              if (classes.length > 0) {
                selector += '.' + classes.join('.');
              }
            }
            
            const parent = element.parentElement;
            if (parent && parent !== document.body) {
              const siblings = Array.from(parent.children);
              const index = siblings.indexOf(element);
              if (index > 0) {
                selector += `:nth-child(${index + 1})`;
              }
            }
            
            return selector;
          }

          try {
            // Determine if we're looking for input fields or buttons based on description
            const isInputSearch = /\b(field|input|text|area|box|form|enter|type)\b/i.test(description);
            
            let elements, elementType;
            if (isInputSearch) {
              // Search for input fields and textareas
              elements = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="url"], input[type="tel"], input[type="number"], textarea, input:not([type])');
              elementType = 'input fields';
            } else {
              // Search for button-like elements
              elements = document.querySelectorAll('button, input[type="submit"], input[type="button"], [role="button"], a.btn, .button');
              elementType = 'button-like elements';
            }
            
            console.log(`Found ${elements.length} ${elementType} for: "${description}"`);
            
            const allElements = Array.from(elements).map((elem, index) => ({
              index: index,
              tagName: elem.tagName,
              text: elem.textContent?.trim() || elem.value || '',
              placeholder: elem.placeholder || '',
              id: elem.id || '',
              className: elem.className || '',
              ariaLabel: elem.getAttribute('aria-label') || '',
              title: elem.getAttribute('title') || '',
              type: elem.type || '',
              name: elem.name || '',
              selector: generateSelector(elem)
            }));
            
            // Score and rank elements
            const candidates = Array.from(elements)
              .map(element => ({
                element: element,
                score: scoreElement(element, description),
                selector: generateSelector(element),
                text: element.textContent?.trim() || element.value || element.placeholder || '',
                debug: {
                  id: element.id,
                  className: element.className,
                  ariaLabel: element.getAttribute('aria-label'),
                  title: element.getAttribute('title'),
                  placeholder: element.placeholder,
                  name: element.name
                }
              }))
              .filter(candidate => candidate.score > 0)
              .sort((a, b) => b.score - a.score);
            
            const topCandidates = candidates.slice(0, 5).map(c => ({
              score: c.score,
              text: c.text,
              selector: c.selector,
              debug: c.debug
            }));
            
            const bestMatch = candidates[0];
            
            console.log(`All ${elementType}:`, allElements);
            console.log('Top candidates:', topCandidates);
            console.log('Best match:', bestMatch);
            
            if (bestMatch) {
              return {
                selector: bestMatch.selector,
                debug: {
                  description: description,
                  elementType: elementType,
                  allElements: allElements,
                  topCandidates: topCandidates,
                  selectedElement: {
                    score: bestMatch.score,
                    text: bestMatch.text,
                    selector: bestMatch.selector,
                    debug: bestMatch.debug
                  }
                }
              };
            }
            
            return {
              selector: null,
              debug: {
                description: description,
                elementType: elementType,
                allElements: allElements,
                topCandidates: topCandidates,
                message: 'No suitable element found'
              }
            };
            
          } catch (error) {
            console.error('Error in DOM analysis:', error);
            return {
              selector: null,
              debug: {
                error: true,
                message: error.message,
                stack: error.stack,
                description: description
              }
            };
          }
        },
        args: [description]
      });
      
      const result = results[0]?.result;
      console.log('🔍 DOMAnalyzer script result:', result);
      console.log('🔍 Results array length:', results?.length);
      console.log('🔍 First result:', results[0]);
      
      if (result && result.debug) {
        console.log('🔍 Debug info:', result.debug);
        console.log('🔍 All elements found:', result.debug.allElements);
        console.log('🔍 Top candidates:', result.debug.topCandidates);
        return result.selector;
      } else {
        console.log('🔍 Legacy result format or null:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ DOM analysis failed:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw error;
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
    // Absolute minimal test - no try-catch, just basic return
    return {
      test: 'simple return works',
      description: description || 'no description',
      buttonCount: document ? document.querySelectorAll('button').length : 0
    };
  }

  formAnalysisScript(formDescription) {
    const forms = document.querySelectorAll('form, .form, [role="form"]');
    let targetForm = null;
    
    // Find the most relevant form
    for (const form of forms) {
      const formText = form.textContent.toLowerCase();
      if (formText.includes(formDescription.toLowerCase())) {
        targetForm = form;
        break;
      }
    }
    
    if (!targetForm && forms.length > 0) {
      targetForm = forms[0]; // Fallback to first form
    }
    
    if (!targetForm) {
      return { error: 'No form found' };
    }
    
    const fields = {};
    const inputs = targetForm.querySelectorAll('input, textarea, select');
    
    for (const input of inputs) {
      let fieldName = input.name || input.id || input.placeholder || input.type;
      if (!fieldName) {
        const label = targetForm.querySelector(`label[for="${input.id}"]`);
        if (label) fieldName = label.textContent.trim();
      }
      
      if (fieldName) {
        fields[fieldName.toLowerCase()] = this.generateSelector(input);
      }
    }
    
    return {
      selector: this.generateSelector(targetForm),
      fields,
      action: targetForm.action,
      method: targetForm.method
    };
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
      
      // Advanced mouse events
      doubleClick: /(?:double\s+click|dbl\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      rightClick: /(?:right\s+click|context\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      middleClick: /(?:middle\s+click|wheel\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      clickAndHold: /(?:click\s+and\s+hold|hold\s+click)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      hover: /(?:hover|mouse\s+over)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      mouseDown: /mouse\s+down\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      mouseUp: /mouse\s+up\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      mouseMove: /(?:move\s+mouse\s+to|mouse\s+move)\s+(?:the\s+)?(.+)/i,
      
      // Scrolling
      scroll: /scroll\s+(up|down|left|right)(?:\s+(\d+))?/i,
      scrollToElement: /scroll\s+to\s+(?:the\s+)?(.+)/i,
      scrollToTop: /scroll\s+to\s+top/i,
      scrollToBottom: /scroll\s+to\s+bottom/i,
      
      // Keyboard events
      keyDown: /(?:key\s+down|press\s+key)\s+(.+?)(?:\s+on\s+(.+))?/i,
      keyUp: /(?:key\s+up|release\s+key)\s+(.+?)(?:\s+on\s+(.+))?/i,
      sendKeys: /(?:send\s+keys|press)\s+(.+?)(?:\s+to\s+(.+))?/i,
      pressKey: /(?:press|hit)\s+(.+?)(?:\s+on\s+(.+))?/i,
      typeText: /(?:type\s+text|slowly\s+type)\s+["']([^"']+)["']\s+(?:in|into|to)\s+(?:the\s+)?(.+)/i,
      
      // Form actions
      focus: /focus\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      blur: /blur\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      select: /select\s+(.+?)(?:\s+in\s+(.+))?/i,
      check: /check\s+(?:the\s+)?(.+)/i,
      uncheck: /uncheck\s+(?:the\s+)?(.+)/i,
      clearField: /(?:clear|empty)\s+(?:the\s+)?(.+)/i,
      uploadFile: /(?:upload|attach)\s+file\s+(.+?)\s+to\s+(?:the\s+)?(.+)/i,
      submitForm: /submit\s+(?:the\s+)?(.+)/i,
      resetForm: /reset\s+(?:the\s+)?(.+)/i,
      
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
      goBack: /(?:go\s+back|navigate\s+back|back)/i,
      goForward: /(?:go\s+forward|navigate\s+forward|forward)/i,
      newTabAndNavigate: /(?:open\s+)?new\s+tab\s+and\s+(?:navigate\s+to|go\s+to)\s+(.+)/i,
      newTab: /(?:open\s+)?(?:new\s+tab(?:\s+(?:with))?)\s+(.+)/i,
      navigate: /(?:go to|navigate to|open)\s+(.+)/i,
      closeTab: /close\s+(?:current\s+)?tab/i,
      switchToTab: /(?:switch\s+to|go\s+to)\s+tab\s+(.+)/i,
      maximizeWindow: /maximize\s+window/i,
      minimizeWindow: /minimize\s+window/i,
      resizeWindow: /resize\s+window\s+to\s+(\d+)x(\d+)/i,
      
      // Data extraction
      getText: /(?:get\s+text|read\s+text)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      getAttribute: /(?:get\s+attribute|read\s+attribute)\s+(.+?)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      getPageTitle: /get\s+(?:page\s+)?title/i,
      getCurrentUrl: /get\s+(?:current\s+)?url/i,
      
      // Alert handling
      acceptAlert: /(?:accept|ok|confirm)\s+alert/i,
      dismissAlert: /(?:dismiss|cancel|close)\s+alert/i,
      getAlertText: /get\s+alert\s+text/i,
      
      // Content manipulation
      setText: /(?:set\s+text|change\s+text)\s+(?:of\s+)?(?:the\s+)?(.+?)\s+to\s+["']([^"']+)["']/i,
      setAttribute: /(?:set\s+attribute|change\s+attribute)\s+(.+?)\s+(?:of\s+)?(?:the\s+)?(.+?)\s+to\s+["']([^"']+)["']/i,
      addClass: /(?:add\s+class|apply\s+class)\s+(.+?)\s+(?:to\s+)?(?:the\s+)?(.+)/i,
      removeClass: /(?:remove\s+class|delete\s+class)\s+(.+?)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      toggleClass: /toggle\s+class\s+(.+?)\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
      // Advanced actions
      executeScript: /(?:execute|run)\s+script\s+["']([^"']+)["']/i,
      takeScreenshot: /(?:take\s+screenshot|capture\s+screen|screenshot)/i,
      waitForElement: /wait\s+for\s+(?:the\s+)?(.+?)(?:\s+(\d+))?/i,
      waitForCondition: /wait\s+(?:for|until)\s+(.+)/i,
      
      // Page/Window actions
      refresh: /(?:refresh|reload)(?:\s+(?:the\s+)?page|\(\))?/i,
      goBack: /(?:go\s+back|navigate\s+back|back)/i,
      goForward: /(?:go\s+forward|navigate\s+forward|forward)/i,
      newTabAndNavigate: /(?:open\s+)?new\s+tab\s+and\s+(?:navigate\s+to|go\s+to)\s+(.+)/i,
      newTab: /(?:open\s+)?(?:new\s+tab(?:\s+(?:with))?)\s+(.+)/i,
      navigate: /(?:go to|navigate to|open)\s+(.+)/i,
      closeTab: /close\s+(?:current\s+)?tab/i,
      switchToTab: /(?:switch\s+to|go\s+to)\s+tab\s+(.+)/i,
      maximizeWindow: /maximize\s+window/i,
      minimizeWindow: /minimize\s+window/i,
      resizeWindow: /resize\s+window\s+to\s+(\d+)x(\d+)/i,
      
      // Data extraction
      getText: /(?:get\s+text|read\s+text)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      getAttribute: /(?:get\s+attribute|read\s+attribute)\s+(.+?)\s+(?:from\s+)?(?:the\s+)?(.+)/i,
      getPageTitle: /get\s+(?:page\s+)?title/i,
      getCurrentUrl: /get\s+(?:current\s+)?url/i,
      
      // Alert handling
      acceptAlert: /(?:accept|ok|confirm)\s+alert/i,
      dismissAlert: /(?:dismiss|cancel|close)\s+alert/i,
      getAlertText: /get\s+alert\s+text/i,
      
      // Touch events
      touchStart: /touch\s+start\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      touchMove: /touch\s+move\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      touchEnd: /touch\s+end\s+(?:on\s+)?(?:the\s+)?(.+)/i,
      
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
      case 'middleClick':
        return { action: 'middleClick', target: match[1] };
      case 'clickAndHold':
        return { action: 'clickAndHold', target: match[1] };
      case 'mouseDown':
        return { action: 'mouseDown', target: match[1] };
      case 'mouseUp':
        return { action: 'mouseUp', target: match[1] };
      case 'mouseMove':
        return { action: 'mouseMove', target: match[1] };
      
      // Scrolling
      case 'scroll':
        return { action: 'scroll', direction: match[1], amount: parseInt(match[2]) || 100 };
      case 'scrollToElement':
        return { action: 'scrollToElement', target: match[1] };
      case 'scrollToTop':
        return { action: 'scrollToTop' };
      case 'scrollToBottom':
        return { action: 'scrollToBottom' };
      
      // Keyboard events
      case 'keyDown':
        return { action: 'keyDown', key: match[1], target: match[2] || 'body' };
      case 'keyUp':
        return { action: 'keyUp', key: match[1], target: match[2] || 'body' };
      case 'sendKeys':
        return { action: 'sendKeys', keys: match[1], target: match[2] || 'body' };
      case 'pressKey':
        return { action: 'pressKey', key: match[1], target: match[2] || 'body' };
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
        return { action: 'check', target: match[1] };
      case 'uncheck':
        return { action: 'uncheck', target: match[1] };
      case 'clearField':
        return { action: 'clearField', target: match[1] };
      case 'uploadFile':
        return { action: 'uploadFile', filePath: match[1], target: match[2] };
      case 'submitForm':
        return { action: 'submitForm', target: match[1] };
      case 'resetForm':
        return { action: 'resetForm', target: match[1] };
      
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
        return { action: 'newTab', url: this.normalizeUrl(match[1]) };
      case 'newTab':
        return { action: 'newTab', url: this.normalizeUrl(match[1]) };
      case 'navigate':
        return { action: 'navigate', url: this.normalizeUrl(match[1]) };
      case 'closeTab':
        return { action: 'closeTab' };
      case 'switchToTab':
        return { action: 'switchToTab', target: match[1] };
      case 'maximizeWindow':
        return { action: 'maximizeWindow' };
      case 'minimizeWindow':
        return { action: 'minimizeWindow' };
      case 'resizeWindow':
        return { action: 'resizeWindow', width: parseInt(match[1]), height: parseInt(match[2]) };
      
      // Data extraction
      case 'getText':
        return { action: 'getText', target: match[1] };
      case 'getAttribute':
        return { action: 'getAttribute', attribute: match[1], target: match[2] };
      case 'getPageTitle':
        return { action: 'getPageTitle' };
      case 'getCurrentUrl':
        return { action: 'getCurrentUrl' };
      
      // Alert handling
      case 'acceptAlert':
        return { action: 'acceptAlert' };
      case 'dismissAlert':
        return { action: 'dismissAlert' };
      case 'getAlertText':
        return { action: 'getAlertText' };
      
      // Content manipulation
      case 'setText':
        return { action: 'setText', target: match[1], text: match[2] };
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
      case 'waitForCondition':
        return { action: 'waitForCondition', condition: match[1] };
      
      // Extraction and analysis
      case 'screenshot':
        return { action: 'screenshot' };
      case 'takeScreenshot':
        return { action: 'takeScreenshot' };
      case 'executeScript':
        return { action: 'executeScript', script: match[1] };
      case 'extract':
        return { action: 'extract', type: match[1], selector: match[2] };
      case 'extractPageElements':
        return { action: 'extractPageElements' };
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

Available browser actions:
- click: Click on elements (buttons, links, text)
- type: Type text in single input fields (use for individual text inputs, textareas, etc.)
- fill: Fill entire forms with multiple data fields (NOT for single field input)
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

Command: "enter Test in the Bio field"
Response: {
  "understood": true,
  "plan": [
    {"action": "type", "target": "Bio field", "text": "Test", "description": "Type 'Test' in the Bio field"}
  ],
  "reasoning": "For single field input, I'll use the type action to enter the text"
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
        contextPrompt += `\n\nCurrent page context:
URL: ${pageContext.url || 'unknown'}
Title: ${pageContext.title || 'unknown'}
User Agent: ${navigator.userAgent}
Available elements: ${pageContext.elements ? pageContext.elements.slice(0, 15).join(', ') : 'analyzing...'}

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

    // Use existing processAIRequest function
    const result = await processAIRequest({ messages, settings });
    
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
          sendResponse({ success: true, result });
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
    'openrouter': 5000,      // Conservative for pay-per-use
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
        dynamicMaxTokens: Math.min(dynamicMaxTokens, getMaxTokensForComplexity(requestComplexity, provider)),
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
        max_tokens: 500,
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
        max_tokens: 500
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
