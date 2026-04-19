# Focus Guardian

Chrome browser extension that helps users maintain focus and productivity.

## Feature workflow — read this first

Every new UI feature or non-trivial redesign follows this pipeline. Treat it as a hard rule, not a suggestion.

1. **Mockup first.** Before writing any Angular/component code, create a standalone HTML mockup at `docs/specs/<feature-name>/mockup.html`.
   - Tailwind via CDN, Manrope/Inter/Material Symbols fonts, dark-mode toggle, the project's design tokens.
   - Must be openable directly in a browser (no server, no build step).
   - Include sample data that exercises the real states (empty, populated, completed, dark mode, etc.).
2. **Get explicit approval on the mockup.** Do not start Angular implementation until the user has seen it and said go.
3. **Implement in Angular** after approval. Verify it builds (`npm run build`) and, when practical, run the extension/dev server to smoke-test.
4. **Open a pull request** at the end of the feature. Use `gh pr create` against `main`. Summary + test plan.

If you're planning a task that skips any of these steps, stop and flag it — don't silently shortcut.

## Core Features

- **Morning Brief (Home)** — dashboard with daily quote, tasks, goal-specific todos
- **Goal Management** — goals with icons, colors, drag-and-drop reorder
- **Content Feeds** — RSS, YouTube channels, Reddit subreddits per goal
- **Task Management** — todos with recurrence (daily/weekly/monthly), streak tracking
- **Saved Pages** — bookmark pages by goal with status tracking
- **Facebook Friction** — content script showing motivational quotes on Facebook
- **Command Palette** — Ctrl+K for quick navigation and actions
- **Theme Switching** — dark/light mode with system preference detection

## Tech Stack

- **Angular 21** (standalone components, signals for state management)
- **Tailwind CSS 4** + Material Symbols icons
- **TypeScript 5.9**, **Vitest** for testing
- **Backend API**: .NET at `http://localhost:5251/api/v1`
- **Chrome Extension Manifest v3** — overrides new tab, popup for "Save to Goal"
- **Build**: Angular CLI + esbuild (content script) + custom webpack + Tailwind CLI

## Development

```bash
# Requires Node.js 20+ (use fnm or nvm)
npm install
npm run dev       # Watch build with manifest swap for extension dev
npm start         # Dev server on localhost:4200
npm run build     # Production build
npm test          # Run Vitest tests
```

The `npm run dev` script (`scripts/dev.sh`) orchestrates a dev workflow that swaps between `manifest.dev.json` (with auto-reload) and `public/manifest.json` (prod).

## Architecture

- No Redux/NgRx — uses Angular signals, API-driven state
- Provider pattern for storage abstraction (Chrome Sync vs Local Storage)
- Chrome-specific APIs: `chrome.storage`, `chrome.runtime`, `chrome.tabs`
- Content script bundled separately with esbuild as IIFE
- Prettier configured with `angular` parser for HTML templates
