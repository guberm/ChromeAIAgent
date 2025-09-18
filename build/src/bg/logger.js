// Service Worker Chat Logger and Agent log utilities
// Exposes global `chatLogger` and `agentLog` for use across background scripts

(function() {
  class SWChatLogger {
    constructor() {
      this.maxLogs = 1000;
      this.storageKey = 'chatLogs';
    }

    async logChatInteraction(data) {
      try {
        const timestamp = new Date().toISOString();
        const logEntry = {
          id: this._generateLogId(),
          timestamp,
          provider: data.provider,
          model: data.model,
          prompt: data.prompt,
          requestPayload: data.requestPayload,
          response: data.response,
          responseTime: data.responseTime,
          success: data.success,
          error: data.error,
          source: data.source
        };
        const result = await chrome.storage.local.get(this.storageKey);
        let logs = result[this.storageKey] || [];
        logs.unshift(logEntry);
        if (logs.length > this.maxLogs) logs = logs.slice(0, this.maxLogs);
        await chrome.storage.local.set({ [this.storageKey]: logs });
        console.log('[ChatLogger] Interaction logged:', {
          id: logEntry.id, provider: data.provider, model: data.model, success: data.success
        });
        // also broadcast to side panel / popup
        this._broadcast({ type: 'AGENT_LOG', level: 'info', message: 'Interaction logged', entry: logEntry });
      } catch (error) {
        console.error('[ChatLogger] Failed to log interaction:', error);
      }
    }

    async getLogs(filters = {}) {
      try {
        const result = await chrome.storage.local.get(this.storageKey);
        let logs = result[this.storageKey] || [];
        if (filters.provider) logs = logs.filter(l => l.provider === filters.provider);
        if (filters.success !== undefined) logs = logs.filter(l => l.success === filters.success);
        if (filters.startDate) logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
        if (filters.endDate) logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
        if (filters.search) {
          const s = String(filters.search).toLowerCase();
          logs = logs.filter(l => (l.prompt || '').toLowerCase().includes(s) || (l.response || '').toLowerCase().includes(s));
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
      const result = await chrome.storage.local.get(this.storageKey);
      let logs = result[this.storageKey] || [];
      if (logs.length > maxLogs) {
        logs = logs.slice(0, maxLogs);
        await chrome.storage.local.set({ [this.storageKey]: logs });
      }
    }

    _generateLogId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    _broadcast(payload) {
      try {
        chrome.runtime.sendMessage(payload, () => void chrome.runtime.lastError);
      } catch (e) {
        // ignore
      }
    }
  }

  function agentLog(level, message, meta) {
    try {
      const entry = { type: 'AGENT_LOG', level, message, meta, timestamp: new Date().toISOString() };
      console[level === 'error' ? 'error' : 'log'](`[Agent:${level}]`, message, meta || '');
      chrome.runtime.sendMessage(entry, () => void chrome.runtime.lastError);
      return entry;
    } catch (e) {
      // noop
    }
  }

  self.chatLogger = new SWChatLogger();
  self.agentLog = agentLog;
  console.log('[Init] ChatLogger initialized');
})();
