/* ========================================
   Bookmark Dashboard - Main Application
   Vanilla JS, no dependencies
   ======================================== */

(function () {
  'use strict';

  /* ---------- Settings ---------- */
  const DEFAULTS = {
    theme: 'dark',
    displayMode: 'grid',
    clockEnabled: true,
    userName: 'Guest',
    backgroundImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'
  };

  const STORAGE_KEYS = {
    theme: 'bd_theme',
    displayMode: 'bd_displayMode',
    clockEnabled: 'bd_clockEnabled',
    userName: 'bd_userName',
    backgroundImage: 'bd_backgroundImage'
  };

  /* ---------- DOM Refs ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const body = document.body;
  const greetingEl = $('#greeting');
  const clockTimeEl = $('#clock-time');
  const clockDateEl = $('#clock-date');
  const clockEl = $('#clock');
  const searchInput = $('#search-input');
  const searchCount = $('#search-count');
  const bookmarksContainer = $('#bookmarks');
  const backToTopBtn = $('#back-to-top');
  const btnTheme = $('#btn-theme');
  const btnView = $('#btn-view');
  const linkSettings = $('#link-settings');
  const iconViewGrid = $('#icon-view-grid');
  const iconViewList = $('#icon-view-list');

  /* Settings panel refs */
  const settingsOverlay = $('#settings-overlay');
  const settingsPanel = $('#settings-panel');
  const settingsClose = $('#settings-close');
  const settingsForm = $('#settings-form');
  const spNameInput = $('#sp-input-name');
  const spBgInput = $('#sp-input-bg');
  const spBgPreview = $('#sp-bg-preview');
  const spBgPreviewImg = $('#sp-bg-preview-img');
  const spBtnClearBg = $('#sp-btn-clear-bg');
  const spBtnReset = $('#sp-btn-reset');
  const spToggles = $$('.sp-toggle');
  const toast = $('#toast');

  /* ---------- State ---------- */
  let settings = { ...DEFAULTS };
  let allBookmarks = [];
  let clockInterval = null;

  /* ---------- Storage Helpers ---------- */
  function loadSettings() {
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      const val = localStorage.getItem(storageKey);
      if (val !== null) {
        if (key === 'clockEnabled') {
          settings[key] = val === 'true';
        } else {
          settings[key] = val;
        }
      }
    }
  }

  function saveSetting(key, value) {
    settings[key] = value;
    localStorage.setItem(STORAGE_KEYS[key], String(value));
  }

  /* ---------- Theme ---------- */
  function applyTheme() {
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${settings.theme}`);
  }

  function toggleTheme() {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    saveSetting('theme', newTheme);
    applyTheme();
  }

  /* ---------- Display Mode ---------- */
  function applyDisplayMode() {
    bookmarksContainer.classList.remove('view-grid', 'view-list');
    bookmarksContainer.classList.add(`view-${settings.displayMode}`);

    const isGrid = settings.displayMode === 'grid';
    iconViewGrid.classList.toggle('hidden', !isGrid);
    iconViewList.classList.toggle('hidden', isGrid);
  }

  function toggleDisplayMode() {
    const newMode = settings.displayMode === 'grid' ? 'list' : 'grid';
    saveSetting('displayMode', newMode);
    applyDisplayMode();
    renderBookmarks(searchInput.value.trim());
  }

  /* ---------- Greeting ---------- */
  function updateGreeting() {
    const hour = new Date().getHours();
    let msg;

    if (hour >= 0 && hour < 5) msg = 'Good night';
    else if (hour < 12) msg = 'Good morning';
    else if (hour < 17) msg = 'Good afternoon';
    else if (hour < 22) msg = 'Good evening';
    else msg = 'Good night';

    greetingEl.textContent = `${msg}, ${settings.userName}`;
  }

  /* ---------- Clock ---------- */
  function updateClock() {
    const now = new Date();

    const timeStr = now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    clockTimeEl.textContent = timeStr;

    const dateStr = now.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    clockDateEl.textContent = dateStr;
  }

  function initClock() {
    if (settings.clockEnabled) {
      clockEl.classList.remove('hidden');
      updateClock();
      clockInterval = setInterval(updateClock, 1000);
    } else {
      clockEl.classList.add('hidden');
      if (clockInterval) clearInterval(clockInterval);
    }
  }

  /* ---------- Bookmarks ---------- */
  function getFaviconUrl(url) {
    try {
      const urlObj = new URL(url);
      return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(urlObj.origin)}&size=32`;
    } catch {
      return '';
    }
  }

  function collectFolders(nodes, depth = 0) {
    const folders = [];

    for (const node of nodes) {
      if (node.children) {
        const items = [];
        const subfolders = [];

        for (const child of node.children) {
          if (child.url && child.url.startsWith('http')) {
            items.push(child);
          } else if (child.children) {
            subfolders.push(child);
          }
        }

        if (items.length > 0) {
          folders.push({
            title: node.title || 'Bookmarks',
            items,
            depth
          });
        }

        const nested = collectFolders(subfolders, depth + 1);
        folders.push(...nested);
      }
    }

    return folders;
  }

  function filterBookmarks(folders, keyword) {
    if (!keyword) return folders;
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return folders.map(folder => ({
      ...folder,
      items: folder.items.filter(item =>
        regex.test(item.title) || regex.test(item.url)
      )
    })).filter(folder => folder.items.length > 0);
  }

  function createBookmarkElement(bookmark) {
    const isGrid = settings.displayMode === 'grid';
    const a = document.createElement('a');
    a.href = bookmark.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'bookmark-item';
    a.title = bookmark.title;

    const faviconUrl = getFaviconUrl(bookmark.url);

    if (isGrid) {
      a.innerHTML = `
        <img class="bookmark-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span class="bookmark-title">${escapeHTML(bookmark.title)}</span>
      `;
    } else {
      let hostname = '';
      try { hostname = new URL(bookmark.url).hostname; } catch {}
      a.innerHTML = `
        <img class="bookmark-favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
        <span class="bookmark-title">${escapeHTML(bookmark.title)}</span>
        <span class="bookmark-url">${escapeHTML(hostname)}</span>
      `;
    }

    return a;
  }

  function createFolderElement(folder) {
    const div = document.createElement('div');
    div.className = 'bookmark-folder';

    const header = document.createElement('div');
    header.className = 'folder-header';
    header.innerHTML = `
      <svg class="folder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      <span class="folder-name">${escapeHTML(folder.title)}</span>
      <span class="folder-count">${folder.items.length}</span>
    `;

    const children = document.createElement('div');
    children.className = 'folder-children';

    const items = document.createElement('div');
    items.className = 'folder-items';

    for (const bookmark of folder.items) {
      items.appendChild(createBookmarkElement(bookmark));
    }

    children.appendChild(items);
    div.appendChild(header);
    div.appendChild(children);

    header.addEventListener('click', () => {
      header.classList.toggle('collapsed');
      children.classList.toggle('collapsed');
    });

    return div;
  }

  function renderBookmarks(keyword = '') {
    const folders = collectFolders(allBookmarks);
    const filtered = filterBookmarks(folders, keyword);

    bookmarksContainer.innerHTML = '';

    let totalCount = 0;
    for (const folder of filtered) {
      totalCount += folder.items.length;
      bookmarksContainer.appendChild(createFolderElement(folder));
    }

    if (keyword) {
      searchCount.textContent = `${totalCount} result${totalCount !== 1 ? 's' : ''}`;
    } else {
      searchCount.textContent = '';
    }

    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <p>${keyword ? 'No bookmarks match your search' : 'No bookmarks found'}</p>
      `;
      bookmarksContainer.appendChild(empty);
    }
  }

  function loadBookmarks() {
    chrome.bookmarks.getTree((tree) => {
      allBookmarks = tree;
      renderBookmarks(searchInput.value.trim());
    });
  }

  /* ---------- Utilities ---------- */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Back to Top ---------- */
  function handleScroll() {
    const scrollY = window.scrollY;
    backToTopBtn.classList.toggle('visible', scrollY > 300);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- Background Image ---------- */
  function applyBackgroundImage() {
    const url = settings.backgroundImage;
    if (url && url.trim()) {
      body.style.backgroundImage = `url('${url.trim()}')`;
      body.classList.add('has-bg-image');
    } else {
      body.style.backgroundImage = '';
      body.classList.remove('has-bg-image');
    }
  }

  /* ---------- Settings Panel ---------- */
  let panelSettings = {};

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2000);
  }

  function updateSpBgPreview(url) {
    if (url && url.trim()) {
      spBgPreviewImg.style.backgroundImage = `url('${url.trim()}')`;
      spBgPreview.classList.add('visible');
    } else {
      spBgPreviewImg.style.backgroundImage = '';
      spBgPreview.classList.remove('visible');
    }
  }

  function syncPanelToggles() {
    spToggles.forEach(btn => {
      const key = btn.dataset.setting;
      const val = btn.dataset.value;
      btn.classList.toggle('active', String(panelSettings[key]) === val);
    });
  }

  function populatePanel() {
    panelSettings = {};
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      const val = localStorage.getItem(storageKey);
      if (val !== null) {
        panelSettings[key] = val;
      } else {
        panelSettings[key] = String(DEFAULTS[key]);
      }
    }
    spNameInput.value = panelSettings.userName || '';
    spBgInput.value = panelSettings.backgroundImage || '';
    updateSpBgPreview(panelSettings.backgroundImage);
    syncPanelToggles();
  }

  function openSettings() {
    populatePanel();
    settingsOverlay.classList.add('open');
    settingsPanel.classList.add('open');
    body.style.overflow = 'hidden';
  }

  function closeSettings() {
    settingsOverlay.classList.remove('open');
    settingsPanel.classList.remove('open');
    body.style.overflow = '';
  }

  function saveAllSettings() {
    panelSettings.userName = spNameInput.value.trim() || String(DEFAULTS.userName);
    panelSettings.backgroundImage = spBgInput.value.trim();

    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      localStorage.setItem(storageKey, panelSettings[key]);
    }

    loadSettings();
    applyTheme();
    applyBackgroundImage();
    applyDisplayMode();
    updateGreeting();
    initClock();
    renderBookmarks(searchInput.value.trim());
    showToast('Settings saved');
  }

  function resetAllSettings() {
    for (const [key] of Object.entries(STORAGE_KEYS)) {
      panelSettings[key] = String(DEFAULTS[key]);
    }
    spNameInput.value = panelSettings.userName;
    spBgInput.value = panelSettings.backgroundImage;
    updateSpBgPreview(panelSettings.backgroundImage);
    syncPanelToggles();
    showToast('Reset to defaults');
  }

  function initSettingsPanel() {
    linkSettings.addEventListener('click', openSettings);
    settingsOverlay.addEventListener('click', closeSettings);
    settingsClose.addEventListener('click', closeSettings);

    spToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.setting;
        panelSettings[key] = btn.dataset.value;
        syncPanelToggles();
      });
    });

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveAllSettings();
    });

    spBtnReset.addEventListener('click', resetAllSettings);

    spBgInput.addEventListener('input', () => {
      updateSpBgPreview(spBgInput.value.trim());
    });

    spBtnClearBg.addEventListener('click', () => {
      spBgInput.value = '';
      updateSpBgPreview('');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsPanel.classList.contains('open')) {
        closeSettings();
      }
    });
  }

  /* ---------- Search ---------- */
  let searchDebounce = null;
  function handleSearch() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderBookmarks(searchInput.value.trim());
    }, 150);
  }

  /* ---------- Init ---------- */
  function init() {
    loadSettings();
    applyTheme();
    applyBackgroundImage();
    applyDisplayMode();
    updateGreeting();
    initClock();
    loadBookmarks();

    // Event listeners
    btnTheme.addEventListener('click', toggleTheme);
    btnView.addEventListener('click', toggleDisplayMode);
    searchInput.addEventListener('input', handleSearch);
    window.addEventListener('scroll', handleScroll, { passive: true });
    backToTopBtn.addEventListener('click', scrollToTop);

    // Settings panel
    initSettingsPanel();

    // Update greeting every minute
    setInterval(updateGreeting, 60000);
  }

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
