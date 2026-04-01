import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal, Content, SavedPage, PageStatus, StorageService } from '../../services/storage.service';
import { ContentAggregatorService } from '../../services/content-aggregator.service';
import { ContentCardComponent } from '../content-card/content-card.component';
import { SavedPageCardComponent } from '../saved-page-card/saved-page-card.component';
import { ImportFeedsComponent } from '../import-feeds/import-feeds.component';

@Component({
  selector: 'app-goal-view',
  standalone: true,
  imports: [CommonModule, ContentCardComponent, SavedPageCardComponent, ImportFeedsComponent],
  template: `
    <div class="max-w-2xl w-full">
      <!-- Import success toast -->
      @if (importMessage()) {
        <div class="mb-4 px-4 py-2 bg-green-50 text-green-700 text-sm rounded-lg text-center">
          {{ importMessage() }}
        </div>
      }

      <!-- Goal Title -->
      <div class="text-center mb-8">
        <h1 class="text-5xl font-serif text-gray-800 mb-2 tracking-tight">
          {{ goal.title }}
        </h1>
        <p class="text-gray-400 text-sm">Curated content for your goal</p>
      </div>
      
      <!-- Saved Pages Section -->
      @if (savedPages().length > 0) {
        <div class="mb-10">
          <h3 class="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            Saved Pages ({{ savedPages().length }})
          </h3>
          <div class="space-y-2">
            @for (page of savedPages(); track page.id) {
              <app-saved-page-card
                [page]="page"
                (statusChanged)="onPageStatusChange(page, $event)"
                (deleted)="onPageDelete(page)"
              />
            }
          </div>
        </div>
      }
      
      <!-- Curated Content Section -->
      @if (goal.sources && goal.sources.length > 0) {
        <div class="text-center">
          <div class="flex items-center justify-center gap-2 mb-4">
            <h3 class="text-sm font-medium text-gray-500">Curated Content</h3>
            <button 
              (click)="refreshContent()"
              [disabled]="isLoading()"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all disabled:opacity-50"
            >
              <svg width="12" height="12" class="shrink-0" [class.animate-spin]="isLoading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              {{ isLoading() ? 'Fetching...' : 'Refresh' }}
            </button>
          </div>
          
          <div class="flex gap-4 justify-center flex-wrap">
            @for (item of content(); track item.id) {
              <app-content-card
                [content]="item"
                (clicked)="onContentClick(item)"
              />
            } @empty {
              <div class="text-gray-400 py-4 text-sm">
                Click "Refresh" to fetch articles from your sources
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Empty State -->
      @if (savedPages().length === 0 && (!goal.sources || goal.sources.length === 0)) {
        <div class="text-center text-gray-400 py-8">
          <p class="mb-4">No saved pages or content sources</p>
          <p class="text-sm">Click the extension icon on any webpage to save it here,<br>or edit this goal to add RSS/YouTube/Reddit sources.</p>
        </div>
      }
      
      <!-- Edit/Delete Actions -->
      <div class="mt-12 flex gap-4 justify-center">
        <button
          (click)="showImportModal.set(true)"
          class="inline-flex items-center gap-1 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
          title="Import RSS feeds"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Import Feeds
        </button>
        <button
          (click)="editClicked.emit()"
          class="px-4 py-2 text-sm text-gray-500 hover:text-indigo-500 transition-colors"
        >
          Edit Goal
        </button>
        <button
          (click)="confirmDelete()"
          class="px-4 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>

      <!-- Import Feeds Modal -->
      @if (showImportModal()) {
        <app-import-feeds
          [goalId]="goal.id"
          [existingSources]="goal.sources || []"
          (imported)="onFeedsImported($event)"
          (closed)="showImportModal.set(false)"
        />
      }
    </div>
  `
})
export class GoalViewComponent implements OnInit, OnChanges {
  @Input() goal!: Goal;
  @Output() editClicked = new EventEmitter<void>();
  @Output() deleteClicked = new EventEmitter<void>();

  private storageService = new StorageService();
  private contentAggregator = new ContentAggregatorService();

  content = signal<Content[]>([]);
  savedPages = signal<SavedPage[]>([]);
  isLoading = signal(false);
  showImportModal = signal(false);
  importMessage = signal<string>('');

  async ngOnInit() {
    await this.loadContent();
    await this.loadSavedPages();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['goal'] && !changes['goal'].firstChange) {
      await this.loadContent();
      await this.loadSavedPages();
    }
  }

  async loadContent() {
    const items = await this.storageService.getContent(this.goal.id);
    this.content.set(items.filter(c => !c.consumed).slice(0, 4));
  }

  async loadSavedPages() {
    const pages = await this.storageService.getSavedPages(this.goal.id);
    // Sort: favorites first, then by saved date (newest first)
    pages.sort((a, b) => {
      if (a.status === 'favorite' && b.status !== 'favorite') return -1;
      if (b.status === 'favorite' && a.status !== 'favorite') return 1;
      return b.savedAt - a.savedAt;
    });
    this.savedPages.set(pages);
  }

  async refreshContent() {
    if (!this.goal.sources || this.goal.sources.length === 0) return;

    this.isLoading.set(true);
    try {
      const newContent = await this.contentAggregator.fetchContentForGoal(
        this.goal.id,
        this.goal.sources
      );

      const allContent = await this.storageService.getContent();
      const otherContent = allContent.filter(c => c.goalId !== this.goal.id);
      const updatedContent = [...otherContent, ...newContent];

      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        await chrome.storage.sync.set({ focus_guardian_content: updatedContent });
      } else {
        localStorage.setItem('focus_guardian_content', JSON.stringify(updatedContent));
      }

      await this.loadContent();
    } catch (error) {
      console.error('Failed to refresh content:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onContentClick(item: Content) {
    await this.storageService.markConsumed(item.id);
    window.open(item.url, '_blank');
    await this.loadContent();
  }

  async onPageStatusChange(page: SavedPage, status: PageStatus) {
    await this.storageService.updatePageStatus(page.id, status);
    await this.loadSavedPages();
  }

  async onPageDelete(page: SavedPage) {
    await this.storageService.deleteSavedPage(page.id);
    await this.loadSavedPages();
  }

  async onFeedsImported(result: { added: number; skipped: number }) {
    if (result.added > 0) {
      // Reload the goal to pick up new sources
      const goals = await this.storageService.getGoals();
      const updated = goals.find(g => g.id === this.goal.id);
      if (updated) {
        // Mutate the input goal so parent can see changes
        this.goal.sources = updated.sources;
      }
      await this.loadContent();

      // Show brief message
      this.importMessage.set(`${result.added} feeds imported`);
      setTimeout(() => this.importMessage.set(''), 3000);
    }
  }

  confirmDelete() {
    if (confirm(`Delete "${this.goal.title}"? This cannot be undone.`)) {
      this.deleteClicked.emit();
    }
  }
}
