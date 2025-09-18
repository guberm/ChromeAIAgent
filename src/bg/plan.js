// Simple per-tab plan storage and retrieval
(function() {
  const KEY = 'agentPlansByTabId';

  async function getPlan(tabId) {
    const data = await chrome.storage.local.get(KEY);
    const all = data[KEY] || {};
    return all[tabId] || { steps: [], createdAt: null };
  }

  async function setPlan(tabId, plan) {
    const data = await chrome.storage.local.get(KEY);
    const all = data[KEY] || {};
    all[tabId] = plan;
    await chrome.storage.local.set({ [KEY]: all });
    try { chrome.runtime.sendMessage({ type: 'AGENT_PLAN_UPDATED', tabId, plan }, () => void chrome.runtime.lastError); } catch {}
  }

  async function clearPlan(tabId) {
    const data = await chrome.storage.local.get(KEY);
    const all = data[KEY] || {};
    delete all[tabId];
    await chrome.storage.local.set({ [KEY]: all });
  }

  self.AgentPlanStore = { getPlan, setPlan, clearPlan };
})();
