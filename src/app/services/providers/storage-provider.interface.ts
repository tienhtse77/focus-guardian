// Storage Provider Interface
// Abstraction layer for pluggable storage backends

export interface StorageProvider {
    /**
     * Get a value from storage
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value in storage
     */
    set<T>(key: string, value: T): Promise<void>;

    /**
     * Delete a key from storage
     */
    delete(key: string): Promise<void>;

    /**
     * Listen for changes from other tabs/devices (optional)
     */
    onSync?(callback: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>) => void): void;

    /**
     * Provider name for debugging
     */
    readonly name: string;
}
