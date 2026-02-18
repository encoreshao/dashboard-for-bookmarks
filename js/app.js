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
    userName: 'Guest',
    backgroundImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80'
  };

  const STORAGE_KEYS = {
    theme: 'bd_theme',
    displayMode: 'bd_displayMode',
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
  const iconThemeDark = $('#icon-theme-dark');
  const iconThemeLight = $('#icon-theme-light');
  const iconViewGrid = $('#icon-view-grid');
  const iconViewList = $('#icon-view-list');

  /* Folder sidebar refs */
  const folderSidebar = $('#folder-sidebar');
  const folderSidebarTrigger = $('#folder-sidebar-trigger');
  const folderSidebarList = $('#folder-sidebar-list');
  const folderSidebarSearch = $('#folder-sidebar-search');

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

  /* ---------- Storage Helpers ---------- */
  function loadSettings() {
    for (const [key, storageKey] of Object.entries(STORAGE_KEYS)) {
      const val = localStorage.getItem(storageKey);
      if (val !== null) {
        settings[key] = val;
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

    const isDark = settings.theme === 'dark';
    iconThemeDark.classList.toggle('hidden', !isDark);
    iconThemeLight.classList.toggle('hidden', isDark);
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
    updateClock();
    setInterval(updateClock, 1000);
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

  /* ---------- Custom Confirm Dialog ---------- */
  const confirmOverlay = $('#confirm-overlay');
  const confirmDialog = $('#confirm-dialog');
  const confirmTitle = $('#confirm-title');
  const confirmMessage = $('#confirm-message');
  const confirmOk = $('#confirm-ok');
  const confirmCancel = $('#confirm-cancel');
  let confirmResolver = null;

  function showConfirm(title, message) {
    return new Promise((resolve) => {
      confirmResolver = resolve;
      confirmTitle.textContent = title;
      confirmMessage.textContent = message;
      confirmOverlay.classList.add('open');
      confirmDialog.classList.add('open');
      body.style.overflow = 'hidden';
      confirmOk.focus();
    });
  }

  function closeConfirm(result) {
    confirmOverlay.classList.remove('open');
    confirmDialog.classList.remove('open');
    body.style.overflow = '';
    if (confirmResolver) {
      confirmResolver(result);
      confirmResolver = null;
    }
  }

  confirmOk.addEventListener('click', () => closeConfirm(true));
  confirmCancel.addEventListener('click', () => closeConfirm(false));
  confirmOverlay.addEventListener('click', () => closeConfirm(false));

  function removeBookmark(id) {
    chrome.bookmarks.remove(id, () => {
      loadBookmarks();
      showToast('Bookmark removed');
    });
  }

  function createBookmarkElement(bookmark) {
    const isGrid = settings.displayMode === 'grid';
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-item-wrapper';

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

    const btnRemove = document.createElement('button');
    btnRemove.className = 'bookmark-remove';
    btnRemove.title = 'Remove bookmark';
    btnRemove.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>';
    btnRemove.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const ok = await showConfirm('Remove bookmark?', bookmark.title);
      if (ok) removeBookmark(bookmark.id);
    });

    wrapper.appendChild(a);
    wrapper.appendChild(btnRemove);
    return wrapper;
  }

  function createFolderElement(folder, index) {
    const div = document.createElement('div');
    div.className = 'bookmark-folder';
    div.id = `folder-${index}`;

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
    filtered.forEach((folder, i) => {
      totalCount += folder.items.length;
      bookmarksContainer.appendChild(createFolderElement(folder, i));
    });

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

    buildFolderSidebar(filtered);
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
  const BG_PRESETS = [
    { url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80', label: 'Starry Mountains' },
    { url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80', label: 'Tropical Beach' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80', label: 'Forest Path' },
    { url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1920&q=80', label: 'Northern Lights' },
    { url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80', label: 'Desert Dunes' },
    { url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', label: 'Mountain Peak' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80', label: 'Foggy Valley' },
    { url: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?w=1920&q=80', label: 'Purple Sky' },
    { url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?w=1920&q=80', label: 'Lake Reflection' },
    { url: 'https://images.unsplash.com/photo-1500534314263-a834e5e29c8e?w=1920&q=80', label: 'Sunset Ridge' },
  ];

  const spBgGallery = $('#sp-bg-gallery');

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

  function buildBgGallery() {
    BG_PRESETS.forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sp-bg-thumb';
      btn.dataset.url = preset.url;
      btn.title = preset.label;
      btn.style.backgroundImage = `url('${preset.url.replace('w=1920', 'w=200')}')`;
      btn.addEventListener('click', () => selectBgPreset(preset.url));
      spBgGallery.appendChild(btn);
    });
  }

  function selectBgPreset(url) {
    spBgInput.value = url;
    updateSpBgPreview(url);
    syncBgGalleryActive(url);
  }

  function syncBgGalleryActive(url) {
    spBgGallery.querySelectorAll('.sp-bg-thumb').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.url === (url || ''));
    });
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
    syncBgGalleryActive(panelSettings.backgroundImage || '');
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
    syncBgGalleryActive(panelSettings.backgroundImage || '');
    showToast('Reset to defaults');
  }

  function initSettingsPanel() {
    buildBgGallery();

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
      const val = spBgInput.value.trim();
      updateSpBgPreview(val);
      syncBgGalleryActive(val);
    });

    spBtnClearBg.addEventListener('click', () => {
      selectBgPreset('');
    });

    spBgGallery.querySelector('.sp-bg-thumb-none').addEventListener('click', () => {
      selectBgPreset('');
    });
  }

  /* ---------- Folder Sidebar ---------- */
  let sidebarFolders = [];

  function buildFolderSidebar(folders) {
    sidebarFolders = folders;
    folderSidebarSearch.value = '';
    renderSidebarList('');
  }

  function renderSidebarList(keyword) {
    folderSidebarList.innerHTML = '';
    const regex = keyword
      ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

    let hasMatch = false;

    sidebarFolders.forEach((folder, i) => {
      if (regex && !regex.test(folder.title)) return;
      hasMatch = true;

      const li = document.createElement('li');
      li.className = 'folder-sidebar-item';
      li.dataset.target = `folder-${i}`;
      li.innerHTML = `
        <span class="folder-sidebar-item-name">${escapeHTML(folder.title)}</span>
        <span class="folder-sidebar-item-count">${folder.items.length}</span>
      `;

      li.addEventListener('click', () => {
        const target = document.getElementById(`folder-${i}`);
        if (target) {
          const topbarHeight = 56;
          const y = target.getBoundingClientRect().top + window.scrollY - topbarHeight - 12;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });

      folderSidebarList.appendChild(li);
    });

    if (!hasMatch) {
      const empty = document.createElement('li');
      empty.className = 'folder-sidebar-empty';
      empty.textContent = 'No folders found';
      folderSidebarList.appendChild(empty);
    }
  }

  function updateActiveSidebarItem() {
    const items = folderSidebarList.querySelectorAll('.folder-sidebar-item');
    if (items.length === 0) return;

    const topbarHeight = 56;
    const threshold = topbarHeight + 40;
    let activeIndex = 0;

    items.forEach((item, i) => {
      item.classList.remove('active');
      const target = document.getElementById(item.dataset.target);
      if (target && target.getBoundingClientRect().top <= threshold) {
        activeIndex = i;
      }
    });

    items[activeIndex].classList.add('active');
  }

  function initFolderSidebar() {
    folderSidebarTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      folderSidebar.classList.toggle('pinned');
    });

    document.addEventListener('click', (e) => {
      if (folderSidebar.classList.contains('pinned') && !folderSidebar.contains(e.target)) {
        folderSidebar.classList.remove('pinned');
      }
    });

    folderSidebarSearch.addEventListener('input', () => {
      renderSidebarList(folderSidebarSearch.value.trim());
    });

    window.addEventListener('scroll', updateActiveSidebarItem, { passive: true });
  }

  /* ---------- Search ---------- */
  let searchDebounce = null;
  function handleSearch() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      renderBookmarks(searchInput.value.trim());
    }, 150);
  }

  /* ---------- Keyboard Shortcuts ---------- */
  const kbdOverlay = $('#kbd-overlay');
  const kbdModal = $('#kbd-modal');
  const kbdClose = $('#kbd-modal-close');

  function openShortcutsModal() {
    kbdOverlay.classList.add('open');
    kbdModal.classList.add('open');
  }

  function closeShortcutsModal() {
    kbdOverlay.classList.remove('open');
    kbdModal.classList.remove('open');
  }

  function isTyping() {
    const tag = document.activeElement?.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable;
  }

  function initKeyboardShortcuts() {
    $('#btn-shortcuts').addEventListener('click', openShortcutsModal);
    kbdOverlay.addEventListener('click', closeShortcutsModal);
    kbdClose.addEventListener('click', closeShortcutsModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (confirmDialog.classList.contains('open')) {
          closeConfirm(false);
          return;
        }
        if (kbdModal.classList.contains('open')) {
          closeShortcutsModal();
          return;
        }
        if (settingsPanel.classList.contains('open')) {
          closeSettings();
          return;
        }
        if (folderSidebar.classList.contains('pinned')) {
          folderSidebar.classList.remove('pinned');
          return;
        }
        if (document.activeElement === searchInput) {
          searchInput.value = '';
          searchInput.blur();
          renderBookmarks();
          return;
        }
        return;
      }

      if (isTyping()) return;

      if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        searchInput.focus();
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        kbdModal.classList.contains('open') ? closeShortcutsModal() : openShortcutsModal();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 't':
          toggleTheme();
          break;
        case 'v':
          toggleDisplayMode();
          break;
        case 's':
          e.preventDefault();
          settingsPanel.classList.contains('open') ? closeSettings() : openSettings();
          break;
        case 'f':
          folderSidebar.classList.toggle('pinned');
          break;
        case 'home':
          e.preventDefault();
          scrollToTop();
          break;
      }
    });
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

    // Folder sidebar
    initFolderSidebar();

    // Settings panel
    initSettingsPanel();

    // Keyboard shortcuts
    initKeyboardShortcuts();

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
