import { Content, ContentSource, StorageService } from './storage.service';

// RSS Feed Parser
async function parseRSS(url: string): Promise<Partial<Content>[]> {
    try {
        // Extensions with host_permissions bypass CORS, no proxy needed
        const response = await fetch(url);
        const text = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');

        const items = doc.querySelectorAll('item, entry');
        const results: Partial<Content>[] = [];

        items.forEach((item, index) => {
            if (index >= 5) return; // Limit to 5 items

            const title = item.querySelector('title')?.textContent || 'Untitled';
            const link = item.querySelector('link')?.textContent ||
                item.querySelector('link')?.getAttribute('href') || '';
            const description = item.querySelector('description, summary, content')?.textContent || '';

            // Estimate reading time (avg 200 words per minute)
            const wordCount = description.split(/\s+/).length;
            const estimatedMin = Math.max(1, Math.round(wordCount / 200));

            // Try to extract thumbnail
            const mediaContent = item.querySelector('media\\:thumbnail, media\\:content, enclosure');
            const thumbnail = mediaContent?.getAttribute('url') || undefined;

            results.push({
                title: title.trim(),
                url: link.trim(),
                thumbnail,
                estimatedMin,
                source: 'rss'
            });
        });

        return results;
    } catch (error) {
        console.error('RSS parsing error:', error);
        return [];
    }
}

// YouTube Channel/Playlist Feed Parser
async function parseYouTube(channelOrPlaylistUrl: string): Promise<Partial<Content>[]> {
    try {
        // Extract channel ID or handle from URL
        const urlMatch = channelOrPlaylistUrl.match(/(?:channel\/|@|user\/)([^\/\?]+)/);
        if (!urlMatch) return [];

        const identifier = urlMatch[1];

        // YouTube provides RSS feeds for channels
        const feedUrl = identifier.startsWith('UC')
            ? `https://www.youtube.com/feeds/videos.xml?channel_id=${identifier}`
            : `https://www.youtube.com/feeds/videos.xml?user=${identifier}`;

        // Extensions with host_permissions bypass CORS, no proxy needed
        const response = await fetch(feedUrl);
        const text = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/xml');

        const entries = doc.querySelectorAll('entry');
        const results: Partial<Content>[] = [];

        entries.forEach((entry, index) => {
            if (index >= 5) return;

            const title = entry.querySelector('title')?.textContent || 'Untitled';
            const videoId = entry.querySelector('yt\\:videoId')?.textContent;
            const link = videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
            const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : undefined;

            results.push({
                title: title.trim(),
                url: link,
                thumbnail,
                estimatedMin: 10, // Default video length estimate
                source: 'youtube'
            });
        });

        return results;
    } catch (error) {
        console.error('YouTube parsing error:', error);
        return [];
    }
}

// Reddit Subreddit Feed Parser
async function parseReddit(subredditUrl: string): Promise<Partial<Content>[]> {
    try {
        // Extract subreddit name from URL
        const match = subredditUrl.match(/r\/([^\/\?]+)/);
        if (!match) return [];

        const subreddit = match[1];
        const jsonUrl = `https://www.reddit.com/r/${subreddit}/top.json?limit=5&t=week`;

        const response = await fetch(jsonUrl);
        const data = await response.json();

        const results: Partial<Content>[] = [];

        data.data?.children?.forEach((child: { data: { title: string; permalink: string; thumbnail: string; selftext: string; is_video: boolean } }) => {
            const post = child.data;

            // Estimate reading time based on self text
            const wordCount = (post.selftext || '').split(/\s+/).length;
            const estimatedMin = Math.max(2, Math.round(wordCount / 200));

            const thumbnail = post.thumbnail?.startsWith('http') ? post.thumbnail : undefined;

            results.push({
                title: post.title,
                url: `https://www.reddit.com${post.permalink}`,
                thumbnail,
                estimatedMin: post.is_video ? 5 : estimatedMin,
                source: 'reddit'
            });
        });

        return results;
    } catch (error) {
        console.error('Reddit parsing error:', error);
        return [];
    }
}

export class ContentAggregatorService {
    private storageService = new StorageService();
    private readonly LAST_FETCH_KEY = 'focus_guardian_last_fetch';

    async fetchContentForGoal(goalId: string, sources: ContentSource[]): Promise<Content[]> {
        const allContent: Content[] = [];

        for (const source of sources) {
            let items: Partial<Content>[] = [];

            switch (source.type) {
                case 'rss':
                    items = await parseRSS(source.url);
                    break;
                case 'youtube':
                    items = await parseYouTube(source.url);
                    break;
                case 'reddit':
                    items = await parseReddit(source.url);
                    break;
            }

            // Convert to full Content objects
            items.forEach(item => {
                allContent.push({
                    id: crypto.randomUUID(),
                    goalId,
                    title: item.title || 'Untitled',
                    url: item.url || '',
                    thumbnail: item.thumbnail,
                    estimatedMin: item.estimatedMin || 5,
                    source: item.source || source.type,
                    consumed: false,
                    fetchedAt: Date.now()
                });
            });
        }

        return allContent;
    }

    async refreshAllContent(): Promise<void> {
        const goals = await this.storageService.getGoals();
        const allContent: Content[] = [];

        for (const goal of goals) {
            if (goal.sources && goal.sources.length > 0) {
                const content = await this.fetchContentForGoal(goal.id, goal.sources);
                allContent.push(...content);
            }
        }

        // Store all fetched content
        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            await chrome.storage.sync.set({
                focus_guardian_content: allContent,
                [this.LAST_FETCH_KEY]: Date.now()
            });
        } else {
            localStorage.setItem('focus_guardian_content', JSON.stringify(allContent));
            localStorage.setItem(this.LAST_FETCH_KEY, Date.now().toString());
        }
    }

    async shouldRefresh(): Promise<boolean> {
        let lastFetch = 0;

        if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
            const result = await new Promise<{ [key: string]: number }>((resolve) => {
                chrome.storage.sync.get([this.LAST_FETCH_KEY], (res: { [key: string]: number }) => resolve(res));
            });
            lastFetch = result[this.LAST_FETCH_KEY] || 0;
        } else {
            lastFetch = parseInt(localStorage.getItem(this.LAST_FETCH_KEY) || '0', 10);
        }

        // Refresh if more than 24 hours have passed
        const oneDayMs = 24 * 60 * 60 * 1000;
        return Date.now() - lastFetch > oneDayMs;
    }
}
