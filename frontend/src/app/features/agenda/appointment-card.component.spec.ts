import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppointmentCardComponent } from './appointment-card.component';
import type { AppointmentResponse } from '../../core/api/api.models';

const BASE_APPT: AppointmentResponse = {
  id: 'appt-1', clientId: 'cli-1', professionalId: 'prof-1', serviceId: 'svc-1',
  startAtUtc: '2024-06-10T13:00:00Z', endAtUtc: '2024-06-10T14:00:00Z',
  status: 'Scheduled', requiresReview: false, reviewReason: null,
  createdAtUtc: '2024-06-10T00:00:00Z', updatedAtUtc: '2024-06-10T00:00:00Z',
};

function setupComponent(appt: AppointmentResponse, opts: {
  clientName?: string;
  serviceName?: string;
  duration?: string;
  professionalName?: string | null;
  showProfessional?: boolean;
} = {}) {
  TestBed.configureTestingModule({ imports: [AppointmentCardComponent] });
  const fixture = TestBed.createComponent(AppointmentCardComponent);
  const cmp = fixture.componentInstance;
  cmp.appt = appt;
  cmp.clientName = opts.clientName ?? 'Maria';
  cmp.serviceName = opts.serviceName ?? 'Corte';
  cmp.duration = opts.duration ?? '30 min';
  if (opts.professionalName !== undefined) cmp.professionalName = opts.professionalName;
  if (opts.showProfessional !== undefined) cmp.showProfessional = opts.showProfessional;
  fixture.detectChanges();
  return fixture;
}

// ─── Badge de revisão — visibilidade ─────────────────────────────────────────

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

// ─── Conteúdo do card ────────────────────────────────────────────────────────

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

  it('exibe nome do profissional quando showProfessional é true', () => {
    const fixture = setupComponent(BASE_APPT, {
      showProfessional: true, professionalName: 'Ana Costa',
    });
    const prof = fixture.debugElement.query(By.css('.appt-prof'));
    expect(prof).not.toBeNull();
    expect(prof.nativeElement.textContent).toContain('Ana Costa');
  });

  it('não exibe nome do profissional quando showProfessional é false', () => {
    const fixture = setupComponent(BASE_APPT, { showProfessional: false, professionalName: 'Ana' });
    expect(fixture.debugElement.query(By.css('.appt-prof'))).toBeNull();
  });

  it('badge do status mostra "Agendado" para Scheduled', () => {
    const fixture = setupComponent({ ...BASE_APPT, status: 'Scheduled' });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.nativeElement.textContent).toContain('Agendado');
  });

  it('badge do status mostra "Concluído" para Completed', () => {
    const fixture = setupComponent({ ...BASE_APPT, status: 'Completed' });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.nativeElement.textContent).toContain('Concluído');
  });

  it('badge tem classe badge-review quando requiresReview é true', () => {
    const fixture = setupComponent({ ...BASE_APPT, requiresReview: true });
    const badge = fixture.debugElement.query(By.css('.appt-badge'));
    expect(badge.classes['badge-review']).toBe(true);
  });
});
