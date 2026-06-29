import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AgendaApiService } from './agenda-api.service';
import { AppointmentFormComponent } from './appointment-form.component';
import { AppointmentActionsComponent } from './appointment-actions.component';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { ClientsApiService } from '../clients/clients-api.service';
import { ServicesApiService } from '../services/services-api.service';
import { AuthService } from '../../core/auth/auth.service';
import {
  formatLocalTime, getStatusLabel, getStatusBadgeClass,
  getWeekDays, isSameLocalDay, formatDuration, todayApiDate,
} from './agenda-utils';
import type { AppointmentResponse, ProfessionalResponse, ClientResponse, ServiceResponse } from '../../core/api/api.models';

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [AppointmentFormComponent, AppointmentActionsComponent],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.css',
})
export class AgendaPageComponent implements OnInit {
  protected readonly agendaApi      = inject(AgendaApiService);
  private readonly profApi          = inject(ProfessionalsApiService);
  private readonly clientsApi       = inject(ClientsApiService);
  private readonly servicesApi      = inject(ServicesApiService);
  readonly auth                     = inject(AuthService);

  readonly weekDays           = getWeekDays();
  readonly selectedDate       = signal(todayApiDate());
  readonly allAppointments    = signal<AppointmentResponse[]>([]);
  readonly professionals      = signal<ProfessionalResponse[]>([]);
  readonly clients            = signal<ClientResponse[]>([]);
  readonly services           = signal<ServiceResponse[]>([]);
  readonly isLoading          = signal(false);
  readonly error              = signal<string | null>(null);
  readonly expandedId         = signal<string | null>(null);
  readonly formMode           = signal<'create' | 'reschedule' | null>(null);
  readonly reschedulingAppt   = signal<AppointmentResponse | null>(null);

  /** Filtragem client-side: agendamentos do dia selecionado, ordenados por horário */
  readonly appointments = computed(() =>
    this.allAppointments()
      .filter(a => isSameLocalDay(a.startAtUtc, this.selectedDate()))
      .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc))
  );

  /** Maps id→name para display */
  readonly professionalMap = computed(() =>
    new Map(this.professionals().map(p => [p.id, p.name]))
  );
  readonly clientMap = computed(() =>
    new Map(this.clients().map(c => [c.id, c.name]))
  );
  readonly serviceMap = computed(() =>
    new Map(this.services().map(s => [s.id, s.name]))
  );

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  async loadAll(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [apptRes, profRes, cliRes, svcRes] = await Promise.all([
        this.agendaApi.list({ pageSize: 200 }),
        this.profApi.list(),
        this.clientsApi.list(),
        this.servicesApi.list(),
      ]);
      this.allAppointments.set(apptRes.items);
      this.professionals.set(profRes.items);
      this.clients.set(cliRes.items);
      this.services.set(svcRes.items);
    } catch {
      this.error.set('Erro ao carregar agenda.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectDay(date: string): void {
    this.selectedDate.set(date);
    this.expandedId.set(null);
    this.formMode.set(null);
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  openCreate(): void {
    this.formMode.set('create');
    this.reschedulingAppt.set(null);
    this.expandedId.set(null);
  }

  openReschedule(appt: AppointmentResponse): void {
    this.reschedulingAppt.set(appt);
    this.formMode.set('reschedule');
    this.expandedId.set(null);
  }

  closeForm(): void { this.formMode.set(null); }

  onSaved(appt: AppointmentResponse): void {
    this.allAppointments.update(list => {
      const idx = list.findIndex(a => a.id === appt.id);
      return idx >= 0 ? list.map(a => a.id === appt.id ? appt : a) : [appt, ...list];
    });
    this.formMode.set(null);
  }

  async onComplete(appt: AppointmentResponse): Promise<void> {
    try {
      await this.agendaApi.complete(appt.id);
      this.updateStatus(appt.id, 'Completed');
    } catch { this.error.set('Erro ao concluir agendamento.'); }
  }

  async onNoShow(appt: AppointmentResponse): Promise<void> {
    try {
      await this.agendaApi.noShow(appt.id);
      this.updateStatus(appt.id, 'NoShow');
    } catch { this.error.set('Erro ao registrar falta.'); }
  }

  async onCancel(appt: AppointmentResponse): Promise<void> {
    if (!confirm('Cancelar este agendamento?')) return;
    try {
      await this.agendaApi.cancel(appt.id);
      this.updateStatus(appt.id, 'Cancelled');
    } catch { this.error.set('Erro ao cancelar agendamento.'); }
  }

  async onResolveReview(appt: AppointmentResponse): Promise<void> {
    try {
      await this.agendaApi.resolveReview(appt.id);
      this.allAppointments.update(list =>
        list.map(a => a.id === appt.id ? { ...a, requiresReview: false, reviewReason: null } : a)
      );
      this.expandedId.set(null);
    } catch { this.error.set('Erro ao resolver revisão.'); }
  }

  // ─── Template helpers ───────────────────────────────────────────────────────

  clientName(id: string): string   { return this.clientMap().get(id) ?? '—'; }
  profName(id: string): string     { return this.professionalMap().get(id) ?? '—'; }
  serviceName(id: string): string  { return this.serviceMap().get(id) ?? '—'; }
  startTime(appt: AppointmentResponse): string { return formatLocalTime(appt.startAtUtc); }
  duration(appt: AppointmentResponse): string  { return formatDuration(appt.startAtUtc, appt.endAtUtc); }
  statusLabel(appt: AppointmentResponse): string { return getStatusLabel(appt.status); }
  badgeClass(appt: AppointmentResponse): string  { return getStatusBadgeClass(appt.status, appt.requiresReview); }

  private updateStatus(
    id: string,
    status: 'Completed' | 'Cancelled' | 'NoShow'
  ): void {
    this.allAppointments.update(list =>
      list.map(a => a.id === id ? { ...a, status } : a)
    );
    this.expandedId.set(null);
  }
}
