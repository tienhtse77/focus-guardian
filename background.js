// Listens for when a navigation is about to occur.
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  // We only care about top-level frame navigations.
  if (details.frameId === 0) {
    // Fetch the blacklist from the extension's storage.
    chrome.storage.local.get(['blacklist'], (result) => {
      const blacklist = result.blacklist || [];
      if (blacklist.length === 0) {
        return; // No need to check if the list is empty.
      }

      try {
        const url = new URL(details.url);
        const domain = url.hostname.replace('www.', '');

        const isBlacklisted = blacklist.some(item => domain.includes(item.domain));

        if (isBlacklisted) {
          console.log(`Focus Guardian: Blocking navigation to ${domain}`);
          // Redirect the user to the Focus Guardian dashboard.
          chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL('index.html')
          });
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
  }
});

// Note: You would need to create placeholder icons (icon16.png, icon48.png, icon128.png)
// for the extension to load without errors. For this exercise, we'll omit the files.
