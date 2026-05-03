// Privacy Mode Service - covers the new tab Home with a neutral screen
// during screen-shares, so personal goals/todos aren't accidentally exposed.

import { LocalStorageProvider } from './providers/local-storage.provider';

const provider = new LocalStorageProvider();
const PRIVACY_KEY = 'focus_guardian_privacy_mode';

export class PrivacyModeService {
    private enabled = false;
    private listeners: ((enabled: boolean) => void)[] = [];

    constructor() {
        this.load();
    }

    private async load() {
        const saved = await provider.get<boolean>(PRIVACY_KEY);
        this.enabled = saved === true;
        this.notify();
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    async setEnabled(value: boolean): Promise<void> {
        this.enabled = value;
        await provider.set(PRIVACY_KEY, value);
        this.notify();
    }

    async toggle(): Promise<boolean> {
        await this.setEnabled(!this.enabled);
        return this.enabled;
    }

    onChange(callback: (enabled: boolean) => void): () => void {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(fn => fn !== callback);
        };
    }

    private notify() {
        this.listeners.forEach(fn => fn(this.enabled));
    }
}

export const privacyModeService = new PrivacyModeService();
