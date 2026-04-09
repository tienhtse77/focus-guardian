import { Component, Input, Output, EventEmitter, signal, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal, TodoItem, RecurrenceRule } from '../../services/storage.service';
import { ApiService } from '../../services/api.service';

interface GoalTodos {
  goal: Goal;
  todos: TodoItem[];
}

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
  { text: 'Focus on being productive instead of busy.', author: 'Tim Ferriss' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
  { text: 'What you do today can improve all your tomorrows.', author: 'Ralph Marston' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  styles: [`:host { display: contents; }`],
  template: `
    <div class="max-w-2xl mx-auto">
      <!-- Masthead -->
      <div class="text-center mb-10">
        <p class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-outline mb-3">{{ todayFormatted }}</p>
        <h1 class="text-4xl font-headline font-extrabold text-on-surface tracking-tight leading-tight">The Morning Brief</h1>
        <div class="w-12 h-0.5 bg-primary mx-auto mt-4 rounded-full"></div>
      </div>

      <!-- Quote block -->
      <div class="bg-tertiary-container rounded-2xl p-8 mb-10 relative overflow-hidden">
        <span class="material-symbols-outlined absolute top-4 right-6 text-6xl text-tertiary opacity-10 rotate-12">format_quote</span>
        <div class="relative z-10">
          <p class="text-lg font-headline font-semibold text-on-tertiary-container leading-relaxed italic">
            "{{ quote.text }}"
          </p>
          <p class="text-xs font-label text-on-tertiary-fixed-variant mt-3">— {{ quote.author }}</p>
        </div>
      </div>

      @if (goalTodos().length > 0 || generalTodos().length > 0) {
        <!-- Today's Edition header -->
        <div class="flex items-center gap-4 mb-6">
          <h2 class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-outline shrink-0">Today's Edition</h2>
          <div class="flex-1 h-px bg-surface-container"></div>
          <span class="text-xs font-label text-outline shrink-0">{{ totalOpenTasks() }} items</span>
        </div>

        <!-- General tasks (no goal) -->
        @if (generalTodos().length > 0) {
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-lg text-on-surface-variant">inbox</span>
              <h3 class="text-xs font-label font-bold uppercase tracking-[0.2em] text-primary">General</h3>
            </div>
            <div class="space-y-0">
              @for (todo of generalTodos(); track todo.id) {
                <div class="flex items-center gap-4 py-3 hover:bg-surface-container rounded-lg px-3 group transition-all duration-200"
                  [ngClass]="editingTodoId() === todo.id ? 'ring-2 ring-primary/20 bg-surface-container' : ''"
                >
                  <button
                    (click)="onToggleTodo(todo)"
                    class="shrink-0 text-on-surface-variant hover:text-primary transition-all duration-200"
                  >
                    <span class="material-symbols-outlined text-xl">check_box_outline_blank</span>
                  </button>
                  @if (editingTodoId() === todo.id) {
                    <input
                      type="text"
                      [value]="todo.title"
                      (keydown.enter)="saveTodoEdit(todo, $event)"
                      (keydown.escape)="cancelTodoEdit()"
                      (blur)="saveTodoEdit(todo, $event)"
                      class="flex-1 text-[15px] text-on-surface font-medium bg-transparent focus:outline-none inline-edit"
                      autofocus
                    />
                  } @else {
                    <span class="flex-1 text-[15px] text-on-surface font-medium leading-snug cursor-text" (click)="startEditTodo(todo)">{{ todo.title }}</span>
                    @if (todo.recurrenceRule) {
                      <span class="flex items-center gap-1 text-[10px] font-label font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                        <span class="material-symbols-outlined" style="font-size: 14px;">repeat</span>
                        {{ getRecurrenceLabel(todo.recurrenceRule) }}
                      </span>
                    }
                  }
                </div>
              }
            </div>
          </div>

          @if (goalTodos().length > 0) {
            <div class="flex items-center gap-4 mb-8">
              <div class="flex-1 h-px bg-surface-container"></div>
              <span class="material-symbols-outlined text-outline-variant text-sm">more_horiz</span>
              <div class="flex-1 h-px bg-surface-container"></div>
            </div>
          }
        }

        <!-- Goal sections -->
        @for (group of goalTodos(); track group.goal.id; let last = $last) {
          <div class="mb-8">
            <div class="flex items-center gap-2 mb-3 cursor-pointer group" (click)="goalClicked.emit(group.goal.id)">
              <span class="text-lg">{{ group.goal.icon }}</span>
              <h3 class="text-xs font-label font-bold uppercase tracking-[0.2em] text-primary group-hover:text-primary-dim transition-all duration-200">{{ group.goal.title }}</h3>
            </div>
            <div class="space-y-0">
              @for (todo of group.todos; track todo.id) {
                <div class="flex items-center gap-4 py-3 hover:bg-surface-container rounded-lg px-3 group transition-all duration-200"
                  [ngClass]="editingTodoId() === todo.id ? 'ring-2 ring-primary/20 bg-surface-container' : ''"
                >
                  <button
                    (click)="onToggleTodo(todo)"
                    class="shrink-0 text-on-surface-variant hover:text-primary transition-all duration-200"
                  >
                    <span class="material-symbols-outlined text-xl">check_box_outline_blank</span>
                  </button>
                  @if (editingTodoId() === todo.id) {
                    <input
                      type="text"
                      [value]="todo.title"
                      (keydown.enter)="saveTodoEdit(todo, $event)"
                      (keydown.escape)="cancelTodoEdit()"
                      (blur)="saveTodoEdit(todo, $event)"
                      class="flex-1 text-[15px] text-on-surface font-medium bg-transparent focus:outline-none inline-edit"
                      autofocus
                    />
                    <span class="flex items-center gap-2 text-[10px] font-label text-outline shrink-0">
                      <span class="inline-flex items-center px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-medium text-outline">&#8629; save</span>
                      <span class="inline-flex items-center px-1.5 py-0.5 bg-surface-container-high rounded text-[10px] font-medium text-outline">esc</span>
                    </span>
                  } @else {
                    <span class="flex-1 text-[15px] text-on-surface font-medium leading-snug cursor-text" (click)="startEditTodo(todo)">{{ todo.title }}</span>
                    @if (todo.recurrenceRule || todo.templateId) {
                      <span class="flex items-center gap-1 text-[10px] font-label font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full shrink-0">
                        <span class="material-symbols-outlined text-xs">repeat</span>
                        {{ getRecurrenceLabel(todo.recurrenceRule) }}
                      </span>
                    }
                    @if (todo.currentStreak && todo.currentStreak > 0) {
                      <span class="text-xs font-label font-semibold text-primary shrink-0">{{ todo.currentStreak }}</span>
                    }
                  }
                </div>
              }
            </div>
          </div>

          @if (!last) {
            <div class="flex items-center gap-4 mb-8">
              <div class="flex-1 h-px bg-surface-container"></div>
              <span class="material-symbols-outlined text-outline-variant text-sm">more_horiz</span>
              <div class="flex-1 h-px bg-surface-container"></div>
            </div>
          }
        }

        <!-- Footer -->
        <div class="text-center mt-12 pb-4">
          <div class="w-8 h-0.5 bg-outline-variant mx-auto mb-3 rounded-full"></div>
          <p class="text-[10px] font-label text-outline uppercase tracking-[0.2em]">End of today's brief</p>
        </div>
      } @else if (goals.length > 0) {
        <!-- All done state -->
        <div class="text-center py-16">
          <span class="material-symbols-outlined text-primary text-4xl mb-4 block filled">celebration</span>
          <h2 class="text-xl font-headline font-bold text-on-surface mb-2">All clear</h2>
          <p class="text-sm text-on-surface-variant">No open tasks across your goals. Enjoy the calm.</p>
          <p class="text-xs text-outline mt-4 font-label">
            Press
            <span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;background:#f2f4f3;border-radius:4px;font-size:10px;font-weight:500;color:#757c7b;">Ctrl+K</span>
            then
            <span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;background:#f2f4f3;border-radius:4px;font-size:10px;font-weight:500;color:#757c7b;">T</span>
            to add a task
          </p>
        </div>
      } @else {
        <!-- No goals state -->
        <div class="text-center py-16">
          <span class="material-symbols-outlined text-primary text-4xl mb-4 block">self_improvement</span>
          <h2 class="text-xl font-headline font-bold text-on-surface mb-2">Welcome to Focus Guardian</h2>
          <p class="text-sm text-on-surface-variant mb-6">Create your first goal to start your morning brief.</p>
          <button (click)="addGoalClicked.emit()"
            class="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm editorial-shadow hover:bg-primary-dim tonal-lift">
            <span class="material-symbols-outlined text-sm align-middle mr-1">add_circle</span>
            Create Your First Goal
          </button>
        </div>
      }
    </div>
  `
})
export class HomeComponent implements OnInit, OnChanges {
  @Input() goals: Goal[] = [];
  @Output() goalClicked = new EventEmitter<string>();
  @Output() addGoalClicked = new EventEmitter<void>();

