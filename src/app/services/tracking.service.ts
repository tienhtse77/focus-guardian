// Tracking Service for usage analytics
// Tracks time spent on goals vs distractions

export interface UsageStats {
    goalTimeSpent: { [goalId: string]: number }; // Time in seconds per goal
    facebookVisits: number;
    facebookTimeSpent: number;
    lastUpdated: number;
}

const storage = {
    async get<T>(key: string): Promise<T | null> {
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.get([key], (result: { [key: string]: T }) => {
                    resolve(result[key] ?? null);
                });
            });
        }
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },

    async set<T>(key: string, value: T): Promise<void> {
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            return new Promise((resolve) => {
                chrome.storage.sync.set({ [key]: value }, resolve);
            });
        }
        localStorage.setItem(key, JSON.stringify(value));
    }
};

export class TrackingService {
    private readonly STATS_KEY = 'focus_guardian_stats';

    async getStats(): Promise<UsageStats> {
        const stats = await storage.get<UsageStats>(this.STATS_KEY);
        return stats || {
            goalTimeSpent: {},
            facebookVisits: 0,
            facebookTimeSpent: 0,
            lastUpdated: Date.now()
        };
    }

    async trackGoalEngagement(goalId: string, seconds: number): Promise<void> {
        const stats = await this.getStats();
        stats.goalTimeSpent[goalId] = (stats.goalTimeSpent[goalId] || 0) + seconds;
        stats.lastUpdated = Date.now();
        await storage.set(this.STATS_KEY, stats);
    }

    async trackFacebookVisit(seconds: number): Promise<void> {
        const stats = await this.getStats();
        stats.facebookVisits++;
        stats.facebookTimeSpent += seconds;
        stats.lastUpdated = Date.now();
        await storage.set(this.STATS_KEY, stats);
    }

    async getComparison(): Promise<{ goalMinutes: number; facebookMinutes: number; ratio: number }> {
        const stats = await this.getStats();

        const goalMinutes = Object.values(stats.goalTimeSpent).reduce((sum, s) => sum + s, 0) / 60;
        const facebookMinutes = stats.facebookTimeSpent / 60;

        const ratio = facebookMinutes > 0 ? goalMinutes / facebookMinutes : goalMinutes > 0 ? Infinity : 0;

        return { goalMinutes, facebookMinutes, ratio };
    }
}
