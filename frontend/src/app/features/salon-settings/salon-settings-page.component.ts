import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { SalonSettingsApiService } from './salon-settings-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import type { SalonSettingsResponse, BusinessHourDto } from '../../core/api/api.models';

export const DAYS_PT: Record<string, string> = {
  Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta',
  Thursday: 'Quinta', Friday: 'Sexta', Saturday: 'Sábado', Sunday: 'Domingo',
};

const DAY_ORDER = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const COMMON_TIME_ZONES = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Manaus',
  'America/Recife',
  'America/Belem',
  'America/Cuiaba',
  'America/New_York',
  'Europe/Lisbon',
] as const;

function defaultBusinessHours(): BusinessHourDto[] {
  return DAY_ORDER.map((day, i) => ({
    dayOfWeek: day,
    isClosed: i >= 5,
    startLocalTime: '09:00',
    endLocalTime: '18:00',
  }));
}

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
  readonly isSavingSettings = signal(false);
  readonly isSavingHours = signal(false);
  readonly settingsError = signal<string | null>(null);
  readonly hoursError = signal<string | null>(null);
  readonly settingsSaveOk = signal(false);
  readonly hoursSaveOk = signal(false);
  readonly settingsFieldErrors = signal<Record<string, string[]>>({});
  readonly hoursFieldErrors = signal<Record<string, string[]>>({});
  readonly hasPersistedBusinessHours = signal(false);

  // Form state — settings
  readonly formName        = signal('');
  readonly formAddress     = signal('');
  readonly formPhone       = signal('');
  readonly formTimezone    = signal('America/Sao_Paulo');
  readonly formMinCancel   = signal(0);

  readonly daysPt = DAYS_PT;
  readonly timeZones = COMMON_TIME_ZONES;
  readonly hasBusinessHoursConfigured = computed(() =>
    this.hours().some(hour => !hour.isClosed)
  );

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [s, h] = await Promise.all([
        this.api.getSettings(),
        this.api.getBusinessHours(),
      ]);
      this.settings.set(s);
      this.hasPersistedBusinessHours.set(h.length > 0);
      this.hours.set(h.length > 0 ? sortBusinessHours(h) : defaultBusinessHours());
      this.formName.set(s.name);
      this.formAddress.set(s.address);
      this.formPhone.set(s.phone);
      this.formTimezone.set(s.timeZoneId);
      this.formMinCancel.set(s.minimumCancellationNoticeMinutes);
    } catch (error) {
      const message = mapApiErrorToUi(error, 'Erro ao carregar configurações do salão.').message;
      this.settingsError.set(message);
      this.hoursError.set(message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveSettings(event: Event): Promise<void> {
    event.preventDefault();
    this.isSavingSettings.set(true);
    this.settingsError.set(null);
    this.settingsSaveOk.set(false);
    this.settingsFieldErrors.set({});
    try {
      const updated = await this.api.updateSettings({
        name: this.formName(),
        address: this.formAddress(),
        phone: this.formPhone(),
        timeZoneId: this.formTimezone(),
        minimumCancellationNoticeMinutes: this.formMinCancel(),
      });
      this.settings.set(updated);
      this.settingsSaveOk.set(true);
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao salvar configurações.');
      this.settingsFieldErrors.set(uiError.fieldErrors);
      this.settingsError.set(uiError.message);
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  toggleHourClosed(index: number): void {
    this.hours.update(h =>
      h.map((item, i) =>
        i === index
          ? {
            ...item,
            isClosed: !item.isClosed,
            startLocalTime: item.startLocalTime ?? '09:00',
            endLocalTime: item.endLocalTime ?? '18:00',
          }
          : item
      )
    );
    this.hoursSaveOk.set(false);
    this.clearHourFieldErrors(index);
  }

  updateHourTime(index: number, field: 'startLocalTime' | 'endLocalTime', value: string): void {
    this.hours.update(h =>
      h.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
    this.hoursSaveOk.set(false);
    this.clearHourFieldErrors(index, field);
  }

  async saveHours(): Promise<void> {
    this.isSavingHours.set(true);
    this.hoursError.set(null);
    this.hoursSaveOk.set(false);
    this.hoursFieldErrors.set({});
    try {
      const updated = await this.api.updateBusinessHours(this.hours());
      this.hours.set(sortBusinessHours(updated));
      this.hasPersistedBusinessHours.set(true);
      this.hoursSaveOk.set(true);
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao salvar horários.');
      this.hoursFieldErrors.set(uiError.fieldErrors);
      this.hoursError.set(uiError.message);
    } finally {
      this.isSavingHours.set(false);
    }
  }

  settingsFieldError(field: string): string | null {
    return this.settingsFieldErrors()[field]?.[0] ?? null;
  }

  hourFieldError(index: number, field: 'startLocalTime' | 'endLocalTime' | 'dayOfWeek'): string | null {
    return this.hoursFieldErrors()[`businessHours[${index}].${field}`]?.[0] ?? null;
  }

  private clearHourFieldErrors(index: number, ...fields: Array<'startLocalTime' | 'endLocalTime' | 'dayOfWeek'>): void {
    this.hoursFieldErrors.update(errors => {
      const next = { ...errors };
      const keys = fields.length > 0
        ? fields
        : (['startLocalTime', 'endLocalTime', 'dayOfWeek'] as const);
      keys.forEach(field => delete next[`businessHours[${index}].${field}`]);
      return next;
    });
  }
}
