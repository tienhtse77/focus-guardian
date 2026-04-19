// Storage Service - Refactored to use Provider Pattern
// Easy to swap between Chrome Sync, Local, or future Cloud providers

import { StorageProvider } from './providers/storage-provider.interface';
import { ChromeSyncProvider } from './providers/chrome-sync.provider';

export interface Goal {
    id: string;
    title: string;
    icon: string;
    color: string;
    sources: ContentSource[];
}

export interface ContentSource {
    type: 'rss' | 'youtube' | 'reddit';
    url: string;
}

export interface Content {
    id: string;
    goalId: string;
    title: string;
    url: string;
    thumbnail?: string;
    estimatedMin: number;
    source: string;
    consumed: boolean;
    fetchedAt: number;
}

export interface RecurrenceRule {
    type: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval: number;
    daysOfWeek?: number[];  // 0=Sun, 1=Mon, ..., 6=Sat
    dayOfMonth?: number;
    endDate?: string;  // ISO date
}

export interface TodoItem {
    id: string;
    goalId: string;
    title: string;
    isCompleted: boolean;
    createdAt: number; // epoch ms
    completedAt?: number; // epoch ms
    // If this task was spawned from a recurrence template, this points to it.
    // Templates and their spawned tasks are otherwise independent — editing/completing/
    // deleting this task never touches the template.
    templateId?: string;
    // The date this task represents (only set for template-spawned tasks).
    dueDate?: string;  // ISO date (yyyy-MM-dd)
}

export interface RecurrenceTemplate {
    id: string;
    goalId?: string;
    title: string;
    rule: RecurrenceRule;
    isActive: boolean;
    createdAt: number; // epoch ms
    // Derived on the server from task completion history.
    currentStreak: number;
    longestStreak: number;
}

export type PageStatus = 'unread' | 'viewed' | 'favorite' | 'watch-later';

export interface SavedPage {
    id: string;
    goalId: string;
    title: string;
    url: string;
    favicon?: string;
    savedAt: number;
    status: PageStatus;
}

// Default provider instance (shared across app)
const defaultProvider = new ChromeSyncProvider();

export class StorageService {
    private provider: StorageProvider;

    private readonly GOALS_KEY = 'focus_guardian_goals';
    private readonly CONTENT_KEY = 'focus_guardian_content';
    private readonly SAVED_PAGES_KEY = 'focus_guardian_saved_pages';

    constructor(provider?: StorageProvider) {
        this.provider = provider ?? defaultProvider;
    }

    // Expose provider for advanced use cases
    getProvider(): StorageProvider {
        return this.provider;
    }

    async getGoals(): Promise<Goal[]> {
        return await this.provider.get<Goal[]>(this.GOALS_KEY) || [];
    }

    async addGoal(goalData: Omit<Goal, 'id'>): Promise<Goal> {
        const goals = await this.getGoals();
        const newGoal: Goal = {
            ...goalData,
            id: crypto.randomUUID()
        };
        goals.push(newGoal);
        await this.provider.set(this.GOALS_KEY, goals);
        return newGoal;
    }

    async updateGoal(id: string, updates: Partial<Goal>): Promise<void> {
        const goals = await this.getGoals();
        const index = goals.findIndex(g => g.id === id);
        if (index !== -1) {
            goals[index] = { ...goals[index], ...updates };
            await this.provider.set(this.GOALS_KEY, goals);
        }
    }

    async deleteGoal(id: string): Promise<void> {
        const goals = await this.getGoals();
        const filtered = goals.filter(g => g.id !== id);
        await this.provider.set(this.GOALS_KEY, filtered);
    }

    async setGoals(goals: Goal[]): Promise<void> {
        await this.provider.set(this.GOALS_KEY, goals);
    }

    async getContent(goalId?: string): Promise<Content[]> {
        const content = await this.provider.get<Content[]>(this.CONTENT_KEY) || [];
        return goalId ? content.filter(c => c.goalId === goalId) : content;
    }

    async setContent(content: Content[]): Promise<void> {
        await this.provider.set(this.CONTENT_KEY, content);
    }

    async markConsumed(contentId: string): Promise<void> {
        const content = await this.getContent();
        const index = content.findIndex(c => c.id === contentId);
        if (index !== -1) {
            content[index].consumed = true;
            await this.provider.set(this.CONTENT_KEY, content);
        }
    }

    // Saved Pages methods
    async getSavedPages(goalId?: string): Promise<SavedPage[]> {
        const pages = await this.provider.get<SavedPage[]>(this.SAVED_PAGES_KEY) || [];
        return goalId ? pages.filter(p => p.goalId === goalId) : pages;
    }

    async savePage(pageData: Omit<SavedPage, 'id' | 'savedAt' | 'status'>): Promise<SavedPage> {
        const pages = await this.getSavedPages();

        // Check if URL already saved to this goal
        const existing = pages.find(p => p.url === pageData.url && p.goalId === pageData.goalId);
        if (existing) {
            return existing;
        }

        const newPage: SavedPage = {
            ...pageData,
            id: crypto.randomUUID(),
            savedAt: Date.now(),
            status: 'unread'
        };
        pages.push(newPage);
        await this.provider.set(this.SAVED_PAGES_KEY, pages);
        return newPage;
    }

    async updatePageStatus(pageId: string, status: PageStatus): Promise<void> {
        const pages = await this.getSavedPages();
        const index = pages.findIndex(p => p.id === pageId);
        if (index !== -1) {
            pages[index].status = status;
            await this.provider.set(this.SAVED_PAGES_KEY, pages);
        }
    }

    async deleteSavedPage(pageId: string): Promise<void> {
        const pages = await this.getSavedPages();
        const filtered = pages.filter(p => p.id !== pageId);
        await this.provider.set(this.SAVED_PAGES_KEY, filtered);
    }

    async bulkAddSources(goalId: string, sources: ContentSource[]): Promise<{ added: number; skipped: number }> {
        const goals = await this.getGoals();
        const index = goals.findIndex(g => g.id === goalId);
        if (index === -1) {
            return { added: 0, skipped: sources.length };
        }

        const existingUrls = new Set(goals[index].sources.map(s => s.url));
        const newSources: ContentSource[] = [];
        let skipped = 0;

        for (const source of sources) {
            if (existingUrls.has(source.url)) {
                skipped++;
            } else {
                newSources.push(source);
                existingUrls.add(source.url);
            }
        }

        goals[index].sources = [...goals[index].sources, ...newSources];
        await this.provider.set(this.GOALS_KEY, goals);

        return { added: newSources.length, skipped };
    }
}
