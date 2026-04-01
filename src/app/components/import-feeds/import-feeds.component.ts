import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentSource, StorageService } from '../../services/storage.service';
import { ParsedFeed, parseOpml, parseUrlList } from '../../services/opml-parser';

type ModalState = 'input' | 'parsing' | 'preview' | 'success' | 'error-parse' | 'error-empty';

@Component({
  selector: 'app-import-feeds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import-feeds.component.html',
  styleUrl: './import-feeds.component.css'
})
export class ImportFeedsComponent {
  @Input() goalId = '';
  @Input() existingSources: ContentSource[] = [];
  @Output() imported = new EventEmitter<{ added: number; skipped: number }>();
  @Output() closed = new EventEmitter<void>();

  private storageService = new StorageService();

  state = signal<ModalState>('input');
  activeTab = signal<'opml' | 'urls'>('opml');
  isDragging = signal(false);

  // Input state
  selectedFileName = signal<string>('');
  fileContent = signal<string>('');
  urlText = signal<string>('');

  // Preview state
  parsedFeeds = signal<ParsedFeed[]>([]);
  selectedUrls = signal<Set<string>>(new Set());

  // Success state
  importResult = signal<{ added: number; skipped: number }>({ added: 0, skipped: 0 });

  // Computed: feeds that are NOT duplicates of existing sources
  selectableFeeds = computed(() => {
    const existingUrls = new Set(this.existingSources.map(s => s.url));
    return this.parsedFeeds().filter(f => !existingUrls.has(f.url));
  });

  // Computed: feeds that ARE duplicates
  duplicateFeeds = computed(() => {
    const existingUrls = new Set(this.existingSources.map(s => s.url));
    return this.parsedFeeds().filter(f => existingUrls.has(f.url));
  });

  duplicateCount = computed(() => this.duplicateFeeds().length);

  selectedCount = computed(() => this.selectedUrls().size);

  allSelected = computed(() => {
    const selectable = this.selectableFeeds();
    if (selectable.length === 0) return false;
    return selectable.every(f => this.selectedUrls().has(f.url));
  });

  canParse = computed(() => {
    if (this.activeTab() === 'opml') {
      return this.fileContent().length > 0;
    }
    return this.urlText().trim().length > 0;
  });

  close() {
    this.closed.emit();
  }

  // --- File handling ---

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const file = event.dataTransfer?.files[0];
    if (file) {
      this.readFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.readFile(file);
    }
  }

  private readFile(file: File) {
    this.selectedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      this.fileContent.set(reader.result as string);
    };
    reader.readAsText(file);
  }

  // --- Parsing ---

  onParse() {
    this.state.set('parsing');

    // Use a small delay so the spinner renders
    setTimeout(() => {
      try {
        let feeds: ParsedFeed[];

        if (this.activeTab() === 'opml') {
          feeds = parseOpml(this.fileContent());
        } else {
          feeds = parseUrlList(this.urlText());
        }

        if (feeds.length === 0) {
          this.state.set('error-empty');
          return;
        }

        this.parsedFeeds.set(feeds);

        // Pre-select all non-duplicate feeds
        const selectable = feeds.filter(
          f => !new Set(this.existingSources.map(s => s.url)).has(f.url)
        );
        this.selectedUrls.set(new Set(selectable.map(f => f.url)));

        this.state.set('preview');
      } catch {
        this.state.set('error-parse');
      }
    }, 100);
  }

  // --- Preview controls ---

  toggleSelectAll() {
    const selectable = this.selectableFeeds();
    if (this.allSelected()) {
      this.selectedUrls.set(new Set());
    } else {
      this.selectedUrls.set(new Set(selectable.map(f => f.url)));
    }
  }

  toggleFeed(url: string) {
    const current = new Set(this.selectedUrls());
    if (current.has(url)) {
      current.delete(url);
    } else {
      current.add(url);
    }
    this.selectedUrls.set(current);
  }

  // --- Import ---

  async onImport() {
    const selected = this.selectableFeeds().filter(f => this.selectedUrls().has(f.url));
    const sources: ContentSource[] = selected.map(f => ({ type: f.type, url: f.url }));

    const result = await this.storageService.bulkAddSources(this.goalId, sources);
    this.importResult.set(result);
    this.imported.emit(result);
    this.state.set('success');
  }

  // --- Helpers ---

  resetToInput() {
    this.state.set('input');
    this.fileContent.set('');
    this.selectedFileName.set('');
    this.urlText.set('');
    this.parsedFeeds.set([]);
    this.selectedUrls.set(new Set());
  }
}
