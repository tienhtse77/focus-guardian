import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SavedPage, PageStatus } from '../../services/storage.service';

@Component({
    selector: 'app-saved-page-card',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all group">
      <!-- Favicon -->
      <img 
        [src]="page.favicon || 'https://www.google.com/s2/favicons?domain=' + getDomain(page.url)"
        class="w-5 h-5 rounded mt-0.5 shrink-0"
        alt=""
        (error)="onFaviconError($event)"
      />
      
      <!-- Content -->
      <div class="flex-1 min-w-0">
        <a 
          [href]="page.url" 
          target="_blank"
          (click)="onOpen()"
          class="block text-sm font-medium text-gray-800 hover:text-indigo-600 truncate"
        >
          {{ page.title }}
        </a>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-xs text-gray-400">{{ getDomain(page.url) }}</span>
          <span class="text-xs px-1.5 py-0.5 rounded" [class]="getStatusClass()">
            {{ getStatusLabel() }}
          </span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <!-- Status Buttons -->
        @if (page.status !== 'viewed') {
          <button 
            (click)="onStatusChange('viewed')" 
            class="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
            title="Mark as viewed"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </button>
        }
        
        <button 
          (click)="onStatusChange(page.status === 'favorite' ? 'viewed' : 'favorite')" 
          class="p-1.5 rounded"
          [class]="page.status === 'favorite' ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50'"
          title="Favorite"
        >
          <svg width="14" height="14" [attr.fill]="page.status === 'favorite' ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </button>
        
        <button 
          (click)="onStatusChange(page.status === 'watch-later' ? 'viewed' : 'watch-later')" 
          class="p-1.5 rounded"
          [class]="page.status === 'watch-later' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'"
          title="Watch later"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </button>
        
        <button 
          (click)="onDelete()" 
          class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
          title="Remove"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
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
            case 'unread': return 'bg-gray-100 text-gray-600';
            case 'viewed': return 'bg-green-100 text-green-700';
            case 'favorite': return 'bg-amber-100 text-amber-700';
            case 'watch-later': return 'bg-blue-100 text-blue-700';
        }
    }

    getStatusLabel(): string {
        switch (this.page.status) {
            case 'unread': return 'New';
            case 'viewed': return 'Viewed';
            case 'favorite': return '★ Favorite';
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
