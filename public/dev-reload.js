// Dev-only background script that auto-reloads the extension when files change.
// This works by polling the build output timestamp. Remove from manifest for production.
(() => {
  const POLL_INTERVAL = 1000;
  let lastTimestamp = null;

  async function checkForChanges() {
    try {
      // Fetch main.js with a cache-busting query to detect rebuilds
      const url = chrome.runtime.getURL('main.js');
      const response = await fetch(url, { cache: 'no-store' });
      const text = await response.text();
      const hash = text.length.toString();

      if (lastTimestamp === null) {
        lastTimestamp = hash;
      } else if (lastTimestamp !== hash) {
        console.log('[dev-reload] Change detected, reloading extension...');
        chrome.runtime.reload();
      }
    } catch (e) {
      // Ignore fetch errors
    }
  }

  setInterval(checkForChanges, POLL_INTERVAL);
  console.log('[dev-reload] Watching for changes...');
})();
