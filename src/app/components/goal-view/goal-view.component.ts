import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal, Content, SavedPage, PageStatus, TodoItem } from '../../services/storage.service';
import { ContentAggregatorService } from '../../services/content-aggregator.service';
import { ApiService } from '../../services/api.service';
import { ContentCardComponent } from '../content-card/content-card.component';
import { SavedPageCardComponent } from '../saved-page-card/saved-page-card.component';
import { ImportFeedsComponent } from '../import-feeds/import-feeds.component';

@Component({
  selector: 'app-goal-view',
  standalone: true,
  imports: [CommonModule, ContentCardComponent, SavedPageCardComponent, ImportFeedsComponent],
  styles: [`:host { display: contents; }`],
  template: `
    <div class="max-w-7xl mx-auto">
      <!-- Import success toast -->
      @if (importMessage()) {
        <div class="mb-6 px-5 py-3 bg-primary-container text-on-primary-container text-sm rounded-xl text-center font-label font-semibold">
          {{ importMessage() }}
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Left Column: Main Content -->
        <div class="lg:col-span-8 space-y-12">

          <!-- Goal Header -->
          <section class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ goal.icon }}</span>
              <div>
                <h1 class="text-3xl font-headline font-extrabold text-on-surface tracking-tight">{{ goal.title }}</h1>
                <p class="text-sm text-on-surface-variant font-light mt-1">Curated content for your goal</p>
              </div>
            </div>
            <div class="flex items-center gap-4 mt-2">
              <button (click)="editClicked.emit()" class="flex items-center gap-2 text-sm text-on-surface-variant hover:text-primary font-label px-3 py-1.5 rounded-lg hover:bg-surface-container-low transition-all duration-200">
                <span class="material-symbols-outlined text-lg">edit</span>
                Edit Goal
              </button>
              <button (click)="confirmDelete()" class="flex items-center gap-2 text-sm text-on-surface-variant hover:text-error font-label px-3 py-1.5 rounded-lg hover:bg-error-container/20 transition-all duration-200">
                <span class="material-symbols-outlined text-lg">delete</span>
                Delete
              </button>
            </div>
          </section>

          <!-- Tasks Section -->
          @if (todoItems().length > 0) {
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">checklist</span>
                <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Tasks</h3>
                <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ completedTodoCount }} / {{ todoItems().length }}</span>
              </div>
              <div class="space-y-1">
                @for (todo of todoItems(); track todo.id) {
                  <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low group transition-all duration-200">
                    <button (click)="toggleTodo(todo)" class="shrink-0 text-on-surface-variant hover:text-primary transition-all duration-200">
                      <span class="material-symbols-outlined text-xl" [class.filled]="todo.isCompleted" [class.text-primary]="todo.isCompleted">
                        {{ todo.isCompleted ? 'check_box' : 'check_box_outline_blank' }}
                      </span>
                    </button>
                    <span class="flex-1 text-sm" [class]="todo.isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'">
                      {{ todo.title }}
                    </span>
                    <button (click)="deleteTodo(todo)" class="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all duration-200">
                      <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                }
              </div>
              @if (completedTodoCount === todoItems().length && todoItems().length > 0) {
                <div class="flex items-center gap-2 px-3 py-2 text-primary">
                  <span class="material-symbols-outlined text-sm filled">celebration</span>
                  <span class="text-xs font-label font-semibold">All tasks done!</span>
                </div>
              }
            </section>
          }

          <!-- Saved Pages Section -->
          @if (savedPages().length > 0) {
            <section class="space-y-5">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">bookmark</span>
                <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Saved Pages</h3>
                <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ savedPages().length }} PAGES</span>
              </div>
              <div class="space-y-2">
                @for (page of savedPages(); track page.id) {
                  <app-saved-page-card
                    [page]="page"
                    (statusChanged)="onPageStatusChange(page, $event)"
                    (deleted)="onPageDelete(page)"
                  />
                }
              </div>
            </section>
          }

          <!-- Curated Content Section -->
          @if (goal.sources && goal.sources.length > 0) {
            <section class="space-y-6">
              <div class="flex justify-between items-end">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                  <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Curated Content</h3>
                </div>
                <button
                  (click)="refreshContent()"
                  [disabled]="isLoading()"
                  class="flex items-center gap-2 text-sm font-label text-primary font-semibold hover:text-primary-dim disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-primary-container/30 transition-all duration-200"
                >
                  <span class="material-symbols-outlined text-sm" [class.animate-spin]="isLoading()">refresh</span>
                  {{ isLoading() ? 'Fetching...' : 'Refresh' }}
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                @for (item of content(); track item.id) {
                  <app-content-card
                    [content]="item"
                    (clicked)="onContentClick(item)"
                  />
                } @empty {
                  <div class="col-span-2 text-center py-8">
                    <span class="material-symbols-outlined text-outline text-3xl mb-3 block">article</span>
                    <p class="text-on-surface-variant text-sm">Click "Refresh" to fetch articles from your sources</p>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Empty State: No pages and no sources -->
          @if (savedPages().length === 0 && (!goal.sources || goal.sources.length === 0)) {
            <div class="bg-tertiary-container rounded-lg p-10 editorial-shadow relative overflow-hidden text-center">
              <span class="material-symbols-outlined absolute top-6 right-8 text-6xl text-tertiary opacity-10 rotate-12">spa</span>
              <div class="relative z-10">
                <span class="material-symbols-outlined text-primary text-3xl mb-3 block">library_books</span>
                <p class="text-on-tertiary-container font-headline font-bold text-lg mb-2">No saved pages or content sources</p>
                <p class="text-sm text-on-tertiary-fixed-variant leading-relaxed">
                  Click the extension icon on any webpage to save it here,<br>or edit this goal to add RSS/YouTube/Reddit sources.
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Right Column: Sidebar Info -->
        <div class="lg:col-span-4">
          <div class="sticky top-28 space-y-8">

            <!-- Content Sources Card -->
            @if (goal.sources && goal.sources.length > 0) {
              <div class="bg-surface-container-low p-6 rounded-lg space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-headline font-bold text-on-surface">Content Sources</h3>
                  <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ goal.sources.length }} FEEDS</span>
                </div>
                <div class="space-y-3">
                  @for (source of goal.sources; track source.url) {
                    <div class="flex items-center gap-3">
                      <div class="w-7 h-7 rounded-full bg-surface-container-lowest flex items-center justify-center">
                        @switch (source.type) {
                          @case ('youtube') {
                            <span class="material-symbols-outlined text-error text-sm">play_circle</span>
                          }
                          @case ('reddit') {
                            <span class="material-symbols-outlined text-tertiary text-sm">forum</span>
                          }
                          @default {
                            <span class="material-symbols-outlined text-primary text-sm">rss_feed</span>
                          }
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-on-surface truncate">{{ source.url }}</p>
                        <p class="text-[10px] font-label text-outline uppercase tracking-widest">{{ source.type }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Import Feeds Button -->
            <button
              (click)="showImportModal.set(true)"
              class="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-sm tracking-wide editorial-shadow flex items-center justify-center gap-2 hover:bg-primary-dim tonal-lift"
            >
              <span class="material-symbols-outlined text-sm">upload</span>
              Import Feeds
            </button>

            <!-- Editor's Tip -->
            <div class="bg-tertiary-container p-6 rounded-lg relative overflow-hidden">
              <span class="material-symbols-outlined absolute top-4 right-4 text-5xl text-tertiary opacity-10 rotate-12">format_quote</span>
              <div class="flex items-start gap-3 relative z-10">
                <span class="material-symbols-outlined text-primary filled">lightbulb</span>
                <div>
                  <h4 class="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-tertiary-container mb-2">Editor's Tip</h4>
                  <p class="text-sm text-on-tertiary-fixed-variant leading-relaxed">
                    @if (savedPages().length > 0) {
                      You've saved {{ savedPages().length }} pages. Consider reviewing them during your peak focus hours.
                    } @else {
                      Save pages while browsing to build your curated reading list for this goal.
                    }
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
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

  private api = inject(ApiService);
  private contentAggregator = new ContentAggregatorService();

  content = signal<Content[]>([]);
  savedPages = signal<SavedPage[]>([]);
  todoItems = signal<TodoItem[]>([]);
  isLoading = signal(false);
  showImportModal = signal(false);
  importMessage = signal<string>('');

  async ngOnInit() {
    await this.loadContent();
    await this.loadSavedPages();
    await this.loadTodoItems();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['goal'] && !changes['goal'].firstChange) {
      await this.loadContent();
      await this.loadSavedPages();
      await this.loadTodoItems();
    }
  }

  async loadContent() {
    const items = await this.api.getContent(this.goal.id);
    this.content.set(items.filter(c => !c.consumed).slice(0, 4));
  }

  async loadSavedPages() {
    const pages = await this.api.getSavedPages(this.goal.id);
    pages.sort((a, b) => {
      if (a.status === 'favorite' && b.status !== 'favorite') return -1;
      if (b.status === 'favorite' && a.status !== 'favorite') return 1;
      return b.savedAt - a.savedAt;
    });
    this.savedPages.set(pages);
  }

  async loadTodoItems() {
    const items = await this.api.getTodoItems(this.goal.id);
    items.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.createdAt - b.createdAt;
    });
    this.todoItems.set(items);
  }

  async toggleTodo(item: TodoItem) {
    await this.api.updateTodoItem(item.id, { isCompleted: !item.isCompleted });
    await this.loadTodoItems();
  }

  async deleteTodo(item: TodoItem) {
    await this.api.deleteTodoItem(item.id);
    await this.loadTodoItems();
  }

  get completedTodoCount(): number {
    return this.todoItems().filter(t => t.isCompleted).length;
  }

  async refreshContent() {
    if (!this.goal.sources || this.goal.sources.length === 0) return;

    this.isLoading.set(true);
    try {
      const newContent = await this.contentAggregator.fetchContentForGoal(
        this.goal.id,
        this.goal.sources
      );

      // POST each fetched item to the API
      for (const item of newContent) {
        try {
          await this.api.createContent(this.goal.id, {
            title: item.title,
            url: item.url,
            thumbnail: item.thumbnail,
            estimatedMin: item.estimatedMin,
            source: item.source,
          });
        } catch (err) {
          console.error('Failed to save content item:', err);
        }
      }

      await this.loadContent();
    } catch (error) {
      console.error('Failed to refresh content:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onContentClick(item: Content) {
    await this.api.markConsumed(item.id);
    window.open(item.url, '_blank');
    await this.loadContent();
  }

  async onPageStatusChange(page: SavedPage, status: PageStatus) {
    await this.api.updatePageStatus(page.id, status);
    await this.loadSavedPages();
  }

  async onPageDelete(page: SavedPage) {
    await this.api.deleteSavedPage(page.id);
    await this.loadSavedPages();
  }

  async onFeedsImported(result: { added: number; skipped: number }) {
    if (result.added > 0) {
      const goals = await this.api.getGoals();
      const updated = goals.find(g => g.id === this.goal.id);
      if (updated) {
        this.goal.sources = updated.sources;
      }
      await this.loadContent();

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
