import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../services/storage.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  styles: [`:host { display: contents; }`],
  template: `
    <aside class="fixed left-0 top-0 h-full w-[280px] bg-surface-container-low flex flex-col py-8 px-6 font-body tracking-tight text-sm z-50">
      <!-- Brand -->
      <div class="mb-10 px-4">
        <h1 class="text-xl font-bold text-on-surface">Focus Guardian</h1>
        <p class="text-[10px] text-outline-variant mt-1 uppercase tracking-[0.2em] font-label font-semibold">Curated Sanctuary</p>
      </div>

      <!-- Goal Navigation -->
      <nav class="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        <p class="text-[10px] font-label uppercase tracking-[0.2em] text-outline-variant px-4 mb-3 font-semibold">Your Goals</p>

        @for (goal of goals; track goal.id; let i = $index) {
          <button
            draggable="true"
            (dragstart)="onDragStart($event, i)"
            (dragover)="onDragOver($event, i)"
            (dragenter)="onDragEnter($event, i)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event, i)"
            (dragend)="onDragEnd()"
            (click)="goalSelected.emit(goal.id)"
            [class]="getGoalClass(goal.id, i)"
            [title]="goal.title"
          >
            <span class="text-lg pointer-events-none">{{ goal.icon }}</span>
            <span class="truncate pointer-events-none">{{ goal.title }}</span>
          </button>
        }

        <!-- Add Goal Button -->
        <button
          (click)="addGoalClicked.emit()"
          class="flex items-center gap-4 px-4 py-3 text-outline hover:text-primary hover:bg-surface-container rounded-full w-full mt-2 transition-all duration-200"
          title="Add new goal"
        >
          <span class="material-symbols-outlined text-lg">add_circle</span>
          <span>Add Goal</span>
        </button>
      </nav>

      <!-- Bottom -->
      <div class="mt-auto pt-6" style="border-top: 1px solid rgba(173,179,178,0.15)">
        <a href="#" class="flex items-center gap-4 px-4 py-2 text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-full text-sm transition-all duration-200">
          <span class="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </a>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() goals: Goal[] = [];
  @Input() selectedGoalId: string | null = null;
  @Output() goalSelected = new EventEmitter<string>();
  @Output() addGoalClicked = new EventEmitter<void>();
  @Output() goalsReordered = new EventEmitter<Goal[]>();

  draggedIndex = signal<number | null>(null);
  dragOverIndex = signal<number | null>(null);

  getGoalClass(goalId: string, index: number): string {
    const isSelected = this.selectedGoalId === goalId;
    const isDragging = this.draggedIndex() === index;
    const isDragOver = this.dragOverIndex() === index && this.draggedIndex() !== index;

    let classes = 'flex items-center gap-4 px-4 py-3 w-full rounded-full cursor-grab active:cursor-grabbing transition-all duration-200 ';

    if (isDragging) {
      classes += 'opacity-50 scale-90 ';
    } else if (isDragOver) {
      classes += 'bg-surface-container-high scale-105 ';
    } else if (isSelected) {
      classes += 'text-primary font-bold bg-surface editorial-shadow ';
    } else {
      classes += 'text-on-surface-variant hover:bg-surface-container ';
    }

    return classes;
  }

  onDragStart(event: DragEvent, index: number) {
    this.draggedIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', index.toString());
    }
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  onDragEnter(event: DragEvent, index: number) {
    event.preventDefault();
    if (this.draggedIndex() !== index) {
      this.dragOverIndex.set(index);
    }
  }

  onDragLeave(event: DragEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('button[draggable]')) {
      this.dragOverIndex.set(null);
    }
  }

  onDrop(event: DragEvent, dropIndex: number) {
    event.preventDefault();
    const dragIndex = this.draggedIndex();

    if (dragIndex !== null && dragIndex !== dropIndex) {
      const reordered = [...this.goals];
      const [removed] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, removed);
      this.goalsReordered.emit(reordered);
    }

    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }

  onDragEnd() {
    this.draggedIndex.set(null);
    this.dragOverIndex.set(null);
  }
}
