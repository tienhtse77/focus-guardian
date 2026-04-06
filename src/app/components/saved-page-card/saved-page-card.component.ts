import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedPage, PageStatus } from '../../services/storage.service';

@Component({
    selector: 'app-saved-page-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center gap-4 p-4 rounded-lg bg-surface-container-lowest editorial-shadow hover:bg-surface-container-low group transition-all duration-200">
      <!-- Favicon -->
      <img
        [src]="page.favicon || 'https://www.google.com/s2/favicons?domain=' + getDomain(page.url) + '&sz=32'"
        class="w-5 h-5 rounded shrink-0"
        alt=""
        (error)="onFaviconError($event)"
      />

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <a
          [href]="page.url"
          target="_blank"
          (click)="onOpen()"
          class="block text-sm font-semibold text-on-surface hover:text-primary truncate"
        >
          {{ page.title }}
        </a>
        <div class="flex items-center gap-3 mt-1">
          <span class="text-xs text-on-surface-variant font-label">{{ getDomain(page.url) }}</span>
          <span class="text-[10px] font-label font-bold uppercase tracking-widest px-2 py-0.5 rounded" [class]="getStatusClass()">
            {{ getStatusLabel() }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100">
        @if (page.status !== 'viewed') {
          <button
            (click)="onStatusChange('viewed')"
            class="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all duration-200"
            title="Mark as viewed"
          >
            <span class="material-symbols-outlined text-lg">check_circle</span>
          </button>
        }

          <button
          (click)="onStatusChange(page.status === 'favorite' ? 'viewed' : 'favorite')"
          class="p-2 rounded-full hover:bg-surface-container transition-all duration-200"
          [class]="page.status === 'favorite' ? 'text-tertiary' : 'text-on-surface-variant hover:text-tertiary'"
          title="Favorite"
        >
          <span class="material-symbols-outlined text-lg" [class.filled]="page.status === 'favorite'">star</span>
        </button>

        <button
          (click)="onStatusChange(page.status === 'watch-later' ? 'viewed' : 'watch-later')"
          class="p-2 rounded-full hover:bg-surface-container transition-all duration-200"
          [class]="page.status === 'watch-later' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'"
          title="Watch later"
        >
          <span class="material-symbols-outlined text-lg" [class.filled]="page.status === 'watch-later'">schedule</span>
        </button>

        <button
          (click)="onDelete()"
          class="p-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-error transition-all duration-200"
          title="Remove"
        >
          <span class="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
    </div>
  `
})
export class SavedPageCardComponent {
    @Input() page!: SavedPage;
    @Output() statusChanged = new EventEmitter<PageStatus>();
    @Output() deleted = new EventEmitter<void>();
    @Output() opened = new EventEmitter<void>();

    getDomain(url: string): string {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    getStatusClass(): string {
        switch (this.page.status) {
            case 'unread': return 'text-primary bg-primary-container';
            case 'viewed': return 'text-outline bg-surface-container';
            case 'favorite': return 'text-tertiary bg-tertiary-container';
            case 'watch-later': return 'text-primary-dim bg-inverse-primary';
        }
    }

    getStatusLabel(): string {
        switch (this.page.status) {
            case 'unread': return 'New';
            case 'viewed': return 'Viewed';
            case 'favorite': return 'Favorite';
            case 'watch-later': return 'Watch Later';
        }
    }

    onFaviconError(event: Event) {
        (event.target as HTMLImageElement).src = '';
    }

    onStatusChange(status: PageStatus) {
        this.statusChanged.emit(status);
    }

    onDelete() {
        this.deleted.emit();
    }

    onOpen() {
        if (this.page.status === 'unread') {
            this.statusChanged.emit('viewed');
        }
        this.opened.emit();
    }
}
