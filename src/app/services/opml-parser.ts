export interface ParsedFeed {
    title: string;
    url: string;
    type: 'rss';
}

/**
 * Parse an OPML XML string into a flat list of RSS feeds.
 * Handles nested <outline> folders by flattening them.
 * Skips non-RSS entries (outlines without xmlUrl).
 * Throws on completely invalid XML.
 */
export function parseOpml(xmlString: string): ParsedFeed[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parse errors
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
        throw new Error('Invalid XML: the file could not be parsed as OPML.');
    }

    const feeds: ParsedFeed[] = [];
    const outlines = doc.querySelectorAll('outline');

    outlines.forEach(outline => {
        const xmlUrl = outline.getAttribute('xmlUrl');
        if (!xmlUrl) return; // Skip folder outlines or non-RSS entries

        const title = outline.getAttribute('title')
            || outline.getAttribute('text')
            || xmlUrl;

        feeds.push({
            title: title.trim(),
            url: xmlUrl.trim(),
            type: 'rss'
        });
    });

    return feeds;
}

/**
 * Parse a plain-text list of URLs (one per line) into ParsedFeed objects.
 * Trims whitespace, filters blank lines.
 */
export function parseUrlList(text: string): ParsedFeed[] {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(url => ({
            title: url,
            url,
            type: 'rss' as const
        }));
}
