import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, Content, SavedPage, PageStatus, TodoItem, RecurrenceRule, RecurrenceTemplate } from '../../services/storage.service';
import { ContentAggregatorService } from '../../services/content-aggregator.service';
import { ApiService } from '../../services/api.service';
import { ContentCardComponent } from '../content-card/content-card.component';
import { SavedPageCardComponent } from '../saved-page-card/saved-page-card.component';
import { ImportFeedsComponent } from '../import-feeds/import-feeds.component';

type TemplateRuleKind = 'daily' | 'weekdays' | 'weekly' | 'monthly';

@Component({
  selector: 'app-goal-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ContentCardComponent, SavedPageCardComponent, ImportFeedsComponent],
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

          <!-- Tasks Section (today's tasks — templates render below in their own section) -->
          @if (todoItems().length > 0) {
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">checklist</span>
                <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Tasks</h3>
                <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ completedTodoCount }} / {{ todoItems().length }}</span>
              </div>
              <div class="space-y-1">
                @for (todo of todoItems(); track todo.id) {
                  <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container group transition-all duration-200"
                    [ngClass]="editingTodoId() === todo.id ? 'ring-2 ring-primary/20 bg-surface-container' : ''"
                  >
                    <button (click)="toggleTodo(todo)" class="shrink-0 text-on-surface-variant hover:text-primary transition-all duration-200">
                      <span class="material-symbols-outlined text-xl" [class.filled]="todo.isCompleted" [class.text-primary]="todo.isCompleted">
                        {{ todo.isCompleted ? 'check_box' : 'check_box_outline_blank' }}
                      </span>
                    </button>
                    @if (editingTodoId() === todo.id) {
                      <input
                        type="text"
                        [value]="todo.title"
                        (keydown.enter)="saveTodoEdit(todo, $event)"
                        (keydown.escape)="cancelTodoEdit()"
                        (blur)="saveTodoEdit(todo, $event)"
                        class="flex-1 text-sm text-on-surface bg-transparent focus:outline-none inline-edit"
                        autofocus
                      />
                      <span class="flex items-center gap-2 text-[10px] font-label text-outline shrink-0">
                        <span class="inline-flex items-center px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-medium text-outline">&#8629; save</span>
                        <span class="inline-flex items-center px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-medium text-outline">esc</span>
                      </span>
                    } @else {
                      <span class="flex-1 text-sm cursor-text" [class]="todo.isCompleted ? 'text-on-surface-variant line-through' : 'text-on-surface'" (click)="startEditTodo(todo)">
                        {{ todo.title }}
                      </span>
                      <!-- Template-origin indicator (read-only badge) -->
                      @if (todo.templateId) {
                        <span class="flex items-center gap-1 text-[10px] font-label font-semibold px-2 py-0.5 rounded-full text-on-surface-variant bg-surface-container shrink-0">
                          <span class="material-symbols-outlined" style="font-size: 14px;">repeat</span>
                          From template
                        </span>
                      }
                    }
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

          <!-- Recurrence Templates Section -->
          <section class="space-y-4">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary text-lg">repeat</span>
              <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Recurring</h3>
              <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ activeTemplateCount }} ACTIVE</span>
              <div class="flex-1"></div>
              @if (!showTemplateForm()) {
                <button (click)="startNewTemplate()" class="flex items-center gap-1.5 text-xs font-label font-semibold text-primary hover:text-primary-dim px-3 py-1.5 rounded-lg hover:bg-primary-container/30 transition-all duration-200">
                  <span class="material-symbols-outlined text-sm">add</span>
                  New
                </button>
              }
            </div>

            <!-- New-template inline form -->
            @if (showTemplateForm()) {
              <div class="bg-surface-container-low p-4 rounded-xl space-y-3">
                <input
                  type="text"
                  [(ngModel)]="newTemplateTitle"
                  (keydown.enter)="saveNewTemplate()"
                  (keydown.escape)="cancelNewTemplate()"
                  placeholder="What should repeat? (e.g. Learn 5 vocabs)"
                  class="inline-edit w-full px-3 py-2 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  style="background: var(--color-surface-container-lowest);"
                  autofocus
                />
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-xs font-label text-on-surface-variant font-semibold">Repeats</span>
                  @for (choice of ruleChoices; track choice.kind) {
                    <button
                      (click)="newTemplateRuleKind = choice.kind"
                      [class]="'text-xs font-label font-semibold px-3 py-1.5 rounded-full transition-all duration-200 ' + (newTemplateRuleKind === choice.kind ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high')">
                      {{ choice.label }}
                    </button>
                  }
                </div>
                @if (newTemplateRuleKind === 'weekly') {
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-label text-on-surface-variant font-semibold mr-1">On</span>
                    @for (day of dayLabels; track $index) {
                      <button (click)="toggleNewTemplateDay($index)"
                        [class]="'w-8 h-8 rounded-full text-xs font-label font-semibold transition-all duration-200 ' + (newTemplateDays[$index] ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high')">
                        {{ day }}
                      </button>
                    }
                  </div>
                }
                <div class="flex justify-end gap-2">
                  <button (click)="cancelNewTemplate()" class="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container font-semibold transition-all duration-200">Cancel</button>
                  <button (click)="saveNewTemplate()" [disabled]="!newTemplateTitle.trim()" class="px-4 py-1.5 text-sm text-on-primary bg-primary rounded-lg font-semibold hover:bg-primary-dim disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">Save</button>
                </div>
              </div>
            }

            <!-- Template list -->
            @if (templates().length > 0) {
              <div class="space-y-1">
                @for (t of templates(); track t.id) {
                  <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container group transition-all duration-200"
                    [class.opacity-60]="!t.isActive">
                    <button (click)="toggleTemplateActive(t)" class="shrink-0 text-on-surface-variant hover:text-primary transition-all duration-200" [title]="t.isActive ? 'Pause this template' : 'Resume this template'">
                      <span class="material-symbols-outlined text-xl" [class.filled]="t.isActive" [class.text-primary]="t.isActive">
                        {{ t.isActive ? 'toggle_on' : 'toggle_off' }}
                      </span>
                    </button>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-on-surface truncate">{{ t.title }}</p>
                      <p class="text-[10px] font-label text-outline uppercase tracking-wider">{{ ruleLabel(t.rule) }}</p>
                    </div>
                    @if (t.currentStreak > 0) {
                      <span class="flex items-center gap-0.5 text-xs font-label font-bold shrink-0" style="color: #d97706;">🔥 {{ t.currentStreak }}</span>
                    }
                    <button (click)="deleteTemplate(t)" class="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all duration-200" title="Delete template (existing tasks stay)">
                      <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                }
              </div>
            } @else if (!showTemplateForm()) {
              <div class="text-center py-6 text-xs font-label text-outline">
                No recurring templates yet. Click "New" to define one.
              </div>
            }
          </section>

          <!-- Saved Pages Section -->
          @if (savedPages().length > 0) {
            <section class="space-y-5">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-lg">bookmark</span>
                <h3 class="text-lg font-headline font-bold text-on-surface tracking-tight">Saved Pages</h3>
                <span class="text-xs font-label font-bold text-primary bg-primary-container px-2 py-1 rounded">{{ savedPages().length }} PAGES</span>
              </div>
              <div class="space-y-0">
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
  templates = signal<RecurrenceTemplate[]>([]);
  isLoading = signal(false);
  showImportModal = signal(false);
  importMessage = signal<string>('');
  editingTodoId = signal<string | null>(null);

  // --- Template form state ---
  showTemplateForm = signal(false);
  newTemplateTitle = '';
  newTemplateRuleKind: TemplateRuleKind = 'daily';
  newTemplateDays: boolean[] = [false, true, false, false, false, false, false]; // default Mon
  readonly dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  readonly ruleChoices: { kind: TemplateRuleKind; label: string }[] = [
    { kind: 'daily', label: 'Daily' },
    { kind: 'weekdays', label: 'Weekdays' },
    { kind: 'weekly', label: 'Weekly' },
    { kind: 'monthly', label: 'Monthly' },
  ];

  async ngOnInit() {
    await this.loadContent();
    await this.loadSavedPages();
    await this.loadTodoItems();
    await this.loadTemplates();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['goal'] && !changes['goal'].firstChange) {
      await this.loadContent();
      await this.loadSavedPages();
      await this.loadTodoItems();
      await this.loadTemplates();
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
    const today = new Date().toISOString().split('T')[0];
    const items = await this.api.getTodoItems(this.goal.id, today);
    items.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.createdAt - b.createdAt;
    });
    this.todoItems.set(items);
  }

  async loadTemplates() {
    const all = await this.api.getRecurrenceTemplates(this.goal.id);
    // Active first, then inactive. Within each, by createdAt ascending.
    all.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
    this.templates.set(all);
  }

  get activeTemplateCount(): number {
    return this.templates().filter(t => t.isActive).length;
  }

  async toggleTodo(item: TodoItem) {
    await this.api.updateTodoItem(item.id, { isCompleted: !item.isCompleted });
    await this.loadTodoItems();
    // Streak is derived from task completions, so template list may now show updated streaks.
    await this.loadTemplates();
  }

  async deleteTodo(item: TodoItem) {
    await this.api.deleteTodoItem(item.id);
    await this.loadTodoItems();
    await this.loadTemplates();
  }

  get completedTodoCount(): number {
    return this.todoItems().filter(t => t.isCompleted).length;
  }

  startEditTodo(todo: TodoItem) {
    this.editingTodoId.set(todo.id);
  }

  private editCancelled = false;

  cancelTodoEdit() {
    this.editCancelled = true;
    this.editingTodoId.set(null);
  }

  async saveTodoEdit(todo: TodoItem, event: Event) {
    if (this.editCancelled) {
      this.editCancelled = false;
      return;
    }
    const input = event.target as HTMLInputElement;
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== todo.title) {
      await this.api.updateTodoItem(todo.id, { title: newTitle });
      await this.loadTodoItems();
    }
    this.editingTodoId.set(null);
  }

  // --- Templates ---

  startNewTemplate() {
    this.newTemplateTitle = '';
    this.newTemplateRuleKind = 'daily';
    this.newTemplateDays = [false, false, false, false, false, false, false];
    this.newTemplateDays[new Date().getDay()] = true;
    this.showTemplateForm.set(true);
  }

  cancelNewTemplate() {
    this.showTemplateForm.set(false);
  }

  toggleNewTemplateDay(index: number) {
    this.newTemplateDays[index] = !this.newTemplateDays[index];
  }

  async saveNewTemplate() {
    const title = this.newTemplateTitle.trim();
    if (!title) return;
    const rule = this.buildNewTemplateRule();
    await this.api.createRecurrenceTemplate(this.goal.id, title, rule);
    this.showTemplateForm.set(false);
    await this.loadTemplates();
    await this.loadTodoItems(); // A task may have been spawned for today.
  }

  private buildNewTemplateRule(): RecurrenceRule {
    switch (this.newTemplateRuleKind) {
      case 'daily':
        return { type: 'daily', interval: 1 };
      case 'weekdays':
        return { type: 'weekly', interval: 1, daysOfWeek: [1, 2, 3, 4, 5] };
      case 'weekly': {
        const days = this.newTemplateDays
          .map((v, i) => (v ? i : -1))
          .filter(i => i >= 0);
        return {
          type: 'weekly',
          interval: 1,
          daysOfWeek: days.length > 0 ? days : [new Date().getDay()],
        };
      }
      case 'monthly':
        return { type: 'monthly', interval: 1, dayOfMonth: new Date().getDate() };
    }
  }

  async toggleTemplateActive(t: RecurrenceTemplate) {
    await this.api.updateRecurrenceTemplate(t.id, { isActive: !t.isActive });
    await this.loadTemplates();
  }

  async deleteTemplate(t: RecurrenceTemplate) {
    if (!confirm(`Delete "${t.title}"? Tasks already spawned from it will stay.`)) return;
    await this.api.deleteRecurrenceTemplate(t.id);
    await this.loadTemplates();
  }

  ruleLabel(rule: RecurrenceRule): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    switch (rule.type) {
      case 'daily':
        return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
      case 'weekly':
        if (rule.daysOfWeek?.length) {
          if (JSON.stringify([...rule.daysOfWeek].sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Weekdays';
          return rule.daysOfWeek.map(d => dayNames[d]).join(' \u00b7 ');
        }
        return rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`;
      case 'monthly':
        return `Monthly on the ${rule.dayOfMonth ?? new Date().getDate()}${this.ordinalSuffix(rule.dayOfMonth ?? new Date().getDate())}`;
      default:
        return 'Custom';
    }
  }

  ordinalSuffix(n: number): string {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  // --- Content / other existing bits ---

  async refreshContent() {
    if (!this.goal.sources || this.goal.sources.length === 0) return;

    this.isLoading.set(true);
    try {
      const newContent = await this.contentAggregator.fetchContentForGoal(
        this.goal.id,
        this.goal.sources
      );

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
