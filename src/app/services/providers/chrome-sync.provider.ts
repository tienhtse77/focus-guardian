// Chrome Sync Storage Provider
// Uses chrome.storage.sync for cross-device syncing within same browser

import { StorageProvider } from './storage-provider.interface';

export class ChromeSyncProvider implements StorageProvider {
    readonly name = 'chrome-sync';

    async get<T>(key: string): Promise<T | null> {
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.get([key], (result: { [key: string]: T }) => {
                    resolve(result[key] ?? null);
                });
            });
        }
        // Fallback to localStorage for development
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.set({ [key]: value }, resolve);
            });
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    async delete(key: string): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.remove(key, resolve);
            });
        }
        localStorage.removeItem(key);
    }

    onSync(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void {
        if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
            chrome.storage.onChanged.addListener((changes, areaName) => {
                if (areaName === 'sync') {
                    callback(changes);
                }
            });
        }
    }
}
