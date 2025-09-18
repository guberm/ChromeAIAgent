// Expose pageAnalysisScript in page context for XPath analysis
function pageAnalysisScript() {
  console.log('[XPathAnalysis] Starting comprehensive page analysis...');
  function generateXPath(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return null;
    if (element.id) { return `//*[@id="${element.id}"]`; }
    const parts = []; let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let tagName = current.tagName.toLowerCase(); let selector = tagName;
      if (current.parentNode) {
        const siblings = Array.from(current.parentNode.children).filter(sib => sib.tagName.toLowerCase() === tagName);
        if (siblings.length > 1) { const index = siblings.indexOf(current) + 1; selector += `[${index}]`; }
      }
      parts.unshift(selector); current = current.parentNode;
    }
    return '/' + parts.join('/');
  }
  function isElementVisible(element) {
    const rect = element.getBoundingClientRect(); const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  function isElementClickable(element) {
    const clickableTags = ['a','button','input','select','textarea'];
    if (clickableTags.includes(element.tagName.toLowerCase())) return true;
    if (element.getAttribute('role') === 'button') return true; if (element.getAttribute('onclick')) return true; if (element.style.cursor === 'pointer') return true; return false;
  }
  function isElementInput(element) {
    const inputTags = ['input','textarea','select']; if (inputTags.includes(element.tagName.toLowerCase())) return true; if (element.isContentEditable) return true; return false;
  }
  function calculateAutomationScore(element, analysis) {
    let score = 0; if (analysis.isVisible) score += 10; if (analysis.isClickable) score += 15; if (analysis.isInput) score += 15; if (analysis.text.length > 0) score += 5; if (analysis.text.length > 10) score += 5; if (analysis.id) score += 10; if (analysis.attributes['aria-label']) score += 8; if (analysis.attributes.role) score += 5; if (analysis.attributes.title) score += 3; if (analysis.attributes.name) score += 7; if (analysis.attributes.placeholder) score += 5; const rect = analysis.boundingRect; if (rect.width >= 10 && rect.height >= 10) score += 5; if (rect.width >= 50 && rect.height >= 20) score += 5; return score;
  }
  function analyzeElement(element) {
    const analysis = { xpath: generateXPath(element), tagName: element.tagName.toLowerCase(), id: element.id || null, classes: Array.from(element.classList), text: element.textContent?.trim().substring(0, 100) || '', attributes: {}, isVisible: isElementVisible(element), isClickable: isElementClickable(element), isInput: isElementInput(element), boundingRect: element.getBoundingClientRect(), automationScore: 0 };
    ['type','name','placeholder','value','href','role','aria-label','title'].forEach(attr => { if (element.hasAttribute(attr)) analysis.attributes[attr] = element.getAttribute(attr); });
    analysis.automationScore = calculateAutomationScore(element, analysis); return analysis;
  }
  function analyzePageElements() {
    const allElements = document.querySelectorAll('*');
    const analysis = { pageUrl: window.location.href, pageTitle: document.title, timestamp: new Date().toISOString(), totalElements: allElements.length, interactiveElements: [], elementsByXPath: new Map(), topScoredElements: [], categories: { buttons: [], inputs: [], links: [], forms: [], navigation: [], content: [] } };
    allElements.forEach(element => {
      const elementAnalysis = analyzeElement(element);
      if (elementAnalysis.automationScore < 5 || !elementAnalysis.isVisible) return;
      analysis.elementsByXPath.set(elementAnalysis.xpath, elementAnalysis);
      analysis.interactiveElements.push(elementAnalysis);
      if (elementAnalysis.tagName === 'button' || elementAnalysis.attributes.role === 'button') analysis.categories.buttons.push(elementAnalysis);
      else if (elementAnalysis.isInput) analysis.categories.inputs.push(elementAnalysis);
      else if (elementAnalysis.tagName === 'a') analysis.categories.links.push(elementAnalysis);
      else if (elementAnalysis.tagName === 'form') analysis.categories.forms.push(elementAnalysis);
      else if (elementAnalysis.tagName === 'nav' || elementAnalysis.classes.some(cls => cls.includes('nav'))) analysis.categories.navigation.push(elementAnalysis);
      else analysis.categories.content.push(elementAnalysis);
    });
    analysis.interactiveElements.sort((a,b)=>b.automationScore-a.automationScore); analysis.topScoredElements = analysis.interactiveElements.slice(0,50); Object.keys(analysis.categories).forEach(cat=>{ analysis.categories[cat].sort((a,b)=>b.automationScore-a.automationScore); });
    return analysis;
  }
  try {
    const pageAnalysis = analyzePageElements(); window.chromeAiAgentPageAnalysis = pageAnalysis; return { success: true, analysis: pageAnalysis, message: `Page analysis complete: ${pageAnalysis.interactiveElements.length} interactive elements found` };
  } catch (error) {
    return { success: false, error: error.message, message: 'Page analysis failed' };
  }
}

// expose to global
self.pageAnalysisScript = pageAnalysisScript;
