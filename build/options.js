// Options page script for ChromeAiAgent

const defaults = {
  automationPollTimeoutMs: 5000,
  automationPollIntervalMs: 300,
  followNewTabs: true,
  followNewTabsStrategy: 'newest',
  openTabsInForeground: true,
  lastSelectedHistorySize: 20
};

function $(id) { return document.getElementById(id); }

function setStatus(msg, color = 'green') {
  const el = $('status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = color;
}

function setErrors(list) {
  const container = $('errors');
  if (!container) return;
  if (!list || list.length === 0) {
    container.textContent = '';
    return;
  }
  container.innerHTML = list.map(e => `• ${e}`).join('\n');
}

function updateKeywordsPreview() {
  const el = $('keywordsPreview');
  if (!el) return;
  const raw = $('followKeywords') ? $('followKeywords').value : '';
  const arr = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (arr.length === 0) el.textContent = 'No keywords configured.';
  else el.textContent = 'Parsed keywords: ' + arr.map(k => `"${k}"`).join(', ');
}

function renderLastSelected(obj) {
  const el = $('lastSelected');
  if (!el) return;
  if (!obj) {
    el.textContent = 'No selection recorded yet.';
    return;
  }
  const when = new Date(obj.timestamp).toLocaleString();
  const reason = obj.reason || 'unknown';
  const strategy = obj.strategy ? ` (strategy=${obj.strategy})` : '';
  const badgeColor = reason === 'domain-match' ? '#2e8b57' : (reason === 'path-keyword' ? '#ff8c00' : (reason === 'followed' ? '#1e90ff' : '#777'));
  const badge = `<span style="background:${badgeColor};color:#fff;padding:4px 8px;border-radius:12px;font-weight:600;margin-left:8px">${reason}</span>`;
  el.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between"><div style="flex:1"><strong>URL:</strong> <a href="${obj.url}" target="_blank" rel="noopener noreferrer">${obj.url}</a></div><div>${badge}${strategy}</div></div>` +
                 `<div style="color:#666;font-size:0.9em;margin-top:6px">Recorded: ${when}</div>`;
}

function renderHistory(arr) {
  const el = $('lastSelectedHistory');
  if (!el) return;
  if (!Array.isArray(arr) || arr.length === 0) {
    el.textContent = 'No history yet.';
    return;
  }
  const html = arr.slice().reverse().map(item => {
    const when = new Date(item.timestamp).toLocaleString();
    const reason = item.reason || 'unknown';
    const strategy = item.strategy ? ` (strategy=${item.strategy})` : '';
    return `<div style="padding:6px;border-bottom:1px solid #eee">` +
           `<div><a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.url}</a></div>` +
           `<div style="font-size:0.9em;color:#444">${reason}${strategy} — ${when}</div></div>`;
  }).join('');
  el.innerHTML = html;
  // store for filtering/export
  try { window.__chromeAi_history = Array.isArray(arr) ? arr.slice() : []; } catch(e) {}
}

function isChromeStorageAvailable() {
  try {
    return !!(chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function');
  } catch (e) { return false; }
}

async function saveOptions() {
  const timeout = parseInt($('pollTimeout').value, 10) || defaults.automationPollTimeoutMs;
  const interval = parseInt($('pollInterval').value, 10) || defaults.automationPollIntervalMs;
  const follow = $('followNewTabs').checked;
  const openInForeground = !!($('openInForeground') && $('openInForeground').checked);
  const strategy = $('followStrategy') ? $('followStrategy').value : defaults.followNewTabsStrategy;
  const rawKeywords = $('followKeywords') ? $('followKeywords').value : '';
  const keywords = rawKeywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const errors = [];
  if (timeout < 500 || timeout > 60000) errors.push('Poll timeout must be between 500 and 60000 ms');
  if (interval < 50 || interval > 5000) errors.push('Poll interval must be between 50 and 5000 ms');
  if (!['newest','first','last'].includes(strategy)) errors.push('Invalid follow strategy');

  const historySizeInput = $('historySize');
  const historySize = historySizeInput ? parseInt(historySizeInput.value, 10) : defaults.lastSelectedHistorySize;
  if (Number.isNaN(historySize) || historySize < 1 || historySize > 500) errors.push('History size must be between 1 and 500');

  if (errors.length) {
    setErrors(errors);
    setStatus('Invalid values, fix errors', 'red');
    $('saveBtn').disabled = true;
    return;
  }

  setErrors([]);
  $('saveBtn').disabled = false;

  const payload = {
    automationPollTimeoutMs: timeout,
    automationPollIntervalMs: interval,
    followNewTabs: follow,
    followNewTabsStrategy: strategy,
    openTabsInForeground: openInForeground,
    lastSelectedHistorySize: historySize
  };
  if (keywords && keywords.length) payload.followNewTabsMatchKeywords = keywords;

  if (isChromeStorageAvailable()) {
    chrome.storage.local.set(payload, () => {
      setStatus('Saved', 'green');
      updateKeywordsPreview();
      setTimeout(() => setStatus(''), 2000);
    });
  } else {
    try {
      localStorage.setItem('chromeAiAgent.options', JSON.stringify(payload));
      setStatus('Saved to localStorage (fallback)', 'green');
      updateKeywordsPreview();
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      setStatus('Failed to save settings: ' + (e && e.message), 'red');
    }
  }
}

function restoreOptions() {
  if (isChromeStorageAvailable()) {
    chrome.storage.local.get(defaults, (items) => {
      $('pollTimeout').value = items.automationPollTimeoutMs;
      $('pollInterval').value = items.automationPollIntervalMs;
      $('followNewTabs').checked = !!items.followNewTabs;
  if ($('openInForeground')) $('openInForeground').checked = typeof items.openTabsInForeground === 'undefined' ? defaults.openTabsInForeground : !!items.openTabsInForeground;
      if ($('historySize')) $('historySize').value = items.lastSelectedHistorySize || defaults.lastSelectedHistorySize;
      if ($('followKeywords')) {
        const kws = items.followNewTabsMatchKeywords;
        $('followKeywords').value = Array.isArray(kws) ? kws.join(',') : '';
        updateKeywordsPreview();
      }
      if (items.lastSelectedTab) {
        try { renderLastSelected(items.lastSelectedTab); } catch (e) { console.warn('Failed to render lastSelectedTab on restore:', e && e.message); }
      }
      if ($('followStrategy')) $('followStrategy').value = items.followNewTabsStrategy || defaults.followNewTabsStrategy;
      if (items.lastSelectedTabs) {
        try { renderHistory(items.lastSelectedTabs); } catch (e) { console.warn('Failed to render history on restore:', e && e.message); }
      }
    });
  } else {
    try {
      const raw = localStorage.getItem('chromeAiAgent.options');
      if (raw) {
        const items = JSON.parse(raw);
        $('pollTimeout').value = items.automationPollTimeoutMs || defaults.automationPollTimeoutMs;
        $('pollInterval').value = items.automationPollIntervalMs || defaults.automationPollIntervalMs;
        $('followNewTabs').checked = !!items.followNewTabs;
  if ($('openInForeground')) $('openInForeground').checked = typeof items.openTabsInForeground === 'undefined' ? defaults.openTabsInForeground : !!items.openTabsInForeground;
        if ($('historySize')) $('historySize').value = items.lastSelectedHistorySize || defaults.lastSelectedHistorySize;
        if ($('followStrategy')) $('followStrategy').value = items.followNewTabsStrategy || defaults.followNewTabsStrategy;
        if ($('followKeywords')) {
          $('followKeywords').value = Array.isArray(items.followNewTabsMatchKeywords) ? items.followNewTabsMatchKeywords.join(',') : '';
          updateKeywordsPreview();
        }
        setStatus('Loaded from localStorage (fallback)', 'orange');
      } else {
        $('pollTimeout').value = defaults.automationPollTimeoutMs;
        $('pollInterval').value = defaults.automationPollIntervalMs;
        $('followNewTabs').checked = defaults.followNewTabs;
        if ($('historySize')) $('historySize').value = defaults.lastSelectedHistorySize;
        if ($('followStrategy')) $('followStrategy').value = defaults.followNewTabsStrategy;
      }
    } catch (e) {
      console.warn('Failed to load fallback options:', e && e.message);
    }
  }
}

async function clearHistory() {
  // Confirm before clearing
  if (!confirm('Clear selection history? This will remove the last selected tab and the stored history.')) return;
  if (isChromeStorageAvailable()) {
    chrome.storage.local.remove(['lastSelectedTabs','lastSelectedTab'], () => {
      renderLastSelected(null);
      renderHistory([]);
      try { window.__chromeAi_history = []; } catch(e) {}
      setStatus('Cleared last selection and history', 'green');
      setTimeout(() => setStatus(''), 2000);
    });
  } else {
    renderLastSelected(null);
    renderHistory([]);
    try { window.__chromeAi_history = []; } catch(e) {}
    setStatus('Cleared (local fallback)', 'green');
    setTimeout(() => setStatus(''), 2000);
  }
}

async function exportHistory() {
  try {
    if (!isChromeStorageAvailable()) {
      setStatus('Export requires chrome.storage', 'red');
      return;
    }
    chrome.storage.local.get(['lastSelectedTabs'], (data) => {
      const arr = Array.isArray(data.lastSelectedTabs) ? data.lastSelectedTabs : [];
      const json = JSON.stringify(arr, null, 2);
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(() => {
          setStatus('History copied to clipboard', 'green');
          setTimeout(() => setStatus(''), 2000);
        }).catch(err => {
          const ta = document.createElement('textarea');
          ta.value = json;
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); setStatus('History copied to clipboard', 'green'); } catch (e) { setStatus('Copy failed', 'red'); }
          document.body.removeChild(ta);
          setTimeout(() => setStatus(''), 2000);
        });
      } else {
        const ta = document.createElement('textarea');
        ta.value = json;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); setStatus('History copied to clipboard', 'green'); } catch (e) { setStatus('Copy failed', 'red'); }
        document.body.removeChild(ta);
        setTimeout(() => setStatus(''), 2000);
      }
    });
  } catch (e) {
    console.warn('exportHistory failed:', e && e.message);
    setStatus('Export failed', 'red');
  }
}

