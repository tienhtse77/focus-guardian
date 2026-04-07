import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../services/storage.service';

type PaletteMode = 'default' | 'task' | 'goal';

interface PaletteAction {
  icon: string;
  label: string;
  hint: string;
  key: string;
  mode: PaletteMode | 'import';
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule],
  styles: [`:host { display: contents; }
    .palette-shadow { box-shadow: 0 24px 64px rgba(45,52,51,0.12), 0 8px 24px rgba(45,52,51,0.06); }
    .kbd { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; padding: 0 5px; font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-weight: 500; color: #757c7b; background: #f2f4f3; border-radius: 5px; line-height: 1; }
    html.dark .kbd { background: #2a302e; color: #adb3b2; }
  `],
  template: `
    @if (isOpen) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-on-surface/10 backdrop-blur-sm"
        (click)="onBackdropClick($event)"
        (keydown)="onKeyDown($event)"
      >
        <!-- Palette Card -->
        <div
          class="w-full max-w-lg mx-4 bg-surface-container-lowest rounded-lg palette-shadow overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Input Row -->
          <div class="flex items-center gap-3 px-5 py-4">
            @if (mode() === 'task') {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-container rounded-full text-primary text-xs font-label font-semibold shrink-0">
                <span class="material-symbols-outlined text-sm">add_task</span>
                Task
              </span>
            } @else if (mode() === 'goal') {
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded-full text-on-surface-variant text-xs font-label font-semibold shrink-0">
                <span class="material-symbols-outlined text-sm">swap_horiz</span>
                Goal
              </span>
            } @else {
              <span class="material-symbols-outlined text-outline text-xl">search</span>
            }
            <input
              #paletteInput
              type="text"
              [placeholder]="inputPlaceholder()"
              [value]="inputValue()"
              (input)="onInput($event)"
              (keydown)="onInputKeyDown($event)"
              class="flex-1 bg-transparent text-on-surface text-base font-body placeholder:text-outline-variant focus:outline-none"
            />
            <span class="kbd">esc</span>
          </div>

          <!-- Success Toast -->
          @if (successMessage()) {
            <div class="mx-5 mb-3 px-4 py-2.5 bg-primary-container/50 rounded-lg flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-lg filled">check_circle</span>
              <span class="text-sm text-primary font-label font-semibold">{{ successMessage() }}</span>
            </div>
          }

          <!-- DEFAULT MODE: Action List -->
          @if (mode() === 'default') {
            <div class="bg-surface-container-low px-5 py-2">
              <span class="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-outline">Actions</span>
            </div>
            <div class="py-2">
              @for (action of filteredActions(); track action.key; let i = $index) {
                <div
                  (click)="onActionSelect(action)"
                  [class]="'flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150 ' + (highlightIndex() === i ? 'bg-primary-container/40' : 'hover:bg-surface-container-low')"
                >
                  <span class="material-symbols-outlined text-xl" [class]="highlightIndex() === i ? 'text-primary' : 'text-on-surface-variant'">{{ action.icon }}</span>
                  <span class="text-sm font-body text-on-surface flex-1">{{ action.label }}</span>
                  <span class="text-xs font-label text-on-surface-variant">{{ action.hint }}</span>
                  <span class="kbd">{{ action.key }}</span>
                </div>
              }
            </div>
            <div class="bg-surface-container-low px-5 py-2.5 flex items-center gap-4">
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">&uarr;</span><span class="kbd text-[10px]">&darr;</span> navigate</span>
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">&crarr;</span> select</span>
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">esc</span> close</span>
            </div>
          }

          <!-- TASK MODE: Context bar -->
          @if (mode() === 'task') {
            <div class="bg-surface-container-low px-5 py-2.5 flex items-center justify-between">
              <span class="text-[11px] font-label text-outline flex items-center gap-2">
                @if (currentGoal()) {
                  <span class="text-base">{{ currentGoal()!.icon }}</span>
                  Adding to <span class="font-semibold text-on-surface-variant">{{ currentGoal()!.title }}</span>
                  @if (todoCount() !== null) {
                    <span class="mx-1 text-outline-variant">&middot;</span>
                    <span class="text-primary font-semibold">{{ todoCount() }}</span>
                  }
                } @else {
                  Select a goal first
                }
              </span>
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5">
                <span class="kbd text-[10px]">&crarr;</span> add
                <span class="mx-1 text-outline-variant">&middot;</span>
                <span class="kbd text-[10px]">esc</span> back
              </span>
            </div>
          }

          <!-- GOAL MODE: Goal List -->
          @if (mode() === 'goal') {
            <div class="py-2 max-h-64 overflow-y-auto">
              @for (goal of filteredGoals(); track goal.id; let i = $index) {
                <div
                  (click)="onGoalSelect(goal)"
                  [class]="'flex items-center gap-3 px-5 py-3 cursor-pointer transition-all duration-150 ' + (highlightIndex() === i ? 'bg-primary-container/40' : 'hover:bg-surface-container-low')"
                >
                  <span class="text-xl">{{ goal.icon }}</span>
                  <span class="text-sm font-body text-on-surface flex-1">{{ goal.title }}</span>
                  @if (goal.id === selectedGoalId) {
                    <span class="text-[10px] font-label font-bold text-primary bg-primary-container px-2 py-0.5 rounded uppercase tracking-widest">Current</span>
                  }
                </div>
              }
              @if (filteredGoals().length === 0) {
                <div class="px-5 py-6 text-center">
                  <span class="text-sm text-on-surface-variant font-label">No matching goals</span>
                </div>
              }
            </div>
            <div class="bg-surface-container-low px-5 py-2.5 flex items-center gap-4">
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">&uarr;</span><span class="kbd text-[10px]">&darr;</span> navigate</span>
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">&crarr;</span> switch</span>
              <span class="text-[11px] font-label text-outline flex items-center gap-1.5"><span class="kbd text-[10px]">esc</span> back</span>
            </div>
          }
        </div>
      </div>
    }
  `
})
export class CommandPaletteComponent implements AfterViewInit, OnChanges {
  @Input() isOpen = false;
  @Input() goals: Goal[] = [];
  @Input() selectedGoalId: string | null = null;
  @Input() todoStats: { completed: number; total: number } | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() taskAdded = new EventEmitter<{ goalId: string; title: string }>();
  @Output() goalJumped = new EventEmitter<string>();
  @Output() importRequested = new EventEmitter<void>();

