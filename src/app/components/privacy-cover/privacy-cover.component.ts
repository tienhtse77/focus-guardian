import { Component, Output, EventEmitter, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy-cover',
  standalone: true,
  imports: [CommonModule],
  styles: [`:host { display: contents; }
    .clock-time { font-feature-settings: "tnum"; letter-spacing: -0.04em; }
    .privacy-cover { animation: privacy-fade-in 0.2s ease; }
    @keyframes privacy-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .kbd { display: inline-flex; align-items: center; justify-content: center; padding: 1px 6px; font-family: 'Inter', system-ui, sans-serif; font-size: 10px; font-weight: 500; color: #5a6060; background: #ebeeed; border-radius: 4px; line-height: 1.4; margin: 0 2px; }
    html.dark .kbd { background: #2a302e; color: #adb3b2; }
  `],
  template: `
    <div class="privacy-cover fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background">
      <button
        (click)="exit.emit()"
        title="Exit Privacy Mode (Ctrl+Shift+H)"
        class="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg text-outline-variant hover:text-on-surface hover:bg-surface-container transition-all"
      >
        <span class="material-symbols-outlined text-lg">visibility</span>
        <span class="text-xs font-label">Exit</span>
      </button>

      <div class="flex flex-col items-center select-none">
        <div class="clock-time text-[140px] leading-none font-headline font-light text-on-surface">{{ clock() }}</div>
        <div class="mt-4 text-base font-light text-on-surface-variant tracking-wide">{{ dateLabel() }}</div>
      </div>

      <div class="absolute bottom-8 left-0 right-0 flex justify-center">
        <div class="flex items-center gap-2 text-[11px] font-label text-outline-variant">
          <span class="material-symbols-outlined text-sm">shield</span>
          <span>Privacy Mode is on</span>
          <span class="opacity-50">·</span>
          <span>Press <span class="kbd">Ctrl</span>+<span class="kbd">Shift</span>+<span class="kbd">H</span> to exit</span>
        </div>
      </div>
    </div>
  `,
})
export class PrivacyCoverComponent implements OnInit, OnDestroy {
  @Output() exit = new EventEmitter<void>();

  clock = signal('');
  dateLabel = signal('');
  private intervalId: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 10_000);
  }

  ngOnDestroy() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    this.clock.set(`${hh}:${mm}`);

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.dateLabel.set(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
  }
}