  private api = inject(ApiService);

  goalTodos = signal<GoalTodos[]>([]);
  generalTodos = signal<TodoItem[]>([]);
  editingTodoId = signal<string | null>(null);

  quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  totalOpenTasks = signal(0);

  async ngOnInit() {
    await this.loadAllTodos();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['goals']) {
      await this.loadAllTodos();
    }
  }

  async loadAllTodos() {
    const groups: GoalTodos[] = [];
    let total = 0;
    const today = new Date().toISOString().split('T')[0];

    // Load general (goalless) tasks
    const general = await this.api.getGeneralTodoItems();
    const openGeneral = general.filter(t => !t.isCompleted);
    this.generalTodos.set(openGeneral);
    total += openGeneral.length;

    // Load goal tasks
    for (const goal of this.goals) {
      const todos = await this.api.getTodoItems(goal.id, today);
      const openTodos = todos.filter(t => !t.isCompleted);
      if (openTodos.length > 0) {
        groups.push({ goal, todos: openTodos });
        total += openTodos.length;
      }
    }

    this.goalTodos.set(groups);
    this.totalOpenTasks.set(total);
  }

  async onToggleTodo(todo: TodoItem) {
    await this.api.updateTodoItem(todo.id, { isCompleted: true });
    await this.loadAllTodos();
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
      await this.loadAllTodos();
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
}
