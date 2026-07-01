import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  ViewChild,
  computed,
  signal,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import {
  TIME_PICKER_HOURS,
  TIME_PICKER_MINUTES,
  formatTimeFromParts,
  isValidTimeValue,
} from '../core/utils/date-time';
import { ModalSheetComponent } from './modal-sheet.component';
import { AppIconComponent } from './app-icon.component';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [ModalSheetComponent, NgStyle, AppIconComponent],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.css',
})
export class TimePickerComponent implements OnChanges {
  @Input() value = '';
  @Input() placeholder = 'Selecionar horário';
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() ariaLabel = 'Selecionar horário';
  @Input() compact = false;

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('triggerButton') private readonly triggerButton?: ElementRef<HTMLButtonElement>;

  protected readonly hours = TIME_PICKER_HOURS;
  protected readonly minutes = TIME_PICKER_MINUTES;
  protected readonly isOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly draftHour = signal('09');
  protected readonly draftMinute = signal('00');
  protected readonly currentValue = signal('');
  protected readonly desktopPanelStyles = signal<Record<string, string>>({});

  protected readonly displayValue = computed(() =>
    isValidTimeValue(this.currentValue()) ? this.currentValue() : this.placeholder
  );

  protected readonly draftValue = computed(() =>
    formatTimeFromParts(this.draftHour(), this.draftMinute())
  );

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.currentValue.set(this.value);
  }

  protected toggleOpen(): void {
    if (this.disabled) {
      return;
    }

    this.syncDraftValue();
    this.isMobile.set(this.readIsMobileViewport());
    if (!this.isOpen() && !this.isMobile()) {
      this.desktopPanelStyles.set(this.calculateDesktopPanelStyles(352, 440));
    }
    this.isOpen.update(open => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected selectHour(hour: string): void {
    this.draftHour.set(hour);
    this.emitDraft();
  }

  protected selectMinute(minute: string): void {
    this.draftMinute.set(minute);
    this.emitDraft();
  }

  protected clearValue(): void {
    this.currentValue.set('');
    this.valueChange.emit('');
    this.close();
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen() || this.isMobile()) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  @HostListener('window:resize')
  protected onResize(): void {
    if (this.isOpen() && !this.isMobile()) {
      this.desktopPanelStyles.set(this.calculateDesktopPanelStyles(352, 440));
    }
  }

  private emitDraft(): void {
    this.currentValue.set(this.draftValue());
    this.valueChange.emit(this.draftValue());
  }

  private syncDraftValue(): void {
    if (isValidTimeValue(this.currentValue())) {
      const [hours, minutes] = this.currentValue().split(':');
      this.draftHour.set(hours);
      this.draftMinute.set(minutes);
      return;
    }

    this.draftHour.set('09');
    this.draftMinute.set('00');
  }

  private readIsMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  }

  private calculateDesktopPanelStyles(panelWidth: number, panelHeight: number): Record<string, string> {
    const trigger = this.triggerButton?.nativeElement;
    if (!trigger || typeof window === 'undefined') {
      return {};
    }

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(panelWidth, viewportWidth - 32);
    const left = Math.min(Math.max(16, rect.right - width), viewportWidth - width - 16);
    const fitsBelow = rect.bottom + 8 + panelHeight <= viewportHeight - 16;
    const top = fitsBelow
      ? rect.bottom + 8
      : Math.max(16, rect.top - panelHeight - 8);

    return {
      width: `${width}px`,
      left: `${left}px`,
      top: `${top}px`,
    };
  }
}
