import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, ContentSource } from '../../services/storage.service';

const ICONS = ['📚', '💻', '🎯', '🏋️', '🎨', '🎵', '🌍', '📷', '✍️', '🧘', '💡', '🚀'];
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

@Component({
  selector: 'app-goal-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-8"
      (click)="cancel.emit()"
    >
      <!-- Modal -->
      <div 
        class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md my-auto"
        (click)="$event.stopPropagation()"
      >
        <h2 class="text-2xl font-serif text-gray-800 mb-6">
          {{ goal ? 'Edit Goal' : 'Add New Goal' }}
        </h2>
        
        <!-- Title Input -->
        <div class="mb-5">
          <label class="block text-sm text-gray-500 mb-2">Goal Title</label>
          <input
            type="text"
            [(ngModel)]="title"
            placeholder="e.g., Learn Photography"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
          />
        </div>
        
        <!-- Icon Picker -->
        <div class="mb-5">
          <label class="block text-sm text-gray-500 mb-2">Icon</label>
          <div class="flex flex-wrap gap-2">
            @for (icon of icons; track icon) {
              <button
                type="button"
                (click)="selectedIcon.set(icon)"
                [class]="'w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ' +
                  (selectedIcon() === icon ? 'bg-indigo-50 ring-2 ring-indigo-400' : 'bg-gray-50 hover:bg-gray-100')"
              >
                {{ icon }}
              </button>
            }
          </div>
        </div>
        
        <!-- Color Picker -->
        <div class="mb-5">
          <label class="block text-sm text-gray-500 mb-2">Color</label>
          <div class="flex gap-2">
            @for (color of colors; track color) {
              <button
                type="button"
                (click)="selectedColor.set(color)"
                [style.background-color]="color"
                [class]="'w-8 h-8 rounded-full transition-all ' +
                  (selectedColor() === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105')"
              ></button>
            }
          </div>
        </div>
        
        <!-- Content Sources -->
        <div class="mb-6">
          <label class="block text-sm text-gray-500 mb-2">Content Sources</label>
          
          <!-- Existing Sources -->
          @for (source of sources(); track $index) {
            <div class="flex items-center gap-2 mb-2">
              <span class="text-xs px-2 py-1 rounded-lg" 
                [class]="source.type === 'rss' ? 'bg-orange-100 text-orange-700' : 
                         source.type === 'youtube' ? 'bg-red-100 text-red-700' : 
                         'bg-blue-100 text-blue-700'">
                {{ source.type }}
              </span>
              <span class="text-sm text-gray-600 flex-1 truncate">{{ source.url }}</span>
              <button type="button" (click)="removeSource($index)" class="text-gray-400 hover:text-red-500">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          }
          
          <!-- Add New Source -->
          <div class="flex gap-2 mt-2">
            <select [(ngModel)]="newSourceType" class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200">
              <option value="rss">RSS</option>
              <option value="youtube">YouTube</option>
              <option value="reddit">Reddit</option>
            </select>
            <input
              type="text"
              [(ngModel)]="newSourceUrl"
              [placeholder]="getPlaceholder()"
              class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <button 
              type="button"
              (click)="addSource()" 
              [disabled]="!newSourceUrl.trim()"
              class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            (click)="cancel.emit()"
            class="flex-1 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="onSave()"
            [disabled]="!title.trim()"
            class="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

