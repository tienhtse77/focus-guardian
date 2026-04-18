#!/usr/bin/env node
// Dev script: swaps in the dev manifest (with auto-reload service worker),
// runs watch build, and restores the production manifest on exit.
// Cross-platform replacement for dev.sh.

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PROJECT_DIR = path.resolve(__dirname, '..');
const PROD_MANIFEST = path.join(PROJECT_DIR, 'public', 'manifest.json');
const DEV_MANIFEST = path.join(PROJECT_DIR, 'manifest.dev.json');
const BACKUP_MANIFEST = path.join(PROJECT_DIR, 'public', 'manifest.json.bak');
const MAIN_JS = path.join(PROJECT_DIR, 'dist', 'browser', 'main.js');

const isWindows = process.platform === 'win32';

if (!fs.existsSync(path.join(PROJECT_DIR, 'node_modules'))) {
    console.error('[dev] node_modules not found. Run `npm install` first.');
    process.exit(1);
}

let ngProcess = null;
let watchTimer = null;
let cleanedUp = false;

function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;

    if (watchTimer) {
        clearInterval(watchTimer);
        watchTimer = null;
    }

    if (ngProcess && !ngProcess.killed) {
        try {
            if (isWindows) {
                spawn('taskkill', ['/pid', ngProcess.pid, '/f', '/t']);
            } else {
                ngProcess.kill('SIGTERM');
            }
        } catch {}
    }

    if (fs.existsSync(BACKUP_MANIFEST)) {
        fs.copyFileSync(BACKUP_MANIFEST, PROD_MANIFEST);
        fs.unlinkSync(BACKUP_MANIFEST);
        console.log('');
        console.log('[dev] Restored production manifest.');
    }
}

process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });
process.on('uncaughtException', (err) => {
    console.error(err);
    cleanup();
    process.exit(1);
});

// Swap in dev manifest
fs.copyFileSync(PROD_MANIFEST, BACKUP_MANIFEST);
fs.copyFileSync(DEV_MANIFEST, PROD_MANIFEST);
console.log('[dev] Using dev manifest (auto-reload enabled).');
console.log('[dev] Load extension from: dist/browser/');
console.log('');

function runCommand(cmd, args, opts = {}) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {
            cwd: PROJECT_DIR,
            shell: true,
            stdio: 'ignore',
            ...opts,
        });
        child.on('close', () => resolve());
        child.on('error', () => resolve());
    });
}

async function buildExtras() {
    await runCommand('npx', [
        'esbuild',
        'src/content-script/facebook-interceptor.ts',
        '--bundle',
        '--outfile=dist/browser/content-script.js',
        '--format=iife',
    ]);

    try {
        fs.copyFileSync(
            path.join(PROJECT_DIR, 'src', 'content-script', 'content-script.css'),
            path.join(PROJECT_DIR, 'dist', 'browser', 'content-script.css'),
        );
    } catch {}

    await runCommand('npx', [
        '@tailwindcss/cli',
        '-i', 'src/styles.css',
        '-o', 'dist/browser/styles.css',
        '--content', '"src/**/*.{html,ts}"',
    ]);
}

let lastMtime = 0;
let building = false;

function watchExtras() {
    watchTimer = setInterval(async () => {
        if (building) return;
        if (!fs.existsSync(MAIN_JS)) return;

        const mtime = fs.statSync(MAIN_JS).mtimeMs;
        if (mtime === lastMtime) return;

        lastMtime = mtime;
        building = true;
        try {
            await buildExtras();
            console.log('[dev] Content script rebuilt.');
        } finally {
            building = false;
        }
    }, 1000);
}

watchExtras();

console.log('[dev] Starting watch mode...');
ngProcess = spawn('npx', ['ng', 'build', '--watch', '--configuration', 'development'], {
    cwd: PROJECT_DIR,
    shell: true,
    stdio: 'inherit',
});

ngProcess.on('close', (code) => {
    cleanup();
    process.exit(code ?? 0);
});
