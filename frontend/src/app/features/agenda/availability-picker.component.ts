import { Component, EventEmitter, Input, OnChanges, Output, computed, inject, signal } from '@angular/core';
import { AgendaApiService } from './agenda-api.service';
import { formatLocalTime, formatSlotTime, getWeekDays, parseApiDate, toApiDate } from './agenda-utils';
import { getApiErrorMessage } from '../../core/api/api-error.utils';
import type { AvailabilitySlotDto } from '../../core/api/api.models';
import type { WeekDay } from './agenda-utils';
import { AppIconComponent } from '../../shared/app-icon.component';

interface AvailabilityOptionViewModel {
  slot: AvailabilitySlotDto;
  startLabel: string;
  endLabel: string;
  rangeLabel: string;
}

@Component({
  selector: 'app-availability-picker',
  standalone: true,
  imports: [AppIconComponent],
  template: `
    <div class="picker">
      <div class="picker-week-header">
        <button type="button" class="picker-week-nav" (click)="goToPreviousWeek()" aria-label="Semana anterior">
          <app-icon name="arrow-circle-left" [size]="18" />
        </button>
        <span>{{ weekRangeLabel() }}</span>
        <button type="button" class="picker-week-nav" (click)="goToNextWeek()" aria-label="Próxima semana">
          <app-icon name="arrow-circle-right" [size]="18" />
        </button>
      </div>

      <div class="week-strip">
        @for (day of weekDays(); track day.date) {
          <button
            type="button"
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
      } @else if (error()) {
        <div class="picker-conflict" role="alert">
          <strong>Não foi possível carregar os horários.</strong>
          <span>{{ error() }}</span>
          <button type="button" class="picker-retry" (click)="retry()">Tentar novamente</button>
        </div>
      } @else if (slots().length === 0 && selectedDate()) {
        <div class="picker-empty">
          <app-icon name="information" [size]="16" />
          Nenhum horário disponível para este dia.
        </div>
      } @else {
        <div class="slots-panel">
          <div class="slots-panel__header">
            <div>
              <strong>
                <app-icon name="clock" [size]="16" />
                Horários disponíveis
              </strong>
              <span>Escolha o início do atendimento. O fim sugerido aparece no formulário.</span>
            </div>
            <span>{{ slotOptions().length }} {{ slotOptions().length === 1 ? 'opção' : 'opções' }}</span>
          </div>

          <div class="slots-list" role="listbox" [attr.aria-label]="'Horários disponíveis para ' + selectedDate()">
            @for (option of slotOptions(); track option.slot.startAtUtc) {
            <button
              type="button"
              class="slot-option"
              [class.slot-option--selected]="isSelected(option.slot)"
              (click)="selectSlot(option.slot)"
              [attr.aria-selected]="isSelected(option.slot)"
              role="option"
            >
                <span class="slot-option__range">{{ option.rangeLabel }}</span>
                <span class="slot-option__meta">
                  <span>Início {{ option.startLabel }}</span>
                  <span>Fim sugerido {{ option.endLabel }}</span>
                </span>
            </button>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .picker { display: flex; flex-direction: column; gap: var(--space-4); }
    .picker-week-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      font-weight: 600;
    }
    .picker-week-nav {
      min-width: 40px;
      min-height: 40px;
      padding: 0;
      border: 1px solid var(--color-border);
      border-radius: 999px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      font-size: var(--text-xs);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .week-strip {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--space-2);
    }
    .week-day {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: var(--space-2) var(--space-3); border-radius: 16px;
      border: 1px solid var(--color-border); background: var(--color-surface);
      cursor: pointer; min-height: 54px;
    }
    .week-day--active  { background: var(--color-primary); border-color: var(--color-primary); color: white; }
    .week-day--today:not(.week-day--active) { border-color: var(--color-primary); }
    .day-abbr { font-size: var(--text-xs); font-weight: 500; letter-spacing: 0.05em; }
    .day-num  { font-size: var(--text-base); font-weight: 700; }
    .picker-loading, .picker-empty { color: var(--color-text-tertiary); font-size: var(--text-sm); text-align: center; padding: var(--space-6) 0; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-2); }
    .picker-conflict {
      display: grid;
      gap: var(--space-2);
      background: var(--color-warning-subtle); color: var(--color-warning);
      border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); font-size: var(--text-sm);
    }
    .picker-retry {
      justify-self: start;
      min-height: 36px;
      padding: 0 var(--space-3);
      border: 1px solid rgba(192, 122, 36, 0.2);
      border-radius: var(--radius-md);
      background: rgba(255,255,255,0.88);
      color: var(--color-warning);
      font-size: var(--text-sm);
    }
    .slots-panel {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-3);
      border: 1px solid rgba(124, 59, 80, 0.12);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(245, 232, 237, 0.38), rgba(255, 255, 255, 0.96));
    }
    .slots-panel__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
    }
    .slots-panel__header div {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .slots-panel__header strong {
      color: var(--color-text-primary);
      font-size: var(--text-sm);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .slots-list {
      display: grid;
      gap: var(--space-2);
      max-height: 260px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .slot-option {
      display: grid;
      gap: 4px;
      width: 100%;
      min-height: 58px;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      background: var(--color-surface);
      color: var(--color-text-primary);
      text-align: left;
      cursor: pointer;
      transition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
    }
    .slot-option:hover {
      background: var(--color-primary-subtle);
      border-color: var(--color-primary-light);
    }
    .slot-option--selected {
      border-color: var(--color-primary);
      background: var(--color-primary-subtle);
      box-shadow: inset 0 0 0 1px rgba(124, 59, 80, 0.12);
    }
    .slot-option__range {
      font-size: var(--text-sm);
      font-weight: 700;
      line-height: 1.3;
    }
    .slot-option__meta {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      color: var(--color-text-secondary);
      font-size: var(--text-xs);
      line-height: 1.4;
    }
    @media (min-width: 768px) {
      .week-strip { grid-template-columns: repeat(7, minmax(0, 1fr)); }
      .slots-list {
        max-height: 320px;
      }
    }
    @media (max-width: 767px) {
      .slots-panel__header {
        flex-direction: column;
      }
    }
  `],
})
export class AvailabilityPickerComponent implements OnChanges {
  @Input({ required: true }) professionalId!: string;
  @Input({ required: true }) durationMinutes!: number;
  @Input() initialDate = '';
  @Output() slotSelected = new EventEmitter<AvailabilitySlotDto | null>();
  @Output() dateSelected = new EventEmitter<string>();

