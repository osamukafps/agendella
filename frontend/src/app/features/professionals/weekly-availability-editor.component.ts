import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { ProfessionalsApiService } from './professionals-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import type { WeeklyAvailabilityEntryDto } from '../../core/api/api.models';
import { TimePickerComponent } from '../../shared/time-picker.component';

export interface DaySlot {
  dayOfWeek: string;
  dayLabel: string;
  start: string;
  end: string;
  enabled: boolean;
}

export const DAYS: { key: string; label: string }[] = [
  { key: 'Monday',    label: 'Segunda' },
  { key: 'Tuesday',  label: 'Terça'   },
  { key: 'Wednesday',label: 'Quarta'  },
  { key: 'Thursday', label: 'Quinta'  },
  { key: 'Friday',   label: 'Sexta'   },
  { key: 'Saturday', label: 'Sábado'  },
  { key: 'Sunday',   label: 'Domingo' },
];

export function slotsToEditorRows(slots: WeeklyAvailabilityEntryDto[]): DaySlot[] {
  return DAYS.map(day => {
    const existing = slots.find(s => s.dayOfWeek === day.key);
    return {
      dayOfWeek: day.key,
      dayLabel: day.label,
      start: existing?.startLocalTime ?? '09:00',
      end: existing?.endLocalTime ?? '18:00',
      enabled: !!existing,
    };
  });
}

export function editorRowsToSlots(rows: DaySlot[]): WeeklyAvailabilityEntryDto[] {
  return rows
    .filter(r => r.enabled)
    .map(r => ({
      dayOfWeek: r.dayOfWeek,
      startLocalTime: r.start,
      endLocalTime: r.end,
    }));
}

export function isValidTimeRange(start: string, end: string): boolean {
  if (!start || !end) return false;
  return start < end;
}

@Component({
  selector: 'app-weekly-availability-editor',
  standalone: true,
  imports: [TimePickerComponent],
  templateUrl: './weekly-availability-editor.component.html',
  styleUrl: './weekly-availability-editor.component.css',
})
export class WeeklyAvailabilityEditorComponent implements OnInit {
  @Input({ required: true }) professionalId!: string;

  private readonly api = inject(ProfessionalsApiService);

  readonly rows       = signal<DaySlot[]>(DAYS.map(d => ({
    dayOfWeek: d.key, dayLabel: d.label,
    start: '09:00', end: '18:00', enabled: false,
  })));
  readonly isLoading  = signal(false);
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  readonly saveOk     = signal(false);
  readonly hasLoaded  = signal(false);
  readonly hasConfiguredAvailability = computed(() =>
    this.rows().some(row => row.enabled)
  );

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const slots = await this.api.getWeeklyAvailability(this.professionalId);
      this.rows.set(slotsToEditorRows(slots));
      this.hasLoaded.set(true);
    } catch (error) {
      this.error.set(mapApiErrorToUi(error, 'Erro ao carregar disponibilidade.').message);
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleDay(index: number): void {
    this.rows.update(rows =>
      rows.map((r, i) => i === index ? { ...r, enabled: !r.enabled } : r)
    );
    this.error.set(null);
    this.saveOk.set(false);
  }

  updateTime(index: number, field: 'start' | 'end', value: string): void {
    this.rows.update(rows =>
      rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    );
    this.error.set(null);
    this.saveOk.set(false);
  }

  hasError(index: number): boolean {
    const row = this.rows()[index];
    return row.enabled && !isValidTimeRange(row.start, row.end);
  }

  get hasAnyError(): boolean {
    return this.rows().some((_, i) => this.hasError(i));
  }

  async save(): Promise<void> {
    if (this.hasAnyError) return;
    this.isSaving.set(true);
    this.error.set(null);
    this.saveOk.set(false);
    try {
      const slots = editorRowsToSlots(this.rows());
      await this.api.updateWeeklyAvailability(this.professionalId, slots);
      this.saveOk.set(true);
    } catch (error) {
      this.error.set(mapApiErrorToUi(error, 'Erro ao salvar disponibilidade.').message);
    } finally {
      this.isSaving.set(false);
    }
  }
}
