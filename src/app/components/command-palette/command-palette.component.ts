import { Component, Input, Output, EventEmitter, signal, computed, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal, RecurrenceRule } from '../../services/storage.service';

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

          <!-- Slash suggestions -->
          @if (slashSuggestions().length > 0 && !detectedRecurrence()) {
            <div class="py-1 mx-1">
              @for (opt of slashSuggestions(); track opt.shorthand; let i = $index) {
                <button
                  (click)="selectSlashSuggestion(opt)"
                  [class]="'w-full flex items-center gap-3 px-4 py-2 text-left transition-all duration-100 rounded-lg ' + (slashHighlight() === i ? 'bg-primary-container/40' : 'hover:bg-surface-container-low')"
                >
                  <span class="material-symbols-outlined text-lg" [class]="slashHighlight() === i ? 'text-primary' : 'text-on-surface-variant'">repeat</span>
                  <span class="text-sm text-on-surface flex-1">{{ opt.label }}</span>
                  <span class="text-xs font-label text-outline">{{ opt.desc }}</span>
                </button>
              }
            </div>
          }

          <!-- Recurrence detection hint -->
          @if (detectedRecurrence()) {
            <div class="mx-5 mb-3 px-4 py-2.5 bg-primary-container/40 rounded-lg flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-lg">repeat</span>
              <span class="text-sm text-primary font-label">Repeats <span class="font-bold">{{ detectedRecurrence() }}</span></span>
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
                  <span class="material-symbols-outlined text-sm">inbox</span>
                  General task <span class="text-outline-variant">(no goal)</span>
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
  @Output() taskAdded = new EventEmitter<{ goalId: string | null; title: string; recurrenceRule?: RecurrenceRule }>();
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

  private readonly recurrenceOptions = [
    { shorthand: '/daily', label: 'Daily', desc: 'Every day' },
    { shorthand: '/weekdays', label: 'Weekdays', desc: 'Mon to Fri' },
    { shorthand: '/weekly', label: 'Weekly', desc: 'On current day' },
    { shorthand: '/weekly mon,wed,fri', label: 'Mon · Wed · Fri', desc: 'Custom weekly' },
    { shorthand: '/every 2 days', label: 'Every 2 days', desc: 'Custom interval' },
    { shorthand: '/every 3 days', label: 'Every 3 days', desc: 'Custom interval' },
    { shorthand: '/monthly', label: 'Monthly', desc: 'On current date' },
  ];

  slashSuggestions = computed(() => {
    if (this.mode() !== 'task') return [];
    const val = this.inputValue();
    const slashIdx = val.lastIndexOf('/');
    if (slashIdx < 0) return [];
    const after = val.substring(slashIdx).toLowerCase();
    if (after === '/') return this.recurrenceOptions;
    return this.recurrenceOptions.filter(o => o.shorthand.toLowerCase().startsWith(after));
  });

  slashHighlight = signal(0);

  detectedRecurrence = computed(() => {
    const val = this.inputValue();
    if (this.mode() !== 'task') return null;
    const { rule } = this.parseRecurrence(val);
    if (!rule) return null;
    return this.getRecurrenceLabel(rule);
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
    this.slashHighlight.set(0);
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
      const suggestions = this.slashSuggestions();
      if (mode === 'task' && suggestions.length > 0 && !this.detectedRecurrence()) {
        this.slashHighlight.set(Math.min(this.slashHighlight() + 1, suggestions.length - 1));
      } else {
        const max = mode === 'default' ? this.filteredActions().length : this.filteredGoals().length;
        this.highlightIndex.set(Math.min(this.highlightIndex() + 1, max - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const suggestions = this.slashSuggestions();
      if (mode === 'task' && suggestions.length > 0 && !this.detectedRecurrence()) {
        this.slashHighlight.set(Math.max(this.slashHighlight() - 1, 0));
      } else {
        this.highlightIndex.set(Math.max(this.highlightIndex() - 1, 0));
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // If slash suggestions are open, select the highlighted one
      const suggestions = this.slashSuggestions();
      if (mode === 'task' && suggestions.length > 0 && !this.detectedRecurrence()) {
        this.selectSlashSuggestion(suggestions[this.slashHighlight()]);
        return;
      }
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

  selectSlashSuggestion(opt: { shorthand: string; label: string }) {
    const val = this.inputValue();
    const slashIdx = val.lastIndexOf('/');
    const before = slashIdx >= 0 ? val.substring(0, slashIdx) : val;
    const newVal = before + opt.shorthand;
    this.inputValue.set(newVal);
    if (this.paletteInputRef?.nativeElement) {
      this.paletteInputRef.nativeElement.value = newVal;
      this.paletteInputRef.nativeElement.focus();
    }
    this.slashHighlight.set(0);
  }

  private submitTask() {
    const raw = this.inputValue().trim();
    if (!raw) return;

    const { title, rule } = this.parseRecurrence(raw);
    if (!title) return;

    this.taskAdded.emit({ goalId: this.selectedGoalId, title, recurrenceRule: rule });
    this.inputValue.set('');

    // Show success briefly
    const label = rule ? ` (${this.getRecurrenceLabel(rule)})` : '';
    this.successMessage.set(`"${title}"${label} added`);
    clearTimeout(this.successTimeout);
    this.successTimeout = setTimeout(() => this.successMessage.set(''), 2000);

    // Clear the actual input element
    if (this.paletteInputRef?.nativeElement) {
      this.paletteInputRef.nativeElement.value = '';
    }
    this.focusInput();
  }

  private parseRecurrence(input: string): { title: string; rule?: RecurrenceRule } {
    let match: RegExpMatchArray | null;

    if ((match = input.match(/\s*\/daily\s*$/i))) {
      return { title: input.replace(match[0], '').trim(), rule: { type: 'daily', interval: 1 } };
    }
    if ((match = input.match(/\s*\/weekdays\s*$/i))) {
      return { title: input.replace(match[0], '').trim(), rule: { type: 'weekly', interval: 1, daysOfWeek: [1,2,3,4,5] } };
    }
    if ((match = input.match(/\s*\/weekly\s+([\w,]+)\s*$/i))) {
      const dayMap: Record<string,number> = {sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
      const days = match[1].toLowerCase().split(',').map(d => dayMap[d.trim()]).filter(d => d !== undefined);
      return { title: input.replace(match[0], '').trim(), rule: { type: 'weekly', interval: 1, daysOfWeek: days } };
    }
    if ((match = input.match(/\s*\/weekly\s*$/i))) {
      return { title: input.replace(match[0], '').trim(), rule: { type: 'weekly', interval: 1, daysOfWeek: [new Date().getDay()] } };
    }
    if ((match = input.match(/\s*\/every\s+(\d+)\s+days?\s*$/i))) {
      return { title: input.replace(match[0], '').trim(), rule: { type: 'daily', interval: parseInt(match[1]) } };
    }
    if ((match = input.match(/\s*\/monthly\s*$/i))) {
      return { title: input.replace(match[0], '').trim(), rule: { type: 'monthly', interval: 1, dayOfMonth: new Date().getDate() } };
    }

    return { title: input };
  }

  getRecurrenceLabel(rule: RecurrenceRule): string {
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
