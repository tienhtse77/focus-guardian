# focus-guardian — Import RSS Feeds

## Tasks

### OPML Parser Utility
- [x] Create `services/opml-parser.ts`
  - `parseOpml(xmlString: string): ParsedFeed[]` — parse OPML XML, flatten nested outlines
  - `parseUrlList(text: string): ParsedFeed[]` — split by newlines, trim, filter blanks
  - `ParsedFeed` interface: `{ title: string, url: string, type: 'rss' }`
  - Handle nested `<outline>` folders (flatten)
  - Skip non-RSS outline entries (no xmlUrl attribute)
  - Throw on completely invalid XML

### Import Component
- [x] Create `components/import-feeds/import-feeds.component.ts`
  - Modal dialog with two tabs: "Upload OPML" / "Paste URLs"
  - OPML tab: drag-and-drop file zone + file input, reads File as text
  - URLs tab: textarea input
  - Parse on submit → show preview
  - Preview: feed list with checkboxes, select/deselect all
  - Duplicate detection: compare against goal's existing sources by URL
  - Duplicates shown greyed out with "Already added" badge
  - Footer shows selected count + "Import N Feeds" button
  - Success/error states after import
  - Emits: `imported` event with count summary, `closed` event

### Goal View Integration
- [x] Add import button (upload icon) to goal-view header in `components/goal-view/goal-view.component.ts`
- [x] Toggle import modal visibility via signal
- [x] On `imported` event: reload goal sources, show brief toast/message

### Storage Integration
- [x] Add `bulkAddSources(goalId, sources[])` method to `storage.service.ts`
  - Append new ContentSource entries to goal's sources array
  - Save updated goal
  - Return { added, skipped } counts

### Tests
- [x] Unit test: parseOpml — valid OPML with nested folders
- [x] Unit test: parseOpml — invalid XML throws
- [x] Unit test: parseUrlList — handles blank lines, whitespace
- [ ] Unit test: ImportFeedsComponent — file upload triggers parse
- [ ] Unit test: ImportFeedsComponent — duplicate detection works

## Notes
- OPML parsing uses DOMParser (already available in browser context)
- For now, storage is local (chrome.storage.sync). API bulk endpoint integration comes later when frontend connects to API.
- Mockup at docs/specs/import-rss-feeds/mockup.html — match all states
