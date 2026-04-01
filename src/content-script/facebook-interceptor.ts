// Facebook Friction Content Script
// This runs on facebook.com pages

const QUOTES = [
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "It's not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
    { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Starve your distractions, feed your focus.", author: "Unknown" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" }
];

interface FrictionState {
    visitCount: number;
    totalTimeSpent: number;
    lastVisit: number;
    todayVisits: number;
    todayDate: string;
}

async function getState(): Promise<FrictionState> {
    const today = new Date().toDateString();
    const defaultState: FrictionState = {
        visitCount: 0,
        totalTimeSpent: 0,
        lastVisit: 0,
        todayVisits: 0,
        todayDate: today
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
            chrome.storage.local.get(['frictionState'], (result: { [key: string]: FrictionState }) => {
                const state: FrictionState = result['frictionState'] || defaultState;
                // Reset today's visits if it's a new day
                if (state.todayDate !== today) {
                    state.todayVisits = 0;
                    state.todayDate = today;
                }
                resolve(state);
            });
        });
    }
    return defaultState;
}

async function setState(state: FrictionState): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ frictionState: state }, resolve);
        });
    }
}

function createOverlay(state: FrictionState): HTMLElement {
    const overlay = document.createElement('div');
    overlay.id = 'focus-guardian-overlay';

    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const visitLevel = state.todayVisits;

    let content: string;
    let autoCloseDelay: number | null = null;

    if (visitLevel === 0) {
        // First visit: Simple quote with 2s timer
        autoCloseDelay = 2000;
        content = `
      <div class="fg-card">
        <blockquote class="fg-quote">"${quote.text}"</blockquote>
        <cite class="fg-author">— ${quote.author}</cite>
        <div class="fg-timer">
          <div class="fg-timer-bar" style="animation-duration: 2s;"></div>
          <span class="fg-timer-text">2s</span>
        </div>
      </div>
    `;
    } else if (visitLevel === 1) {
        // Second visit: Quick break question
        content = `
      <div class="fg-card">
        <h2 class="fg-heading">Quick break?</h2>
        <p class="fg-subtitle">You've already visited Facebook today. Maybe take a moment?</p>
        <div class="fg-actions">
          <button class="fg-btn fg-btn-secondary" data-action="timer">Set 5 min timer</button>
          <button class="fg-btn fg-btn-primary" data-action="continue">Continue anyway</button>
        </div>
      </div>
    `;
    } else {
        // Third+ visit: Stats + task completion
        content = `
      <div class="fg-card">
        <h2 class="fg-heading">Hold on...</h2>
        <div class="fg-stats">
          <div class="fg-stat">
            <span class="fg-stat-value">${state.todayVisits + 1}</span>
            <span class="fg-stat-label">visits today</span>
          </div>
          <div class="fg-stat">
            <span class="fg-stat-value">${Math.round(state.totalTimeSpent / 60)}m</span>
            <span class="fg-stat-label">total time</span>
          </div>
        </div>
        <p class="fg-subtitle">Consider spending time on your goals instead.</p>
        <div class="fg-actions">
          <button class="fg-btn fg-btn-secondary" data-action="goals">View my goals</button>
          <button class="fg-btn fg-btn-ghost" data-action="continue">I understand, continue</button>
        </div>
      </div>
    `;
    }

    overlay.innerHTML = content;

    // Event handlers
    setTimeout(() => {
        overlay.querySelectorAll('[data-action]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const action = (e.target as HTMLElement).dataset['action'];
                if (action === 'continue' || action === 'timer') {
                    closeOverlay();
                } else if (action === 'goals') {
                    window.open(chrome.runtime.getURL('index.html'), '_blank');
                    closeOverlay();
                }
            });
        });
    }, 0);

    // Auto-close for first visit
    if (autoCloseDelay) {
        setTimeout(closeOverlay, autoCloseDelay);
    }

    return overlay;
}

function closeOverlay(): void {
    const overlay = document.getElementById('focus-guardian-overlay');
    if (overlay) {
        overlay.classList.add('fg-closing');
        setTimeout(() => overlay.remove(), 200);
    }
}

async function init(): Promise<void> {
    // Don't run in iframes
    if (window.top !== window.self) return;

    const state = await getState();

    // Update state
    state.visitCount++;
    state.todayVisits++;
    state.lastVisit = Date.now();
    await setState(state);

    // Create and show overlay
    const overlay = createOverlay(state);
    document.body.appendChild(overlay);

    // Track time spent
    const startTime = Date.now();
    window.addEventListener('beforeunload', async () => {
        const timeSpent = (Date.now() - startTime) / 1000;
        state.totalTimeSpent += timeSpent;
        await setState(state);
    });
}

// Run when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
