// Theme Service - Manages dark/light mode preference

import { LocalStorageProvider } from './providers/local-storage.provider';

export type ThemeMode = 'light' | 'dark' | 'system';

const provider = new LocalStorageProvider();
const THEME_KEY = 'focus_guardian_theme';

export class ThemeService {
    private currentTheme: ThemeMode = 'system';
    private listeners: ((isDark: boolean) => void)[] = [];

    constructor() {
        this.loadTheme();
    }

    private async loadTheme() {
        const saved = await provider.get<ThemeMode>(THEME_KEY);
        this.currentTheme = saved || 'system';
        this.applyTheme();
    }

    getTheme(): ThemeMode {
        return this.currentTheme;
    }

    async setTheme(mode: ThemeMode): Promise<void> {
        this.currentTheme = mode;
        await provider.set(THEME_KEY, mode);
        this.applyTheme();
    }

    async toggleTheme(): Promise<ThemeMode> {
        const isDark = this.isDarkMode();
        const newMode: ThemeMode = isDark ? 'light' : 'dark';
        await this.setTheme(newMode);
        return newMode;
    }

    isDarkMode(): boolean {
        if (this.currentTheme === 'system') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return this.currentTheme === 'dark';
    }

    private applyTheme() {
        const isDark = this.isDarkMode();

        if (isDark) {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Notify listeners
        this.listeners.forEach(fn => fn(isDark));
    }

    onChange(callback: (isDark: boolean) => void): () => void {
        this.listeners.push(callback);
        // Return unsubscribe function
        return () => {
            this.listeners = this.listeners.filter(fn => fn !== callback);
        };
    }
}

// Singleton instance
export const themeService = new ThemeService();