function exportToFile() {
  try {
    const arr = Array.isArray(window.__chromeAi_history) ? window.__chromeAi_history : [];
    const json = JSON.stringify(arr, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromeai-history-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatus('History downloaded', 'green');
    setTimeout(() => setStatus(''), 2000);
  } catch (e) {
    console.warn('exportToFile failed:', e && e.message);
    setStatus('Download failed', 'red');
  }
}

function filterHistory(query) {
  const arr = Array.isArray(window.__chromeAi_history) ? window.__chromeAi_history : [];
  if (!query || !query.trim()) {
    renderHistory(arr);
    return;
  }
  const q = query.trim().toLowerCase();
  const filtered = arr.filter(item => {
    const url = (item.url || '').toLowerCase();
    const reason = (item.reason || '').toLowerCase();
    const when = new Date(item.timestamp).toLocaleString().toLowerCase();
    return url.includes(q) || reason.includes(q) || when.includes(q);
  });
  renderHistory(filtered);
}

// storage change listener
if (isChromeStorageAvailable()) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.lastSelectedTab && changes.lastSelectedTab.newValue) {
      try { renderLastSelected(changes.lastSelectedTab.newValue); } catch (e) { console.warn('Failed to render lastSelected on storage change:', e && e.message); }
    }
    if (changes.lastSelectedTabs && changes.lastSelectedTabs.newValue) {
      try { renderHistory(changes.lastSelectedTabs.newValue); } catch (e) { console.warn('Failed to render history on storage change:', e && e.message); }
    }
  });
}

