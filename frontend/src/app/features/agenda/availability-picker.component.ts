import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { AgendaApiService } from './agenda-api.service';
import { conflictTypeLabel, formatSlotTime, getWeekDays, toApiDate } from './agenda-utils';
import type { AvailabilitySlotDto } from '../../core/api/api.models';
import type { WeekDay } from './agenda-utils';

@Component({
  selector: 'app-availability-picker',
  standalone: true,
  template: `
    <div class="picker">
      <!-- Seletor de semana -->
      <div class="week-strip">
        @for (day of weekDays; track day.date) {
          <button
            class="week-day"
            [class.week-day--active]="selectedDate() === day.date"
            [class.week-day--today]="day.isToday"
            (click)="selectDate(day.date)"
            [attr.aria-label]="day.abbr + ' ' + day.num"
            [attr.aria-pressed]="selectedDate() === day.date"
          >
            <span class="day-abbr">{{ day.abbr }}</span>
            <span class="day-num">{{ day.num }}</span>
          </button>
        }
      </div>

      @if (isLoading()) {
        <div class="picker-loading" aria-live="polite">Buscando horários…</div>
      } @else if (conflictError()) {
        <div class="picker-conflict" role="alert">
          <strong>Horário indisponível:</strong> {{ conflictError() }}
        </div>
      } @else if (slots().length === 0 && selectedDate()) {
        <div class="picker-empty">
          Nenhum horário disponível para este dia.
        </div>
      } @else {
        <div class="slots-grid" role="group" [attr.aria-label]="'Horários disponíveis para ' + selectedDate()">
          @for (slot of slots(); track slot.startAtUtc) {
            <button
              class="slot-btn"
              [class.slot-btn--selected]="isSelected(slot)"
              (click)="selectSlot(slot)"
              [attr.aria-pressed]="isSelected(slot)"
            >
              {{ formatSlot(slot) }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-direction: column; gap: var(--space-4); }
    .week-strip {
      display: flex; gap: var(--space-1); overflow-x: auto; scrollbar-width: none;
      padding-bottom: var(--space-1);
    }
    .week-day {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      border: 1px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; min-width: 44px; flex-shrink: 0; transition: background 0.1s;
    }
    .week-day--active  { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    .week-day--today:not(.week-day--active) { border-color: var(--color-primary); }
    .day-abbr { font-size: var(--text-xs); font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
    .day-num  { font-size: var(--text-base); font-weight: 700; }
    .picker-loading, .picker-empty { color: var(--color-text-tertiary); font-size: var(--text-sm); text-align: center; padding: var(--space-6) 0; }
    .picker-conflict {
      background: var(--color-warning-subtle); color: var(--color-warning);
      border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm);
    }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: var(--space-2); }
    .slot-btn {
      height: 44px; border: 1px solid var(--color-border); border-radius: var(--radius-md);
      background: var(--color-surface); font-family: var(--font-body); font-size: var(--text-sm);
      font-weight: 500; color: var(--color-text-primary); cursor: pointer; transition: background 0.1s;
    }
    .slot-btn:hover { background: var(--color-primary-subtle); border-color: var(--color-primary-light); }
    .slot-btn--selected { background: var(--color-primary); color: white; border-color: var(--color-primary); }
  `],
})
export class AvailabilityPickerComponent implements OnChanges {
  @Input({ required: true }) professionalId!: string;
  @Input({ required: true }) durationMinutes!: number;
  @Output() slotSelected = new EventEmitter<AvailabilitySlotDto>();

  private readonly api = inject(AgendaApiService);

  readonly weekDays: WeekDay[]       = getWeekDays();
  readonly selectedDate             = signal<string>(this.weekDays[0]?.date ?? toApiDate());
  readonly slots                    = signal<AvailabilitySlotDto[]>([]);
  readonly isLoading                = signal(false);
  readonly conflictError            = signal<string | null>(null);
  readonly selected                 = signal<AvailabilitySlotDto | null>(null);

  readonly formatSlot = formatSlotTime;

  async ngOnChanges(): Promise<void> {
    if (this.professionalId && this.durationMinutes) {
      await this.loadSlots();
    }
  }

  async selectDate(date: string): Promise<void> {
    this.selectedDate.set(date);
    this.selected.set(null);
    this.slotSelected.emit(undefined as unknown as AvailabilitySlotDto);
    await this.loadSlots();
  }

  selectSlot(slot: AvailabilitySlotDto): void {
    this.selected.set(slot);
    this.slotSelected.emit(slot);
  }

  isSelected(slot: AvailabilitySlotDto): boolean {
    return this.selected()?.startAtUtc === slot.startAtUtc;
  }

  private async loadSlots(): Promise<void> {
    this.isLoading.set(true);
    this.conflictError.set(null);
    this.slots.set([]);
    try {
      const res = await this.api.searchAvailability(
        this.professionalId, this.selectedDate(), this.durationMinutes
      );
      this.slots.set(res.slots);
    } catch {
      this.conflictError.set('Erro ao buscar disponibilidade.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
