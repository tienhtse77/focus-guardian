import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Content } from '../../services/storage.service';

@Component({
    selector: 'app-content-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button
      (click)="clicked.emit()"
      class="w-full p-6 bg-surface-container-lowest rounded-lg editorial-shadow hover:bg-surface-container-low group text-left"
    >
      <!-- Source Icon & Domain -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center">
          @switch (content.source) {
            @case ('youtube') {
              <span class="material-symbols-outlined text-error text-lg">play_circle</span>
            }
            @case ('reddit') {
              <span class="material-symbols-outlined text-tertiary text-lg">forum</span>
            }
            @default {
              <span class="material-symbols-outlined text-primary text-lg">rss_feed</span>
            }
          }
        </div>
        <span class="text-xs font-label text-on-surface-variant">{{ getSourceLabel() }}</span>
      </div>

      <!-- Title -->
      <h4 class="text-base font-headline font-bold text-on-surface leading-snug mb-2 line-clamp-2 group-hover:text-primary">
        {{ content.title }}
      </h4>

      <!-- Read Time -->
      <div class="flex items-center gap-2 mt-4">
        <span class="material-symbols-outlined text-outline text-sm">schedule</span>
        <span class="text-xs font-label text-outline">
          {{ content.estimatedMin }} min {{ content.source === 'youtube' ? 'watch' : 'read' }}
        </span>
      </div>
    </button>
  `
})
export class ContentCardComponent {
    @Input() content!: Content;
    @Output() clicked = new EventEmitter<void>();

    getSourceLabel(): string {
        if (this.content.source === 'youtube') return 'YouTube';
        if (this.content.source === 'reddit') return 'Reddit';
        return 'RSS';
    }
}
