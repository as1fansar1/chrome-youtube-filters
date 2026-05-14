// Per-channel rule engine + savings counter.
//
// Exposes a single global, `window.FitnessRules`, so content.js can stay
// untouched apart from one call when it hides a video. All state lives in
// chrome.storage (rules in `sync`, stats in `local`).
//
// Rule shape:
//   { channelName: string | "*",  filterType: "shorts" | "minDuration" | "keyword",
//     value: string | number }
//
// Stats shape (chrome.storage.local key `stats`):
//   { hiddenThisWeek, hiddenAllTime, estimatedTimeSavedMin, weekStart }

(function () {
  'use strict';

  const RULES_KEY = 'filterRules';
  const STATS_KEY = 'stats';
  const MINUTES_SAVED_PER_HIDE = 8; // reasonable YouTube-watch-time average
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  let cachedRules = [];
  let rulesLoaded = false;

  function emptyStats() {
    return {
      hiddenThisWeek: 0,
      hiddenAllTime: 0,
      estimatedTimeSavedMin: 0,
      weekStart: new Date().toISOString(),
    };
  }

  function maybeRollWeek(stats) {
    const weekStart = new Date(stats.weekStart || 0).getTime();
    if (!weekStart || Date.now() - weekStart > WEEK_MS) {
      stats.hiddenThisWeek = 0;
      stats.weekStart = new Date().toISOString();
    }
    return stats;
  }

  async function loadRules() {
    try {
      const result = await chrome.storage.sync.get([RULES_KEY]);
      cachedRules = Array.isArray(result[RULES_KEY]) ? result[RULES_KEY] : [];
    } catch (err) {
      console.error('[FitnessRules] failed to load rules', err);
      cachedRules = [];
    }
    rulesLoaded = true;
    return cachedRules;
  }

  async function saveRules(rules) {
    cachedRules = rules;
    await chrome.storage.sync.set({ [RULES_KEY]: rules });
  }

  function getRules() {
    return cachedRules;
  }

  // Parse common YouTube duration overlays like "12:34" or "1:02:30" into
  // total minutes. Returns null if not parseable.
  function parseDurationToMin(text) {
    if (!text) return null;
    const m = String(text).trim().match(/^(\d+):(\d{1,2})(?::(\d{2}))?$/);
    if (!m) return null;
    const a = parseInt(m[1], 10);
    const b = parseInt(m[2], 10);
    const c = m[3] ? parseInt(m[3], 10) : null;
    if (c !== null) return a * 60 + b + c / 60; // h:mm:ss
    return a + b / 60; // m:ss
  }

  /**
   * Decide whether a video element should be hidden based on the user's rules.
   * @param {{channel: string, title: string, durationText?: string, isShort?: boolean}} ctx
   * @returns {boolean}
   */
  function shouldHide(ctx) {
    const rules = cachedRules;
    if (!rules || rules.length === 0) return false;
    const channel = (ctx.channel || '').toLowerCase();
    const title = (ctx.title || '').toLowerCase();
    const durationMin = parseDurationToMin(ctx.durationText);

    for (const rule of rules) {
      if (!rule || !rule.filterType) continue;
      const target = (rule.channelName || '*').toLowerCase();
      if (target !== '*' && target !== channel) continue;

      switch (rule.filterType) {
        case 'shorts':
          if (ctx.isShort) return true;
          break;
        case 'minDuration': {
          const min = Number(rule.value);
          if (Number.isFinite(min) && durationMin !== null && durationMin < min) return true;
          break;
        }
        case 'keyword': {
          const kw = String(rule.value || '').toLowerCase().trim();
          if (kw && (title.includes(kw) || channel.includes(kw))) return true;
          break;
        }
      }
    }
    return false;
  }

  /**
   * Record a hide. Increments weekly + all-time counters and rolls the
   * weekly window if it's gone stale.
   */
  async function recordHide() {
    try {
      const result = await chrome.storage.local.get([STATS_KEY]);
      const stats = maybeRollWeek(result[STATS_KEY] || emptyStats());
      stats.hiddenThisWeek += 1;
      stats.hiddenAllTime += 1;
      stats.estimatedTimeSavedMin += MINUTES_SAVED_PER_HIDE;
      await chrome.storage.local.set({ [STATS_KEY]: stats });
    } catch (err) {
      console.error('[FitnessRules] failed to record hide', err);
    }
  }

  async function getStats() {
    try {
      const result = await chrome.storage.local.get([STATS_KEY]);
      return maybeRollWeek(result[STATS_KEY] || emptyStats());
    } catch (err) {
      console.error('[FitnessRules] failed to read stats', err);
      return emptyStats();
    }
  }

  async function resetStats() {
    await chrome.storage.local.set({ [STATS_KEY]: emptyStats() });
  }

  // Kick off rule loading immediately so content.js can call shouldHide
  // right after page load without an explicit await.
  loadRules();
  // Stay fresh when the user edits rules in the Options page.
  if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes[RULES_KEY]) {
        cachedRules = Array.isArray(changes[RULES_KEY].newValue)
          ? changes[RULES_KEY].newValue
          : [];
      }
    });
  }

  window.FitnessRules = {
    loadRules,
    saveRules,
    getRules,
    shouldHide,
    recordHide,
    getStats,
    resetStats,
    parseDurationToMin,
    MINUTES_SAVED_PER_HIDE,
    isReady: () => rulesLoaded,
  };
})();
