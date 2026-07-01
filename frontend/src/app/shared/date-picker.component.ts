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
import { formatDateForDisplay, getTodayIsoDate, isValidIsoDate } from '../core/utils/date-time';
import { ModalSheetComponent } from './modal-sheet.component';

interface CalendarCell {
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [ModalSheetComponent, NgStyle],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.css',
})
export class DatePickerComponent implements OnChanges {
  @Input() value = '';
  @Input() placeholder = 'Selecionar data';
  @Input() disabled = false;
  @Input() invalid = false;
  @Input() ariaLabel = 'Selecionar data';

  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('triggerButton') private readonly triggerButton?: ElementRef<HTMLButtonElement>;

  protected readonly weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  protected readonly isOpen = signal(false);
  protected readonly isMobile = signal(false);
  protected readonly monthCursor = signal(startOfMonth(new Date()));
  protected readonly currentValue = signal('');
  protected readonly desktopPanelStyles = signal<Record<string, string>>({});

  protected readonly displayValue = computed(() =>
    this.currentValue() ? formatDateForDisplay(this.currentValue()) : this.placeholder
  );

  protected readonly monthLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(this.monthCursor())
  );

  protected readonly calendarCells = computed<CalendarCell[]>(() => {
    const cursor = this.monthCursor();
    const firstDay = startOfMonth(cursor);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(firstDay);
    gridStart.setDate(firstDay.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const current = new Date(gridStart);
      current.setDate(gridStart.getDate() + index);
      const isoDate = toIsoDate(current);

      return {
        isoDate,
        dayNumber: current.getDate(),
        inCurrentMonth: current.getMonth() === cursor.getMonth(),
        isToday: isoDate === getTodayIsoDate(),
        isSelected: isoDate === this.currentValue(),
      };
    });
  });

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.currentValue.set(this.value);

    if (isValidIsoDate(this.currentValue())) {
      const [year, month] = this.currentValue().split('-').map(Number);
      this.monthCursor.set(new Date(year, month - 1, 1));
    }
  }

  protected toggleOpen(): void {
    if (this.disabled) {
      return;
    }

    this.isMobile.set(this.readIsMobileViewport());
    if (!this.isOpen()) {
      this.syncMonthCursor();
      if (!this.isMobile()) {
        this.desktopPanelStyles.set(this.calculateDesktopPanelStyles(336, 360));
      }
    }
    this.isOpen.update(open => !open);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected previousMonth(): void {
    const cursor = this.monthCursor();
    this.monthCursor.set(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const cursor = this.monthCursor();
    this.monthCursor.set(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  }

  protected selectDate(date: string): void {
    this.currentValue.set(date);
    this.valueChange.emit(date);
    this.close();
  }

  protected selectToday(): void {
    this.selectDate(getTodayIsoDate());
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
      this.desktopPanelStyles.set(this.calculateDesktopPanelStyles(336, 360));
    }
  }

  private syncMonthCursor(): void {
    if (isValidIsoDate(this.currentValue())) {
      const [year, month] = this.currentValue().split('-').map(Number);
      this.monthCursor.set(new Date(year, month - 1, 1));
      return;
    }

    this.monthCursor.set(startOfMonth(new Date()));
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
