/* Shared manifest info — populates version & author across all pages */
(function () {
  'use strict';

  const manifest = chrome.runtime.getManifest();

  document.querySelectorAll('#app-version').forEach(el => {
    el.textContent = `${manifest.name} v${manifest.version}`;
  });

  document.querySelectorAll('#app-author').forEach(el => {
    el.textContent = manifest.author || '';
    if (el.tagName === 'A') {
      el.href = `https://github.com/${(manifest.author || '').toLowerCase().replace(/\s+/g, '')}/`;
    }
  });
})();
