import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal, TodoItem, RecurrenceTemplate } from '../../services/storage.service';
import { ApiService } from '../../services/api.service';

interface TaskRow {
  id: string;
  templateId?: string;
  title: string;
  isCompleted: boolean;
  goalIcon?: string;
  streak: number;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function atStartOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayDiff(a: Date, b: Date): number {
  return Math.round((atStartOfDay(a).getTime() - atStartOfDay(b).getTime()) / 86400000);
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-home">
      @if (goals.length === 0 && !loading()) {
        <div class="empty-shell">
          <p class="tiny-label">Today</p>
          <h1 class="date-hero">{{ heroDate() }}</h1>
          <p class="greeting">{{ greeting() }}</p>
          <p class="empty-hint">No goals yet — add one from the sidebar to start tracking.</p>
        </div>
      } @else {
        <!-- Hero -->
        <section class="hero">
          <p class="tiny-label">{{ dayLabel() }}</p>
          <h1 class="date-hero">{{ heroDate() }}</h1>
          @if (greeting()) {
            <p class="greeting">{{ greeting() }}</p>
          }
        </section>

        <!-- The List -->
        <section class="list-section">
          <div class="list-head">
            <h2 class="tiny-label">The List</h2>
            <span class="done-count">{{ doneCountLabel() }}</span>
          </div>

          @if (currentTasks().length === 0) {
            <p class="empty-line">{{ emptyText() }}</p>
          } @else {
            <div class="task-list" [attr.data-day]="currentKey()">
              @for (task of currentTasks(); track task.id; let i = $index) {
                <div class="task-row" [style.animation-delay.ms]="i * 20">
                  <button
                    class="check"
                    [class.done]="task.isCompleted"
                    [disabled]="!isToday()"
                    (click)="toggle(task)"
                    [attr.aria-label]="task.isCompleted ? 'Mark incomplete' : 'Mark complete'"
                  >
                    @if (task.isCompleted) {
                      <span class="material-symbols-outlined check-icon">check</span>
                    }
                  </button>
                  <span class="task-title" [class.done]="task.isCompleted">{{ task.title }}</span>
                  @if (task.goalIcon) {
                    <span class="task-goal">{{ task.goalIcon }}</span>
                  }
                  @if (task.streak > 0) {
                    <span class="task-streak" [class.done]="task.isCompleted">
                      <span class="material-symbols-outlined streak-icon">local_fire_department</span>{{ task.streak }}
                    </span>
                  }
                </div>
              }
            </div>
          }
        </section>

        <!-- Footer: day navigation -->
        <section class="day-nav">
          <button class="nav-arrow" [disabled]="!canGoPrev()" (click)="goPrev()" title="Previous day (←)">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <p class="nav-hint">
            Use <kbd>←</kbd> <kbd>→</kbd> to browse past days
          </p>
          <button class="nav-arrow" [disabled]="!canGoNext()" (click)="goNext()" title="Next day (→)">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </section>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .min-home {
      max-width: 560px;
      margin: 0 auto;
      padding: 18vh 1.5rem 5rem;
    }

    /* Hero */
    .hero, .empty-shell {
      text-align: center;
      margin-bottom: 5rem;
      user-select: none;
    }
    .tiny-label {
      font-family: Inter, sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: var(--color-outline, #757c7b);
      text-transform: uppercase;
      letter-spacing: 0.3em;
      margin-bottom: 0.75rem;
    }
    .date-hero {
      font-family: Manrope, sans-serif;
      font-size: 2.75rem;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: var(--color-on-surface, #2d3433);
    }
    .greeting {
      font-size: 0.875rem;
      color: var(--color-on-surface-variant, #5a6060);
      margin-top: 0.75rem;
      font-weight: 300;
    }
    .empty-hint {
      font-size: 0.875rem;
      color: var(--color-outline, #757c7b);
      margin-top: 2rem;
      font-style: italic;
    }

    /* List */
    .list-section {
      margin-bottom: 4rem;
    }
    .list-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      padding: 0 0.25rem;
      margin-bottom: 1.25rem;
    }
    .done-count {
      font-family: Inter, sans-serif;
      font-size: 11px;
      color: var(--color-outline, #757c7b);
    }
    .empty-line {
      text-align: center;
      font-size: 0.875rem;
      color: var(--color-outline, #757c7b);
      font-style: italic;
      padding: 2.5rem 0;
    }

    .task-list { display: flex; flex-direction: column; }

    .task-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 1.125rem;
      transition: background-color 0.15s ease;
      animation: taskEnter 220ms ease both;
    }
    .task-row:hover {
      background: var(--color-surface-container-low, #f2f4f3);
    }
    @keyframes taskEnter {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Pebble checkbox */
    .check {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      border: 1.5px solid var(--color-outline-variant, #adb3b2);
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: background-color 0.18s, border-color 0.18s;
      padding: 0;
    }
    .check:hover:not(:disabled) {
      border-color: var(--color-primary, #4e6358);
      background: rgba(78, 99, 88, 0.06);
    }
    .check.done {
      border-color: var(--color-primary, #4e6358);
      background: var(--color-primary, #4e6358);
    }
    .check:disabled { cursor: default; }
    .check-icon {
      font-size: 14px !important;
      color: var(--color-on-primary, #e6fdee);
    }

    .task-title {
      flex: 1;
      font-size: 0.9375rem;
      font-weight: 500;
      line-height: 1.45;
      color: var(--color-on-surface, #2d3433);
      font-family: Manrope, sans-serif;
    }
    .task-title.done {
      text-decoration: line-through;
      opacity: 0.45;
    }

    .task-goal {
      font-size: 14px;
      flex-shrink: 0;
      opacity: 0.8;
    }
    .task-streak {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-family: Inter, sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: var(--color-outline, #757c7b);
      flex-shrink: 0;
    }
    .task-streak.done {
      color: var(--color-primary, #4e6358);
    }
    .streak-icon {
      font-size: 13px !important;
      font-variation-settings: 'FILL' 1;
    }

    /* Day nav */
    .day-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }
    .nav-arrow {
      width: 36px;
      height: 36px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-outline, #757c7b);
      cursor: pointer;
      background: transparent;
      border: none;
      transition: background-color 0.15s, color 0.15s;
      padding: 0;
    }
    .nav-arrow:hover:not(:disabled) {
      background: var(--color-surface-container, #ebeeed);
      color: var(--color-primary, #4e6358);
    }
    .nav-arrow:disabled {
      opacity: 0.25;
      cursor: default;
    }
    .nav-hint {
      font-family: Inter, sans-serif;
      font-size: 10px;
      color: var(--color-outline, #757c7b);
      text-transform: uppercase;
      letter-spacing: 0.2em;
      text-align: center;
    }
    .nav-hint kbd {
      display: inline-block;
      padding: 1px 5px;
      background: var(--color-surface-container-low, #f2f4f3);
      border-radius: 4px;
      font-size: 10px;
      font-weight: 500;
      color: var(--color-outline, #757c7b);
      font-family: inherit;
      margin: 0 1px;
    }
  `],
})
export class HomeComponent implements OnInit, OnChanges {
  @Input() goals: Goal[] = [];
  @Output() goalClicked = new EventEmitter<string>();
  @Output() addGoalClicked = new EventEmitter<void>();

  private api = inject(ApiService);

  loading = signal(true);
  currentDate = signal<Date>(atStartOfDay(new Date()));
  /** Cache of tasks keyed by YYYY-MM-DD. Lets navigation feel instant after first fetch. */
  days = signal<Map<string, TaskRow[]>>(new Map());
  /** Template id → template. Used to map streak onto task rows. */
  private templatesById = new Map<string, RecurrenceTemplate>();

  /** Absolute "today" reference (captured at mount; stable across navigation). */
  private readonly todayRef = atStartOfDay(new Date());

  // ── Derived view state ─────────────────────────────────────────────────
  currentKey = computed(() => toDateKey(this.currentDate()));
  currentTasks = computed(() => this.days().get(this.currentKey()) ?? []);
  isToday = computed(() => dayDiff(this.currentDate(), this.todayRef) === 0);
  canGoPrev = computed(() => true);
  canGoNext = computed(() => dayDiff(this.currentDate(), this.todayRef) < 0);

  dayLabel = computed(() => {
    const diff = dayDiff(this.todayRef, this.currentDate()); // positive if past
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return this.currentDate().toLocaleDateString('en-US', { weekday: 'long' });
  });
  heroDate = computed(() =>
    this.currentDate().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
  );
  greeting = computed(() => {
    if (!this.isToday()) return '';
    const h = new Date().getHours();
    if (h < 12) return 'Good morning.';
    if (h < 17) return 'Good afternoon.';
    return 'Good evening.';
  });
  doneCountLabel = computed(() => {
    const tasks = this.currentTasks();
    if (tasks.length === 0) return '';
    const done = tasks.filter(t => t.isCompleted).length;
    if (done === tasks.length) return `All done — ${done}/${tasks.length}`;
    return `${done} of ${tasks.length}`;
  });
  emptyText = computed(() => {
    if (this.isToday()) return 'Nothing on today\u2019s list.';
    return 'No tasks on this day.';
  });

  async ngOnInit() {
    await this.loadTemplates();
    await this.loadDay(this.currentDate());
    this.loading.set(false);
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['goals'] && !changes['goals'].firstChange) {
      // Goals changed — invalidate cache and reload whatever day is showing.
      this.days.set(new Map());
      await this.loadTemplates();
      await this.loadDay(this.currentDate());
    }
  }

  /** Called by the parent after a new task/template is added. */
  async refresh() {
    this.days.set(new Map());
    await this.loadTemplates();
    await this.loadDay(this.currentDate());
  }

  // ── Keyboard navigation ─────────────────────────────────────────────────
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); this.goPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); this.goNext(); }
  }

  // ── Navigation ──────────────────────────────────────────────────────────
  async goPrev() {
    if (!this.canGoPrev()) return;
    const next = new Date(this.currentDate());
    next.setDate(next.getDate() - 1);
    this.currentDate.set(next);
    if (!this.days().has(toDateKey(next))) await this.loadDay(next);
  }

  async goNext() {
    if (!this.canGoNext()) return;
    const next = new Date(this.currentDate());
    next.setDate(next.getDate() + 1);
    this.currentDate.set(next);
    if (!this.days().has(toDateKey(next))) await this.loadDay(next);
  }

  // ── Toggle completion ──────────────────────────────────────────────────
  async toggle(task: TaskRow) {
    if (!this.isToday()) return;
    const key = this.currentKey();
    const prev = task.isCompleted;
    task.isCompleted = !prev;
    // Immutable swap so the computed signal fires.
    this.days.update(m => new Map(m).set(key, [...(m.get(key) ?? [])]));
    try {
      await this.api.updateTodoItem(task.id, { isCompleted: task.isCompleted });
      // Streak is derived on the backend from task history — refresh templates
      // so the fire-count next to the row reflects today's change.
      await this.loadTemplates();
      this.days.update(m => {
        const next = new Map(m);
        const rows = next.get(key);
        if (rows) {
          next.set(key, rows.map(r => ({ ...r, streak: this.streakForTemplateId(r.templateId) })));
        }
        return next;
      });
    } catch {
      // revert on failure
      task.isCompleted = prev;
      this.days.update(m => new Map(m).set(key, [...(m.get(key) ?? [])]));
    }
  }

  // ── Data loading ───────────────────────────────────────────────────────
  private async loadTemplates() {
    this.templatesById = new Map();
    try {
      for (const goal of this.goals) {
        const templates = await this.api.getRecurrenceTemplates(goal.id);
        for (const t of templates) this.templatesById.set(t.id, t);
      }
      const generalTemplates = await this.api.getGeneralRecurrenceTemplates();
      for (const t of generalTemplates) this.templatesById.set(t.id, t);
    } catch {
      /* ignore — streaks will just read 0 */
    }
  }

  private async loadDay(d: Date) {
    const key = toDateKey(d);
    const isToday = dayDiff(d, this.todayRef) === 0;
    const rows: TaskRow[] = [];

    // Per-goal tasks for this date
    for (const goal of this.goals) {
      try {
        const todos = await this.api.getTodoItems(goal.id, key);
        for (const todo of todos) {
          if (!this.keepOnDay(todo, isToday)) continue;
          rows.push(this.toRow(todo, goal.icon));
        }
      } catch { /* swallow */ }
    }

    // General (goalless) tasks for this date
    try {
      const generals = await this.api.getGeneralTodoItems(key);
      for (const todo of generals) {
        if (!this.keepOnDay(todo, isToday)) continue;
        rows.unshift(this.toRow(todo, undefined));
      }
    } catch { /* swallow */ }

    this.days.update(m => new Map(m).set(key, rows));
  }

  /** Show only template-origin tasks on past days; include one-offs on today. */
  private keepOnDay(todo: TodoItem, isToday: boolean): boolean {
    return !!todo.templateId || isToday;
  }

  private toRow(todo: TodoItem, goalIcon: string | undefined): TaskRow {
    return {
      id: todo.id,
      templateId: todo.templateId,
      title: todo.title,
      isCompleted: todo.isCompleted,
      goalIcon,
      streak: this.streakForTemplateId(todo.templateId),
    };
  }

  private streakForTemplateId(templateId: string | undefined): number {
    if (!templateId) return 0;
    const t = this.templatesById.get(templateId);
    return t?.currentStreak ?? 0;
  }
}
