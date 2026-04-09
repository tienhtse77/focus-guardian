import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, Content, SavedPage, PageStatus, TodoItem, RecurrenceRule } from '../../services/storage.service';
import { ContentAggregatorService } from '../../services/content-aggregator.service';
import { ApiService } from '../../services/api.service';
import { ContentCardComponent } from '../content-card/content-card.component';
import { SavedPageCardComponent } from '../saved-page-card/saved-page-card.component';
import { ImportFeedsComponent } from '../import-feeds/import-feeds.component';

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
                      <!-- Recurrence badge (clickable) -->
                      <div class="relative shrink-0">
                        @if (todo.recurrenceRule) {
                          <button (click)="toggleRecurrencePicker(todo, $event)"
                            [class]="'flex items-center gap-1 text-[10px] font-label font-semibold px-2 py-0.5 rounded-full transition-all duration-200 ' + (recurrencePickerId() === todo.id ? 'text-primary bg-primary-container' : 'text-on-surface-variant bg-surface-container hover:bg-surface-container-high')">
                            <span class="material-symbols-outlined" style="font-size: 14px;">repeat</span>
                            {{ getRecurrenceLabel(todo.recurrenceRule) }}
                          </button>
                        } @else if (!todo.isCompleted) {
                          <button (click)="toggleRecurrencePicker(todo, $event)"
                            [class]="'flex items-center gap-1 text-[10px] font-label px-2 py-0.5 rounded-full hover:bg-surface-container transition-all duration-200 ' + (recurrencePickerId() === todo.id ? 'text-primary opacity-100' : 'text-outline opacity-0 group-hover:opacity-100')">
                            <span class="material-symbols-outlined" style="font-size: 14px;">repeat</span>
                            <span>Set repeat</span>
                          </button>
                        }

                        <!-- Recurrence dropdown -->
                        @if (recurrencePickerId() === todo.id) {
                          <div class="absolute right-0 top-7 z-30 w-72 bg-surface-container-lowest rounded-xl overflow-hidden" style="box-shadow: 0 16px 48px rgba(45,52,51,0.12);">
                            <!-- Quick presets -->
                            <div class="py-2">
                              <button (click)="setRecurrence(todo, null)" class="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-3 transition-all duration-200">
                                <span class="material-symbols-outlined text-lg text-on-surface-variant">block</span>
                                <span class="flex-1">Does not repeat</span>
                                @if (!todo.recurrenceRule) { <span class="material-symbols-outlined text-sm text-primary">check</span> }
                              </button>
                              <button (click)="setRecurrence(todo, { type: 'daily', interval: 1 })"
                                [class]="'w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-all duration-200 ' + (todo.recurrenceRule?.type === 'daily' ? 'text-primary font-semibold bg-primary-container/30' : 'text-on-surface hover:bg-surface-container-low')">
                                <span class="material-symbols-outlined text-lg" [class]="todo.recurrenceRule?.type === 'daily' ? 'text-primary' : 'text-on-surface-variant'">repeat</span>
                                <span class="flex-1">Daily</span>
                                @if (todo.recurrenceRule?.type === 'daily') { <span class="material-symbols-outlined text-sm text-primary">check</span> }
                              </button>
                              <button (click)="setRecurrence(todo, { type: 'monthly', interval: 1, dayOfMonth: todayDate() })" class="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-3 transition-all duration-200">
                                <span class="material-symbols-outlined text-lg text-on-surface-variant">repeat</span>
                                <span class="flex-1">Monthly on the {{ todayDate() }}{{ ordinalSuffix(todayDate()) }}</span>
                              </button>
                            </div>

                            <!-- Day of week selector — always visible -->
                            <div class="px-4 py-3 bg-surface-container-low/50">
                              <span class="text-xs font-label text-on-surface-variant font-semibold block mb-2.5">Weekly on</span>
                              <div class="flex gap-1.5 justify-between">
                                @for (day of dayLabels; track $index) {
                                  <button (click)="toggleWeekDay(todo, $index)"
                                    [class]="'w-9 h-9 rounded-full text-xs font-label font-semibold transition-all duration-200 ' + (isDaySelected(todo, $index) ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high')">
                                    {{ day }}
                                  </button>
                                }
                              </div>
                            </div>

                            <!-- Custom interval -->
                            @if (!showCustomRecurrence()) {
                              <div class="py-2">
                                <button (click)="openCustomRecurrence(todo)" class="w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-low flex items-center gap-3 transition-all duration-200">
                                  <span class="material-symbols-outlined text-lg text-on-surface-variant">tune</span>
                                  <span class="flex-1">Every N days/weeks...</span>
                                </button>
                              </div>
                            } @else {
                              <div class="px-4 py-3 space-y-3">
                                <div class="flex items-center gap-3">
                                  <span class="text-sm text-on-surface font-medium shrink-0">Every</span>
                                  <input type="number" [(ngModel)]="customInterval" min="1"
                                    class="inline-edit w-14 px-2 py-1.5 rounded-lg text-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    style="background: var(--color-surface-container-low);" />
                                  <select [(ngModel)]="customType"
                                    class="inline-edit px-2 py-1.5 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    style="background: var(--color-surface-container-low);">
                                    <option value="day">days</option>
                                    <option value="week">weeks</option>
                                    <option value="month">months</option>
                                  </select>
                                </div>
                                <div class="flex justify-end gap-2">
                                  <button (click)="showCustomRecurrence.set(false)" class="px-3 py-1.5 text-sm text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low font-semibold transition-all duration-200">Cancel</button>
                                  <button (click)="saveCustomRecurrence(todo)" class="px-3 py-1.5 text-sm text-on-primary bg-primary rounded-lg font-semibold hover:bg-primary-dim transition-all duration-200">Save</button>
                                </div>
                              </div>
                            }
                          </div>
                        }
                      </div>
                      @if (todo.currentStreak && todo.currentStreak > 0) {
                        <span class="flex items-center gap-0.5 text-xs font-label font-bold shrink-0" style="color: #d97706;">🔥 {{ todo.currentStreak }}</span>
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
  isLoading = signal(false);
  showImportModal = signal(false);
  importMessage = signal<string>('');
  editingTodoId = signal<string | null>(null);
  recurrencePickerId = signal<string | null>(null);
  showCustomRecurrence = signal(false);
  customInterval = 1;
  customType: 'day' | 'week' | 'month' = 'week';
  customDays: boolean[] = [false, false, false, false, false, false, false]; // Sun-Sat

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
    const today = new Date().toISOString().split('T')[0];
    const items = await this.api.getTodoItems(this.goal.id, today);
    // Filter out templates — only show one-time tasks and instances
    const visible = items.filter(t => !t.isRecurringTemplate);
    visible.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return a.createdAt - b.createdAt;
    });
    this.todoItems.set(visible);
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

  getRecurrenceLabel(rule?: RecurrenceRule): string {
    if (!rule) return '';
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    switch (rule.type) {
      case 'daily':
        return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
      case 'weekly':
        if (rule.daysOfWeek?.length) {
          if (JSON.stringify([...rule.daysOfWeek].sort()) === JSON.stringify([1,2,3,4,5])) return 'Weekdays';
          return rule.daysOfWeek.map(d => dayNames[d]).join(' \u00b7 ');
        }
        return rule.interval === 1 ? 'Weekly' : `Every ${rule.interval} weeks`;
      case 'monthly':
        return rule.interval === 1 ? 'Monthly' : `Every ${rule.interval} months`;
      default:
        return rule.interval === 1 ? 'Daily' : `Every ${rule.interval} days`;
    }
  }

  // --- Recurrence picker ---
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  toggleRecurrencePicker(todo: TodoItem, event: Event) {
    event.stopPropagation();
    if (this.recurrencePickerId() === todo.id) {
      this.recurrencePickerId.set(null);
      this.showCustomRecurrence.set(false);
    } else {
      this.recurrencePickerId.set(todo.id);
      this.showCustomRecurrence.set(false);
      // Pre-fill custom form from existing rule
      if (todo.recurrenceRule) {
        this.customType = todo.recurrenceRule.type === 'monthly' ? 'month' : todo.recurrenceRule.type === 'weekly' ? 'week' : 'day';
        this.customInterval = todo.recurrenceRule.interval;
        this.customDays = [0,1,2,3,4,5,6].map(d => todo.recurrenceRule?.daysOfWeek?.includes(d) ?? false);
      } else {
        this.customType = 'week';
        this.customInterval = 1;
        this.customDays = [false, false, false, false, false, false, false];
      }
    }
  }

  async setRecurrence(todo: TodoItem, rule: RecurrenceRule | null) {
    await this.api.updateTodoItem(todo.id, { recurrenceRule: rule });
    this.recurrencePickerId.set(null);
    this.showCustomRecurrence.set(false);
    await this.loadTodoItems();
  }

  openCustomRecurrence(todo: TodoItem) {
    this.showCustomRecurrence.set(true);
  }

  async saveCustomRecurrence(todo: TodoItem) {
    const rule: RecurrenceRule = {
      type: this.customType === 'day' ? 'daily' : this.customType === 'week' ? 'weekly' : 'monthly',
      interval: this.customInterval,
    };
    if (this.customType === 'week') {
      rule.daysOfWeek = this.customDays.map((v, i) => v ? i : -1).filter(i => i >= 0);
      if (rule.daysOfWeek.length === 0) rule.daysOfWeek = [new Date().getDay()];
    }
    if (this.customType === 'month') {
      rule.dayOfMonth = new Date().getDate();
    }
    await this.setRecurrence(todo, rule);
  }

  isDaySelected(todo: TodoItem, dayIndex: number): boolean {
    return todo.recurrenceRule?.type === 'weekly' && (todo.recurrenceRule.daysOfWeek?.includes(dayIndex) ?? false);
  }

  async toggleWeekDay(todo: TodoItem, dayIndex: number) {
    const current = todo.recurrenceRule?.type === 'weekly' ? [...(todo.recurrenceRule.daysOfWeek ?? [])] : [];
    const idx = current.indexOf(dayIndex);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(dayIndex);
    }
    if (current.length === 0) {
      await this.setRecurrence(todo, null);
    } else {
      await this.setRecurrence(todo, { type: 'weekly', interval: 1, daysOfWeek: current.sort() });
    }
  }

  todayDow(): number { return new Date().getDay(); }
  todayDowName(): string { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]; }
  todayDate(): number { return new Date().getDate(); }
  ordinalSuffix(n: number): string {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
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
