import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SalonSettingsApiService } from './salon-settings-api.service';
import { sortBusinessHours, DAYS_PT } from './salon-settings-page.component';
import type { SalonSettingsResponse, BusinessHourDto } from '../../core/api/api.models';

const MOCK_SETTINGS: SalonSettingsResponse = {
  id: 'tenant-1', name: 'Salão da Ana', address: 'Rua A, 100',
  phone: '11999999999', timeZoneId: 'America/Sao_Paulo',
  status: 'Active', minimumCancellationNoticeMinutes: 60,
  createdAtUtc: '2024-01-01T00:00:00Z', updatedAtUtc: '2024-01-01T00:00:00Z',
};

const MOCK_HOURS: BusinessHourDto[] = [
  { dayOfWeek: 'Monday', startLocalTime: '09:00', endLocalTime: '18:00', isClosed: false },
  { dayOfWeek: 'Sunday', startLocalTime: null, endLocalTime: null, isClosed: true },
];

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(SalonSettingsApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('SalonSettingsApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('getSettings() faz GET /salon e retorna as configurações', async () => {
    const { service, http } = setup();
    const promise = service.getSettings();
    http.expectOne(r => r.url.endsWith('/salon') && r.method === 'GET').flush(MOCK_SETTINGS);
    const result = await promise;
    expect(result.name).toBe('Salão da Ana');
    expect(result.timeZoneId).toBe('America/Sao_Paulo');
  });

  it('updateSettings() faz PUT /salon com os dados corretos', async () => {
    const { service, http } = setup();
    const payload = {
      name: 'Novo Nome', address: 'Rua B', phone: '11888',
      timeZoneId: 'America/Sao_Paulo', minimumCancellationNoticeMinutes: 30,
    };
    const promise = service.updateSettings(payload);
    const req = http.expectOne(r => r.url.endsWith('/salon') && r.method === 'PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_SETTINGS, ...payload });
    const result = await promise;
    expect(result.name).toBe('Novo Nome');
  });

  it('getBusinessHours() faz GET /salon/business-hours', async () => {
    const { service, http } = setup();
    const promise = service.getBusinessHours();
    http.expectOne(r => r.url.endsWith('/salon/business-hours') && r.method === 'GET').flush(MOCK_HOURS);
    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result[0].dayOfWeek).toBe('Monday');
  });

  it('updateBusinessHours() envia os horários como businessHours[]', async () => {
    const { service, http } = setup();
    const promise = service.updateBusinessHours(MOCK_HOURS);
    const req = http.expectOne(r => r.url.endsWith('/salon/business-hours') && r.method === 'PUT');
    expect(req.request.body).toEqual({ businessHours: MOCK_HOURS });
    req.flush(MOCK_HOURS);
    await promise;
  });
});

// ─── Pure functions ────────────────────────────────────────────────────────────

describe('sortBusinessHours()', () => {
  it('ordena segunda antes de domingo', () => {
    const input: BusinessHourDto[] = [
      { dayOfWeek: 'Sunday', startLocalTime: null, endLocalTime: null, isClosed: true },
      { dayOfWeek: 'Monday', startLocalTime: '09:00', endLocalTime: '18:00', isClosed: false },
    ];
    const sorted = sortBusinessHours(input);
    expect(sorted[0].dayOfWeek).toBe('Monday');
    expect(sorted[1].dayOfWeek).toBe('Sunday');
  });

  it('mantém a ordem correta da semana (Seg→Dom)', () => {
    const days = ['Wednesday', 'Friday', 'Monday', 'Sunday', 'Tuesday'] as const;
    const input = days.map(d => ({ dayOfWeek: d, startLocalTime: null, endLocalTime: null, isClosed: true }));
    const sorted = sortBusinessHours(input);
    const order = sorted.map(h => h.dayOfWeek);
    expect(order).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Sunday']);
  });
});

describe('DAYS_PT', () => {
  it('mapeia Monday → Segunda', () => {
    expect(DAYS_PT['Monday']).toBe('Segunda');
  });

  it('mapeia Sunday → Domingo', () => {
    expect(DAYS_PT['Sunday']).toBe('Domingo');
  });
});
