import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../services/storage.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-16 bg-white/50 backdrop-blur-sm border-r border-gray-100 flex flex-col items-center py-6 gap-4">
      <!-- Goal Icons with Drag & Drop -->
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
          [style.color]="goal.color"
          [title]="goal.title"
        >
          <span class="text-xl pointer-events-none">{{ goal.icon }}</span>
        </button>
      }
      
      <!-- Add Goal Button -->
      <button
        (click)="addGoalClicked.emit()"
        class="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-white/80 transition-all mt-auto"
        title="Add new goal"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
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

    let classes = 'w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ';

    if (isDragging) {
      classes += 'opacity-50 scale-90 ';
    } else if (isDragOver) {
      classes += 'ring-2 ring-indigo-300 ring-offset-2 scale-110 ';
    } else if (isSelected) {
      classes += 'ring-2 ring-offset-2 ring-indigo-400 bg-white shadow-sm ';
    } else {
      classes += 'hover:bg-white/80 ';
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
    // Only clear if we're actually leaving the element
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
