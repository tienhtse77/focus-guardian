import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, ContentSource } from '../../services/storage.service';

const ICONS = ['📚', '💻', '🎯', '🏋️', '🎨', '🎵', '🌍', '📷', '✍️', '🧘', '💡', '🚀'];
const COLORS = ['#4e6358', '#675e51', '#9f403d', '#6366f1', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`:host { display: contents; }`],
  template: `
    <!-- Backdrop — glassmorphism -->
    <div
      class="fixed inset-0 bg-on-surface/10 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
      (click)="cancel.emit()"
    >
      <!-- Modal -->
      <div
        class="relative bg-surface-container-lowest rounded-lg p-10 w-full max-w-md my-auto mx-4"
        style="box-shadow: 0 24px 64px rgba(45,52,51,0.1)"
        (click)="$event.stopPropagation()"
      >
        <!-- Close -->
        <button (click)="cancel.emit()" class="absolute top-6 right-6 text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-all duration-200">
          <span class="material-symbols-outlined">close</span>
        </button>

        <h2 class="text-2xl font-headline font-extrabold text-on-surface mb-8">
          {{ goal ? 'Edit Goal' : 'Add New Goal' }}
        </h2>

        <!-- Title Input -->
        <div class="mb-6">
          <label class="block text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-2 font-semibold">Goal Title</label>
          <input
            type="text"
            [(ngModel)]="title"
            placeholder="e.g., Learn Photography"
            class="w-full px-5 py-4 bg-surface-container-low rounded-xl text-on-surface placeholder:text-outline font-body focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <!-- Icon Picker -->
        <div class="mb-6">
          <label class="block text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-3 font-semibold">Icon</label>
          <div class="flex flex-wrap gap-2">
            @for (icon of icons; track icon) {
              <button
                type="button"
                (click)="selectedIcon.set(icon)"
                [class]="'w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all duration-200 ' +
                  (selectedIcon() === icon ? 'bg-primary-container ring-2 ring-primary scale-110' : 'bg-surface-container-low hover:bg-surface-container hover:scale-105')"
              >
                {{ icon }}
              </button>
            }
          </div>
        </div>

        <!-- Color Picker -->
        <div class="mb-6">
          <label class="block text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-3 font-semibold">Color</label>
          <div class="flex gap-3">
            @for (color of colors; track color) {
              <button
                type="button"
                (click)="selectedColor.set(color)"
                [style.background-color]="color"
                [class]="'w-9 h-9 rounded-full transition-all duration-200 ' +
                  (selectedColor() === color ? 'ring-2 ring-offset-2 ring-on-surface-variant scale-110' : 'hover:scale-110')"
              ></button>
            }
          </div>
        </div>

        <!-- Content Sources -->
        <div class="mb-8">
          <label class="block text-[10px] font-label uppercase tracking-[0.2em] text-on-surface-variant mb-3 font-semibold">Content Sources</label>

          <!-- Existing Sources -->
          @for (source of sources(); track $index) {
            <div class="flex items-center gap-3 mb-2 p-3 bg-surface-container-low rounded-xl">
              <span class="text-[10px] font-label font-bold uppercase tracking-widest px-2 py-1 rounded"
                [class]="source.type === 'rss' ? 'text-primary bg-primary-container' :
                         source.type === 'youtube' ? 'text-error bg-error-container/30' :
                         'text-tertiary bg-tertiary-container'">
                {{ source.type }}
              </span>
              <span class="text-sm text-on-surface flex-1 truncate">{{ source.url }}</span>
              <button type="button" (click)="removeSource($index)" class="text-outline hover:text-error p-1 rounded-full hover:bg-error-container/20 transition-all duration-200">
                <span class="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          }

          <!-- Add New Source -->
          <div class="flex gap-2 mt-3">
            <select [(ngModel)]="newSourceType" class="px-3 py-3 bg-surface-container-low rounded-xl text-sm font-label text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="rss">RSS</option>
              <option value="youtube">YouTube</option>
              <option value="reddit">Reddit</option>
            </select>
            <input
              type="text"
              [(ngModel)]="newSourceUrl"
              [placeholder]="getPlaceholder()"
              class="flex-1 px-4 py-3 bg-surface-container-low rounded-xl text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              (click)="addSource()"
              [disabled]="!newSourceUrl.trim()"
              class="w-11 h-11 bg-surface-container rounded-xl flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high disabled:opacity-50 transition-all duration-200"
            >
              <span class="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            (click)="cancel.emit()"
            class="flex-1 px-6 py-4 text-on-surface-variant hover:bg-surface-container-low rounded-xl font-bold text-sm transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="!title.trim()"
            class="flex-1 px-6 py-4 bg-primary text-on-primary rounded-xl font-bold text-sm editorial-shadow hover:bg-primary-dim disabled:opacity-50 disabled:cursor-not-allowed tonal-lift"
          >
            {{ goal ? 'Save Changes' : 'Create Goal' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class GoalFormComponent implements OnInit {
  @Input() goal: Goal | null = null;
  @Output() save = new EventEmitter<Omit<Goal, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  icons = ICONS;
  colors = COLORS;

  title = '';
  selectedIcon = signal(ICONS[0]);
  selectedColor = signal(COLORS[0]);
  sources = signal<ContentSource[]>([]);

  newSourceType: 'rss' | 'youtube' | 'reddit' = 'rss';
  newSourceUrl = '';

  ngOnInit() {
    if (this.goal) {
      this.title = this.goal.title;
      this.selectedIcon.set(this.goal.icon);
      this.selectedColor.set(this.goal.color);
      this.sources.set([...this.goal.sources]);
    }
  }

  getPlaceholder(): string {
    switch (this.newSourceType) {
      case 'rss': return 'https://blog.example.com/feed.xml';
      case 'youtube': return 'https://youtube.com/@channelname';
      case 'reddit': return 'https://reddit.com/r/subreddit';
    }
  }

  addSource() {
    if (!this.newSourceUrl.trim()) return;
    this.sources.update(s => [...s, { type: this.newSourceType, url: this.newSourceUrl.trim() }]);
    this.newSourceUrl = '';
  }

  removeSource(index: number) {
    this.sources.update(s => s.filter((_, i) => i !== index));
  }

  onSave() {
    if (!this.title.trim()) return;

    this.save.emit({
      title: this.title.trim(),
      icon: this.selectedIcon(),
      color: this.selectedColor(),
      sources: this.sources()
    });
  }
}