// DOM bindings - initialize on load
document.addEventListener('DOMContentLoaded', () => {
  restoreOptions();
  // Buttons
  const saveBtn = $('saveBtn'); if (saveBtn) saveBtn.addEventListener('click', saveOptions);
  const resetBtn = $('resetBtn'); if (resetBtn) resetBtn.addEventListener('click', restoreOptions);
  const clearBtn = $('clearLastBtn'); if (clearBtn) clearBtn.addEventListener('click', clearHistory);
  const exportBtn = $('exportHistoryBtn'); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
  const exportFileBtn = $('exportFileBtn'); if (exportFileBtn) exportFileBtn.addEventListener('click', exportToFile);
  // Live validation bindings
  ['pollTimeout','pollInterval','followStrategy','followNewTabs','followKeywords','historySize'].forEach(id => {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', validateAndToggle);
    el.addEventListener('change', validateAndToggle);
  });
  // also watch the new foreground toggle
  const fgEl = $('openInForeground'); if (fgEl) { fgEl.addEventListener('change', validateAndToggle); fgEl.addEventListener('input', validateAndToggle); }
  // initial validation run
  setTimeout(() => validateAndToggle(), 50);
  // wire search input with debounce
  const search = $('historySearch');
  if (search) {
    let t = null;
    search.addEventListener('input', (e) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => filterHistory(e.target.value), 250);
    });
  }
});

// Live validation: enable/disable save button
function validateAndToggle() {
  const timeout = parseInt($('pollTimeout').value, 10) || defaults.automationPollTimeoutMs;
  const interval = parseInt($('pollInterval').value, 10) || defaults.automationPollIntervalMs;
  const strategy = $('followStrategy') ? $('followStrategy').value : defaults.followNewTabsStrategy;
  const errors = [];
  if (timeout < 500 || timeout > 60000) errors.push('Poll timeout must be between 500 and 60000 ms');
  if (interval < 50 || interval > 5000) errors.push('Poll interval must be between 50 and 5000 ms');
  if (!['newest','first','last'].includes(strategy)) errors.push('Invalid follow strategy');
  const historySize = $('historySize') ? parseInt($('historySize').value, 10) : defaults.lastSelectedHistorySize;
  if (!Number.isNaN(historySize) && (historySize < 1 || historySize > 500)) errors.push('History size must be between 1 and 500');
  setErrors(errors);
  const saveBtn = $('saveBtn'); if (saveBtn) saveBtn.disabled = errors.length > 0;
}
