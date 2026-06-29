import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ProfessionalsApiService } from './professionals-api.service';
import type { WeeklyAvailabilityEntryDto } from '../../core/api/api.models';

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

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const slots = await this.api.getWeeklyAvailability(this.professionalId);
      this.rows.set(slotsToEditorRows(slots));
    } catch {
      this.error.set('Erro ao carregar disponibilidade.');
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleDay(index: number): void {
    this.rows.update(rows =>
      rows.map((r, i) => i === index ? { ...r, enabled: !r.enabled } : r)
    );
  }

  updateTime(index: number, field: 'start' | 'end', value: string): void {
    this.rows.update(rows =>
      rows.map((r, i) => i === index ? { ...r, [field]: value } : r)
    );
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
    } catch {
      this.error.set('Erro ao salvar disponibilidade.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
