// Intent classification and action planning utilities
// Determines whether a user request is a chat interaction or an automation action.

(function() {
  const DEFAULT_MODEL_HINT = 'gpt-4o-mini';

  async function classifyIntent(userText, urlHost = '') {
    // Use LLM (temperature 0) for intent classification, fallback to rule-based if LLM fails
    const prompt = `You are an expert assistant. Given the following user command and website domain, classify the user's intent as either 'chat' (if they want to converse or ask a question) or 'automation' (if they want to perform an action on the page).\n\nUser command: "${userText}"\nWebsite domain: ${urlHost}\n\nRespond with a JSON object: {\n  \"intent\": \"chat|automation\",\n  \"confidence\": 0.0-1.0,\n  \"reason\": \"...\"\n}`;
    try {
      const content = await fetchWithProviderLLM(prompt);
      // Handle markdown-wrapped JSON responses
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      return {
        intent: parsed.intent || 'chat',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
        reason: parsed.reason || '',
        domainHint: (urlHost || '').toLowerCase()
      };
    } catch (e) {
      // fallback: rule-based
      if (typeof agentLog === 'function') agentLog('warn', 'LLM classifyIntent failed, using fallback', { error: e && e.message });
      if (e && typeof e.message === 'string' && e.message.includes('429')) {
        // Send chat/log message for rate limit
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'AGENT_LOG', level: 'warn', message: '⚠️ LLM rate limit exceeded. Using fallback logic.' });
        }
      }
      const t = String(userText || '').trim();
      const lower = t.toLowerCase();
      const automationVerbs = /(click|open|go to|navigate|type|fill|select|scroll|press|submit|upload|hover|drag|drop)\b/;
      const questionForms = /^(what|who|why|how|when|where|can|could|would|should|explain|summarize|tell me)\b/;
      const isAutomation = automationVerbs.test(lower) || /\b(on this page|on the site|here)\b/.test(lower);
      const intent = isAutomation ? 'automation' : 'chat';
      return { intent, confidence: isAutomation ? 0.9 : 0.7, reason: 'LLM unavailable, fallback used', domainHint: (urlHost || '').toLowerCase() };
    }
  }

  async function planSteps(userText, urlHost = '') {
    // Use LLM (temperature 0) for step planning, fallback to rule-based if LLM fails
    const prompt = `You are an expert web automation planner. Given the user's command and the website domain, break down the user's request into a minimal sequence of automation steps.\n\nUser command: "${userText}"\nWebsite domain: ${urlHost}\n\nRespond with a JSON array of steps. Each step should be an object: {\n  \"action\": \"click|type|navigate|scroll|wait|...\",\n  \"args\": { ... },\n  \"rationale\": \"...\"\n}\n}`;
    try {
      const content = await fetchWithProviderLLM(prompt);
      // Handle markdown-wrapped JSON responses
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const steps = JSON.parse(cleanContent);
      if (Array.isArray(steps) && steps.length > 0) return steps;
      return [{ action: 'llm_plan_needed', args: {}, rationale: 'LLM returned no steps' }];
    } catch (e) {
      if (typeof agentLog === 'function') agentLog('warn', 'LLM planSteps failed, using fallback', { error: e && e.message });
      if (e && typeof e.message === 'string' && e.message.includes('429')) {
        // Send chat/log message for rate limit
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({ type: 'AGENT_LOG', level: 'warn', message: '⚠️ LLM rate limit exceeded. Using fallback logic.' });
        }
      }
      // fallback: rule-based
      const lower = String(userText || '').toLowerCase();
      const steps = [];
      if (/\bclick\b/.test(lower)) {
        steps.push({ action: 'click', args: { selector: inferTarget(lower) }, rationale: 'User asked to click' });
      } else if (/\btype\b|\bfill\b|\benter\b/.test(lower)) {
        steps.push({ action: 'type', args: { selector: inferTarget(lower), text: inferText(lower) }, rationale: 'User asked to type/fill' });
      } else if (/\bnavigate\b|\bgo to\b|\bopen\b/.test(lower)) {
        const url = extractUrl(lower);
        steps.push({ action: url ? 'navigate' : 'click', args: url ? { url } : { selector: inferTarget(lower) }, rationale: 'User requested navigation' });
      } else if (/\bscroll\b/.test(lower)) {
        steps.push({ action: 'scroll', args: { direction: 'down', amount: 300 }, rationale: 'User requested scroll' });
      }
      if (steps.length === 0) {
        steps.push({ action: 'llm_plan_needed', args: {}, rationale: 'LLM unavailable, fallback used' });
      }
      return steps;
    }
  }

  function inferTarget(lowerText) {
    // crude heuristic to extract quoted or keyword target
    const q = lowerText.match(/['\"]([^'\"]+)['\"]/);
    if (q) return q[1];
    const tokens = lowerText.split(/\s+/);
    // pick last noun-like token as fallback
    return tokens.slice(-3).join(' ');
  }

  function inferText(lowerText) {
    const m = lowerText.match(/\b(?:type|enter|fill)\s+['\"]([^'\"]+)['\"]/);
    return m ? m[1] : '';
  }

  function extractUrl(lowerText) {
    const m = lowerText.match(/https?:\/\/[\w\.-]+[^\s]*/);
    return m ? m[0] : '';
  }

  async function fetchWithProviderLLM(prompt, settingsOverride) {
    // Fetch via OpenAI-compatible endpoint with temperature 0
    const settings = settingsOverride || (await chrome.storage.sync.get(['aiSettings'])).aiSettings || {};
    if (!settings.host || !settings.apiKey) {
      throw new Error('No LLM settings configured');
    }
    const body = {
      model: settings.model || DEFAULT_MODEL_HINT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 4000
    };
    const res = await fetch(settings.host, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`LLM call failed: ${res.status}`);
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return content;
  }

  self.Intent = { classifyIntent, planSteps, fetchWithProviderLLM };
})();
