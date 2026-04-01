// Local Storage Provider
// Uses localStorage for development/testing, or chrome.storage.local for device-specific data

import { StorageProvider } from './storage-provider.interface';

export class LocalStorageProvider implements StorageProvider {
    readonly name = 'local';

    async get<T>(key: string): Promise<T | null> {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.get([key], (result: { [key: string]: T }) => {
                    resolve(result[key] ?? null);
                });
            });
        }
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    async set<T>(key: string, value: T): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [key]: value }, resolve);
            });
        }
        localStorage.setItem(key, JSON.stringify(value));
    }

    async delete(key: string): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage?.local) {
            return new Promise((resolve) => {
                chrome.storage.local.remove(key, resolve);
            });
        }
        localStorage.removeItem(key);
    }
}