  private readonly api = inject(AgendaApiService);

  readonly anchorDate = signal(this.initialDate || toApiDate());
  readonly selectedDate = signal(this.initialDate || toApiDate());
  readonly slots = signal<AvailabilitySlotDto[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selected = signal<AvailabilitySlotDto | null>(null);

  readonly weekDays = computed<WeekDay[]>(() => getWeekDays(parseApiDate(this.anchorDate())));
  readonly slotOptions = computed<AvailabilityOptionViewModel[]>(() =>
    this.slots().map(slot => ({
      slot,
      startLabel: formatLocalTime(slot.startAtUtc),
      endLabel: formatLocalTime(slot.endAtUtc),
      rangeLabel: formatSlotTime(slot),
    }))
  );
  readonly weekRangeLabel = computed(() => {
    const days = this.weekDays();
    const first = days[0]?.date;
    const last = days[days.length - 1]?.date;

    if (!first || !last) {
      return '';
    }

    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    return `${formatter.format(parseApiDate(first))} - ${formatter.format(parseApiDate(last))}`;
  });

  async ngOnChanges(): Promise<void> {
    const nextDate = this.initialDate || this.selectedDate() || toApiDate();
    this.anchorDate.set(nextDate);
    this.selectedDate.set(nextDate);
    this.selected.set(null);
    this.slotSelected.emit(null);

    if (this.professionalId && this.durationMinutes > 0) {
      await this.loadSlots();
    }
  }

  async goToPreviousWeek(): Promise<void> {
    const anchor = parseApiDate(this.anchorDate());
    anchor.setDate(anchor.getDate() - 7);
    const nextDate = toApiDate(anchor);
    this.anchorDate.set(nextDate);
    await this.selectDate(nextDate);
  }

  async goToNextWeek(): Promise<void> {
    const anchor = parseApiDate(this.anchorDate());
    anchor.setDate(anchor.getDate() + 7);
    const nextDate = toApiDate(anchor);
    this.anchorDate.set(nextDate);
    await this.selectDate(nextDate);
  }

  async selectDate(date: string): Promise<void> {
    this.selectedDate.set(date);
    this.selected.set(null);
    this.dateSelected.emit(date);
    this.slotSelected.emit(null);
    await this.loadSlots();
  }

  async retry(): Promise<void> {
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
    this.error.set(null);
    this.slots.set([]);

    try {
      const response = await this.api.searchAvailability(
        this.professionalId,
        this.selectedDate(),
        this.durationMinutes,
      );
      this.slots.set(response.slots);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'Erro ao buscar disponibilidade.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
