import { parseOpml, parseUrlList } from './opml-parser';

describe('parseOpml', () => {
  it('should parse valid OPML with nested folders', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head><title>My Feeds</title></head>
  <body>
    <outline text="Tech" title="Tech">
      <outline text="Ars Technica" title="Ars Technica" type="rss"
        xmlUrl="https://feeds.arstechnica.com/arstechnica/technology-lab"
        htmlUrl="https://arstechnica.com" />
      <outline text="Frontend" title="Frontend">
        <outline text="CSS-Tricks" title="CSS-Tricks" type="rss"
          xmlUrl="https://css-tricks.com/feed/" />
      </outline>
    </outline>
    <outline text="Smashing Magazine" title="Smashing Magazine" type="rss"
      xmlUrl="https://www.smashingmagazine.com/feed/" />
  </body>
</opml>`;

    const feeds = parseOpml(xml);

    expect(feeds.length).toBe(3);
    expect(feeds[0]).toEqual({
      title: 'Ars Technica',
      url: 'https://feeds.arstechnica.com/arstechnica/technology-lab',
      type: 'rss'
    });
    expect(feeds[1]).toEqual({
      title: 'CSS-Tricks',
      url: 'https://css-tricks.com/feed/',
      type: 'rss'
    });
    expect(feeds[2]).toEqual({
      title: 'Smashing Magazine',
      url: 'https://www.smashingmagazine.com/feed/',
      type: 'rss'
    });
  });

  it('should skip non-RSS outline entries (no xmlUrl)', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Folder Only" title="Folder Only" />
    <outline text="Has Feed" title="Has Feed" type="rss"
      xmlUrl="https://example.com/feed.xml" />
  </body>
</opml>`;

    const feeds = parseOpml(xml);
    expect(feeds.length).toBe(1);
    expect(feeds[0].url).toBe('https://example.com/feed.xml');
  });

  it('should use text attribute as fallback when title is missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="My Blog" xmlUrl="https://myblog.com/rss" />
  </body>
</opml>`;

    const feeds = parseOpml(xml);
    expect(feeds[0].title).toBe('My Blog');
  });

  it('should use url as title when both title and text are missing', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline xmlUrl="https://myblog.com/rss" />
  </body>
</opml>`;

    const feeds = parseOpml(xml);
    expect(feeds[0].title).toBe('https://myblog.com/rss');
  });

  it('should throw on completely invalid XML', () => {
    expect(() => parseOpml('this is not xml at all <>')).toThrow();
  });

  it('should return empty array for valid XML with no feeds', () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <body>
    <outline text="Empty Folder" />
  </body>
</opml>`;

    const feeds = parseOpml(xml);
    expect(feeds.length).toBe(0);
  });
});

describe('parseUrlList', () => {
  it('should parse URLs one per line', () => {
    const text = `https://example.com/feed.xml
https://blog.example.com/rss`;

    const feeds = parseUrlList(text);
    expect(feeds.length).toBe(2);
    expect(feeds[0]).toEqual({
      title: 'https://example.com/feed.xml',
      url: 'https://example.com/feed.xml',
      type: 'rss'
    });
  });

  it('should handle blank lines and whitespace', () => {
    const text = `
  https://example.com/feed.xml

    https://blog.example.com/rss

`;

    const feeds = parseUrlList(text);
    expect(feeds.length).toBe(2);
    expect(feeds[0].url).toBe('https://example.com/feed.xml');
    expect(feeds[1].url).toBe('https://blog.example.com/rss');
  });

  it('should return empty array for empty/whitespace-only input', () => {
    expect(parseUrlList('')).toEqual([]);
    expect(parseUrlList('   \n  \n  ')).toEqual([]);
  });
});