  @ViewChild('paletteInput') paletteInputRef!: ElementRef<HTMLInputElement>;

  mode = signal<PaletteMode>('default');
  inputValue = signal('');
  highlightIndex = signal(0);
  successMessage = signal('');

  private successTimeout: any;

  private readonly actions: PaletteAction[] = [
    { icon: 'add_task', label: 'Add task', hint: 'to current goal', key: 'T', mode: 'task' },
    { icon: 'swap_horiz', label: 'Jump to goal', hint: 'switch goals', key: 'G', mode: 'goal' },
    { icon: 'upload', label: 'Import feeds', hint: 'OPML or URLs', key: 'I', mode: 'import' },
  ];

  inputPlaceholder = computed(() => {
    switch (this.mode()) {
      case 'task': return 'Type a task...';
      case 'goal': return 'Search goals...';
      default: return 'Type a command...';
    }
  });

  currentGoal = computed(() => {
    if (!this.selectedGoalId) return null;
    return this.goals.find(g => g.id === this.selectedGoalId) ?? null;
  });

  todoCount = computed(() => {
    if (!this.todoStats) return null;
    return `${this.todoStats.completed} / ${this.todoStats.total} done`;
  });

  filteredActions = computed(() => {
    const query = this.inputValue().toLowerCase();
    if (!query) return this.actions;
    return this.actions.filter(a => a.label.toLowerCase().includes(query));
  });

  filteredGoals = computed(() => {
    const query = this.inputValue().toLowerCase();
    if (!query) return this.goals;
    return this.goals.filter(g => g.title.toLowerCase().includes(query));
  });

  ngAfterViewInit() {
    this.focusInput();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      this.mode.set('default');
      this.inputValue.set('');
      this.highlightIndex.set(0);
      this.successMessage.set('');
      setTimeout(() => this.focusInput(), 0);
    }
  }

  private focusInput() {
    this.paletteInputRef?.nativeElement?.focus();
  }

  onBackdropClick(event: MouseEvent) {
    this.closed.emit();
  }

  onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.inputValue.set(value);
    this.highlightIndex.set(0);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (this.mode() !== 'default') {
        this.mode.set('default');
        this.inputValue.set('');
        this.highlightIndex.set(0);
        setTimeout(() => this.focusInput(), 0);
      } else {
        this.closed.emit();
      }
    }
  }

  onInputKeyDown(event: KeyboardEvent) {
    const mode = this.mode();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const max = mode === 'default' ? this.filteredActions().length : this.filteredGoals().length;
      this.highlightIndex.set(Math.min(this.highlightIndex() + 1, max - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightIndex.set(Math.max(this.highlightIndex() - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (mode === 'default') {
        const actions = this.filteredActions();
        if (actions.length > 0) {
          this.onActionSelect(actions[this.highlightIndex()]);
        }
      } else if (mode === 'task') {
        this.submitTask();
      } else if (mode === 'goal') {
        const goals = this.filteredGoals();
        if (goals.length > 0) {
          this.onGoalSelect(goals[this.highlightIndex()]);
        }
      }
    } else if (mode === 'default' && !this.inputValue()) {
      // Single-letter shortcuts
      const key = event.key.toUpperCase();
      const action = this.actions.find(a => a.key === key);
      if (action) {
        event.preventDefault();
        this.onActionSelect(action);
      }
    }
  }

  onActionSelect(action: PaletteAction) {
    if (action.mode === 'task') {
      if (!this.selectedGoalId) {
        this.successMessage.set('Select a goal first to add tasks');
        clearTimeout(this.successTimeout);
        this.successTimeout = setTimeout(() => this.successMessage.set(''), 2000);
        return;
      }
      this.mode.set('task');
    } else if (action.mode === 'goal') {
      this.mode.set('goal');
    } else if (action.mode === 'import') {
      this.importRequested.emit();
      this.closed.emit();
      return;
    }
    this.inputValue.set('');
    this.highlightIndex.set(0);
    setTimeout(() => this.focusInput(), 0);
  }

  onGoalSelect(goal: Goal) {
    this.goalJumped.emit(goal.id);
    this.closed.emit();
  }

  private submitTask() {
    const title = this.inputValue().trim();
    if (!title || !this.selectedGoalId) return;

    this.taskAdded.emit({ goalId: this.selectedGoalId, title });
    this.inputValue.set('');

    // Show success briefly
    this.successMessage.set(`"${title}" added`);
    clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(() => this.successMessage.set(''), 2000);

    // Clear the actual input element
    if (this.paletteInputRef?.nativeElement) {
      this.paletteInputRef.nativeElement.value = '';
    }
    this.focusInput();
  }
}
