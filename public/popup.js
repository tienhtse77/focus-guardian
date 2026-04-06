// Popup Script - Save Page to Goal (API-backed)

const API_BASE = 'http://localhost:5251/api/v1';

// DOM Elements
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('content');
const noGoalsEl = document.getElementById('no-goals');
const faviconEl = document.getElementById('favicon');
const pageTitleEl = document.getElementById('page-title');
const pageUrlEl = document.getElementById('page-url');
const goalSelectEl = document.getElementById('goal-select');
const saveBtnEl = document.getElementById('save-btn');
const statusEl = document.getElementById('status');

let currentTab = null;

// Initialize popup
async function init() {
    try {
        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        currentTab = tab;

        // Display page info
        const url = new URL(tab.url);
        faviconEl.src = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`;
        faviconEl.onerror = () => { faviconEl.src = ''; };
        pageTitleEl.textContent = tab.title || 'Untitled Page';
        pageUrlEl.textContent = url.hostname + url.pathname;

        // Load goals from API
        const response = await fetch(`${API_BASE}/goals`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        const goals = await response.json();

        if (!goals || goals.length === 0) {
            loadingEl.classList.add('hidden');
            noGoalsEl.classList.remove('hidden');
            return;
        }

        // Populate goal selector
        goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = `${goal.icon} ${goal.title}`;
            goalSelectEl.appendChild(option);
        });

        loadingEl.classList.add('hidden');
        contentEl.classList.remove('hidden');

    } catch (error) {
        console.error('Error initializing popup:', error);
        loadingEl.classList.add('hidden');
        showStatus('Could not connect to Focus Guardian API', 'error');
    }
}

// Handle goal selection
goalSelectEl.addEventListener('change', () => {
    saveBtnEl.disabled = !goalSelectEl.value;
});

// Handle save
saveBtnEl.addEventListener('click', async () => {
    if (!goalSelectEl.value || !currentTab) return;

    saveBtnEl.disabled = true;
    saveBtnEl.textContent = 'Saving...';

    try {
        const url = new URL(currentTab.url);

        // Save page via API
        const response = await fetch(`${API_BASE}/goals/${goalSelectEl.value}/saved-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: currentTab.title || 'Untitled',
                url: currentTab.url,
                favicon: currentTab.favIconUrl || `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=32`,
            }),
        });

        if (response.status === 409) {
            showStatus('Page already saved to this goal', 'success');
            saveBtnEl.textContent = 'Save to Goal';
            saveBtnEl.disabled = false;
            return;
        }

        if (!response.ok) throw new Error(`API error: ${response.status}`);

        showStatus('Page saved successfully!', 'success');
        saveBtnEl.textContent = 'Saved ✓';

        // Close popup after brief delay
        setTimeout(() => window.close(), 1500);

    } catch (error) {
        console.error('Error saving page:', error);
        showStatus('Failed to save page', 'error');
        saveBtnEl.textContent = 'Save to Goal';
        saveBtnEl.disabled = false;
    }
});

function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
}

// Initialize
init();
