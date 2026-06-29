import { Component, OnInit, inject, signal } from '@angular/core';
import { SalonSettingsApiService } from './salon-settings-api.service';
import type { SalonSettingsResponse, BusinessHourDto } from '../../core/api/api.models';

export const DAYS_PT: Record<string, string> = {
  Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta',
  Thursday: 'Quinta', Friday: 'Sexta', Saturday: 'Sábado', Sunday: 'Domingo',
};

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export function sortBusinessHours(hours: BusinessHourDto[]): BusinessHourDto[] {
  return [...hours].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
}

@Component({
  selector: 'app-salon-settings-page',
  standalone: true,
  templateUrl: './salon-settings-page.component.html',
  styleUrl: './salon-settings-page.component.css',
})
export class SalonSettingsPageComponent implements OnInit {
  private readonly api = inject(SalonSettingsApiService);

  readonly settings    = signal<SalonSettingsResponse | null>(null);
  readonly hours       = signal<BusinessHourDto[]>([]);
  readonly isLoading   = signal(false);
  readonly isSaving    = signal(false);
  readonly error       = signal<string | null>(null);
  readonly saveOk      = signal(false);

  // Form state — settings
  readonly formName        = signal('');
  readonly formAddress     = signal('');
  readonly formPhone       = signal('');
  readonly formTimezone    = signal('America/Sao_Paulo');
  readonly formMinCancel   = signal(0);

  readonly daysPt = DAYS_PT;

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [s, h] = await Promise.all([
        this.api.getSettings(),
        this.api.getBusinessHours(),
      ]);
      this.settings.set(s);
      this.hours.set(sortBusinessHours(h));
      this.formName.set(s.name);
      this.formAddress.set(s.address);
      this.formPhone.set(s.phone);
      this.formTimezone.set(s.timeZoneId);
      this.formMinCancel.set(s.minimumCancellationNoticeMinutes);
    } catch {
      this.error.set('Erro ao carregar configurações do salão.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSettings(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    this.saveOk.set(false);
    try {
      const updated = await this.api.updateSettings({
        name: this.formName(),
        address: this.formAddress(),
        phone: this.formPhone(),
        timeZoneId: this.formTimezone(),
        minimumCancellationNoticeMinutes: this.formMinCancel(),
      });
      this.settings.set(updated);
      this.saveOk.set(true);
    } catch {
      this.error.set('Erro ao salvar configurações.');
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleHourClosed(index: number): void {
    this.hours.update(h =>
      h.map((item, i) =>
        i === index ? { ...item, isClosed: !item.isClosed } : item
      )
    );
    this.saveOk.set(false);
  }

  updateHourTime(index: number, field: 'startLocalTime' | 'endLocalTime', value: string): void {
    this.hours.update(h =>
      h.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
    this.saveOk.set(false);
  }

  async saveHours(): Promise<void> {
    this.isSaving.set(true);
    this.error.set(null);
    this.saveOk.set(false);
    try {
      const updated = await this.api.updateBusinessHours(this.hours());
      this.hours.set(sortBusinessHours(updated));
      this.saveOk.set(true);
    } catch {
      this.error.set('Erro ao salvar horários.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
