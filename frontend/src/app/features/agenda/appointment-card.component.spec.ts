import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppointmentCardComponent } from './appointment-card.component';
import { getStatusLabel } from './agenda-utils';
import type { AgendaAppointmentViewModel } from './agenda-utils';
import type { AppointmentResponse } from '../../core/api/api.models';

const BASE_APPT: AppointmentResponse = {
  id: 'appt-1',
  clientId: 'cli-1',
  professionalId: 'prof-1',
  serviceId: 'svc-1',
  startAtUtc: '2024-06-10T13:00:00Z',
  endAtUtc: '2024-06-10T14:00:00Z',
  status: 'Scheduled',
  requiresReview: false,
  reviewReason: null,
  createdAtUtc: '2024-06-10T00:00:00Z',
  updatedAtUtc: '2024-06-10T00:00:00Z',
};

function buildVm(appt: AppointmentResponse, overrides: Partial<AgendaAppointmentViewModel> = {}): AgendaAppointmentViewModel {
  return {
    id: appt.id,
    appointment: appt,
    clientName: 'Maria',
    serviceName: 'Corte',
    professionalName: 'Ana Costa',
    durationMinutes: 60,
    startAtUtc: appt.startAtUtc,
    endAtUtc: appt.endAtUtc,
    startTimeLabel: '10:00',
    endTimeLabel: '11:00',
    timeRangeLabel: '10:00 - 11:00',
    durationLabel: '1h',
    statusLabel: getStatusLabel(appt.status),
    gridRow: '1 / span 2',
    layout: {
      topPx: 0,
      heightPx: 136,
      laneIndex: 0,
      laneCount: 1,
      clusterId: 'cluster-1',
    },
    ...overrides,
  };
}

function setupComponent(appt: AppointmentResponse, overrides: Partial<AgendaAppointmentViewModel> = {}) {
  TestBed.configureTestingModule({ imports: [AppointmentCardComponent] });
  const fixture = TestBed.createComponent(AppointmentCardComponent);
  fixture.componentInstance.appointment = buildVm(appt, overrides);
  fixture.detectChanges();
  return fixture;
}

describe('AppointmentCardComponent — review badge', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('não exibe o banner de revisão quando requiresReview é false', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: false, reviewReason: null });
    expect(fixture.debugElement.query(By.css('.review-banner'))).toBeNull();
  });

  it('exibe o banner de revisão quando requiresReview é true', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true });
    expect(fixture.debugElement.query(By.css('.review-banner'))).not.toBeNull();
  });

  it('exibe reviewReason quando fornecido junto com requiresReview', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true, reviewReason: 'Bloco criado' });
    const reason = fixture.debugElement.query(By.css('.review-reason'));
    expect(reason).not.toBeNull();
    expect(reason.nativeElement.textContent).toContain('Bloco criado');
  });

  it('não exibe review-reason quando reviewReason é null', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true, reviewReason: null });
    expect(fixture.debugElement.query(By.css('.review-reason'))).toBeNull();
  });

  it('o banner de revisão tem role=alert para acessibilidade', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true });
    const banner = fixture.debugElement.query(By.css('.review-banner'));
    expect(banner.nativeElement.getAttribute('role')).toBe('alert');
  });

  it('aplica classe appt-card--review no article quando requiresReview é true', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true });
    const article = fixture.debugElement.query(By.css('article.appt-card'));
    expect(article.classes['appt-card--review']).toBe(true);
  });

  it('não aplica appt-card--review quando requiresReview é false', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: false });
    const article = fixture.debugElement.query(By.css('article.appt-card'));
    expect(article.classes['appt-card--review']).toBeFalsy();
  });
});

describe('AppointmentCardComponent — conteúdo do card', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('exibe o nome do cliente', () => {
    const fixture = setupComponent(BASE_APPT, { clientName: 'Fernanda Lima' });
    const client = fixture.debugElement.query(By.css('.appt-client'));
    expect(client.nativeElement.textContent).toContain('Fernanda Lima');
  });

  it('exibe o nome do serviço', () => {
    const fixture = setupComponent(BASE_APPT, { serviceName: 'Manicure' });
    const service = fixture.debugElement.query(By.css('.appt-service'));
    expect(service.nativeElement.textContent).toContain('Manicure');
  });

  it('exibe o nome do profissional', () => {
    const fixture = setupComponent(BASE_APPT, { professionalName: 'Ana Costa' });
    const prof = fixture.debugElement.query(By.css('.appt-prof'));
    expect(prof).not.toBeNull();
    expect(prof.nativeElement.textContent).toContain('Ana Costa');
  });

  it('exibe a faixa de horário', () => {
    const fixture = setupComponent(BASE_APPT, { timeRangeLabel: '10:30 - 11:15' });
    const time = fixture.debugElement.query(By.css('.appt-meta time'));
    expect(time.nativeElement.textContent).toContain('10:30 - 11:15');
  });

  it('badge do status mostra "Agendado" para Scheduled', () => {
    const fixture = setupComponent({ ...BASE_APPT, status: 'Scheduled' });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.nativeElement.textContent).toContain('Agendado');
  });

  it('badge do status mostra "Concluído" para Completed', () => {
    const fixture = setupComponent({ ...BASE_APPT, status: 'Completed' }, { statusLabel: 'Concluído' });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.nativeElement.textContent).toContain('Concluído');
  });

  it('badge tem classe badge-review quando requiresReview é true', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.classes['badge-review']).toBe(true);
  });

  it('emite actionRequested quando o card é interativo', () => {
    TestBed.configureTestingModule({ imports: [AppointmentCardComponent] });
    const fixture = TestBed.createComponent(AppointmentCardComponent);
    const emitted: string[] = [];

    fixture.componentInstance.appointment = buildVm(BASE_APPT);
    fixture.componentInstance.showActionTrigger = true;
    fixture.componentInstance.actionRequested.subscribe(() => emitted.push('ok'));
    fixture.detectChanges();

    fixture.debugElement.query(By.css('.appt-card__overlay')).nativeElement.click();
    expect(emitted).toEqual(['ok']);
  });

  it('aplica versão compacta quando o card está em cluster sobreposto', () => {
    const fixture = setupComponent(BASE_APPT, {
      layout: {
        topPx: 0,
        heightPx: 136,
        laneIndex: 1,
        laneCount: 2,
        clusterId: 'cluster-2',
      },
    });

    const article = fixture.debugElement.query(By.css('article.appt-card'));
    expect(article.classes['appt-card--compact']).toBe(true);
    expect(article.classes['appt-card--compressed']).toBeFalsy();
  });

  it('aplica versão comprimida quando há 3 ou mais lanes', () => {
    const fixture = setupComponent(BASE_APPT, {
      layout: {
        topPx: 0,
        heightPx: 136,
        laneIndex: 2,
        laneCount: 3,
        clusterId: 'cluster-3',
      },
    });

    const article = fixture.debugElement.query(By.css('article.appt-card'));
    expect(article.classes['appt-card--compressed']).toBe(true);
  });
});
