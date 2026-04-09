import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedPage, PageStatus } from '../../services/storage.service';

@Component({
    selector: 'app-saved-page-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <a
      [href]="page.url"
      target="_blank"
      (click)="onOpen()"
      class="flex items-start gap-4 px-3 py-3.5 rounded-lg hover:bg-surface-container-low group transition-all duration-200 no-underline"
    >
      <!-- Favicon -->
      <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
        <img
          [src]="page.favicon || 'https://www.google.com/s2/favicons?domain=' + getDomain(page.url) + '&sz=32'"
          class="w-4 h-4 rounded-sm"
          alt=""
          (error)="onFaviconError($event)"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-on-surface group-hover:text-primary leading-snug transition-all duration-200 line-clamp-1">
          {{ page.title }}
        </p>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-outline font-label">{{ getDomain(page.url) }}</span>
          <span class="text-[10px] font-label font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" [class]="getStatusClass()">
            {{ getStatusLabel() }}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0 transition-all duration-200" (click)="$event.preventDefault(); $event.stopPropagation()">
        @if (page.status !== 'viewed') {
          <button
            (click)="onStatusChange('viewed')"
            class="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary transition-all duration-200"
            title="Mark as viewed"
          >
            <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
          </button>
        }

        <button
          (click)="onStatusChange(page.status === 'favorite' ? 'viewed' : 'favorite')"
          class="p-1.5 rounded-full hover:bg-surface-container transition-all duration-200"
          [class]="page.status === 'favorite' ? 'text-tertiary' : 'text-on-surface-variant hover:text-tertiary'"
          title="Favorite"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;" [class.filled]="page.status === 'favorite'">star</span>
        </button>

        <button
          (click)="onDelete()"
          class="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-error transition-all duration-200"
          title="Remove"
        >
          <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
        </button>
      </div>
    </a>
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
