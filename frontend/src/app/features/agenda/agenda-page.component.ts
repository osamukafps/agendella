import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AgendaApiService } from './agenda-api.service';
import { ClientsApiService } from '../clients/clients-api.service';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { ServicesApiService } from '../services/services-api.service';
import { SalonSettingsApiService } from '../salon-settings/salon-settings-api.service';
import { AppointmentCardComponent } from './appointment-card.component';
import { AppointmentFormComponent } from './appointment-form.component';
import { getApiErrorMessage } from '../../core/api/api-error.utils';
import { collectCursorPages } from '../../core/api/cursor-pagination';
import {
  buildAgendaAppointments,
  buildAgendaLookupMaps,
  buildAgendaSummary,
  buildTimelineSlots,
  DEFAULT_TIMELINE_END_MINUTES,
  formatAgendaDateLabel,
  formatBusinessHoursLabel,
  getApiDayOfWeek,
  getNowMarkerTop,
  getTimelineBounds,
  getWeekDays,
  isSameLocalDay,
  parseApiDate,
  shiftApiDate,
  SLOT_MINUTES,
  todayApiDate,
  toApiDate,
} from './agenda-utils';
import type {
  AgendaAppointmentViewModel,
  AgendaLookupMaps,
  TimelineBounds,
  WeekDay,
} from './agenda-utils';
import type {
  AppointmentResponse,
  BusinessHourDto,
  ClientResponse,
  ProfessionalResponse,
  ServiceResponse,
} from '../../core/api/api.models';

const AGENDA_PAGE_SIZE = 100;

interface SummaryCardViewModel {
  id: string;
  label: string;
  value: string;
  detail: string;
}

function minutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function formatWeekRange(days: WeekDay[]): string {
  if (days.length === 0) {
    return '';
  }

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const first = formatter.format(parseApiDate(days[0].date));
  const last = formatter.format(parseApiDate(days[days.length - 1].date));
  return `${first} - ${last}`;
}

function lastLocalAppointmentDate(appointments: AppointmentResponse[]): string | null {
  const last = appointments[appointments.length - 1];
  return last ? toApiDate(new Date(last.startAtUtc)) : null;
}

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [AppointmentCardComponent, AppointmentFormComponent],
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent implements OnInit, OnDestroy {
  @Input() scope: 'all' | 'mine' | undefined = 'all';

  private readonly authService = inject(AuthService);
  private readonly agendaApi = inject(AgendaApiService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly professionalsApi = inject(ProfessionalsApiService);
  private readonly servicesApi = inject(ServicesApiService);
  private readonly salonSettingsApi = inject(SalonSettingsApiService);

  private readonly currentDateTime = signal(new Date());
  private readonly nowTimerId = typeof window === 'undefined'
    ? null
    : window.setInterval(() => this.currentDateTime.set(new Date()), 60_000);

  protected readonly selectedDate = signal(todayApiDate());
  protected readonly isLoading = signal(false);
  protected readonly hasLoadedOnce = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isCreateSheetOpen = signal(false);
  protected readonly nextAppointmentsCursor = signal<string | null | undefined>(undefined);
  protected readonly appointments = signal<AppointmentResponse[]>([]);
  protected readonly businessHours = signal<BusinessHourDto[]>([]);
  protected readonly lookupMaps = signal<AgendaLookupMaps>(buildAgendaLookupMaps([], [], []));
  protected readonly statusLegend = [
    { id: 'scheduled', label: 'Agendado', color: 'var(--color-primary)' },
    { id: 'completed', label: 'Concluído', color: 'var(--color-neutral-400)' },
    { id: 'cancelled', label: 'Cancelado', color: 'var(--color-error)' },
    { id: 'review', label: 'Requer revisão', color: 'var(--color-warning)' },
  ];

  protected readonly userName = computed(() => {
    const displayName = this.authService.currentUser()?.displayName?.trim();
    return displayName ? displayName.split(/\s+/)[0] : 'Profissional';
  });

  protected readonly salonName = computed(() =>
    this.authService.currentUser()?.salonName?.trim() || 'Seu salão'
  );

  protected readonly isMineUnavailable = computed(() =>
    this.scope === 'mine' && !this.authService.currentUser()?.professionalId
  );

  protected readonly showCreateAction = computed(() => this.scope !== 'mine');

  protected readonly canCreateAppointment = computed(() =>
    this.showCreateAction() && !this.isMineUnavailable()
  );

  protected readonly weekDays = computed(() => getWeekDays(parseApiDate(this.selectedDate())));
  protected readonly weekRangeLabel = computed(() => formatWeekRange(this.weekDays()));
  protected readonly dayLabel = computed(() => formatAgendaDateLabel(this.selectedDate()));
  protected readonly selectedDayBusinessHours = computed(() =>
    this.businessHours().find(hour => hour.dayOfWeek === getApiDayOfWeek(this.selectedDate())) ?? null
  );
  protected readonly selectedDayBusinessHoursLabel = computed(() =>
    formatBusinessHoursLabel(this.selectedDayBusinessHours())
  );
  protected readonly isCurrentDayView = computed(() => this.selectedDate() === todayApiDate());
  protected readonly currentTimeLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(this.currentDateTime())
  );

  protected readonly selectedDayAppointments = computed(() =>
    this.appointments().filter(appointment => isSameLocalDay(appointment.startAtUtc, this.selectedDate()))
  );

  protected readonly timelineBounds = computed<TimelineBounds>(() =>
    getTimelineBounds(
      this.selectedDayAppointments(),
      this.isCurrentDayView(),
      this.selectedDayBusinessHours(),
      this.currentDateTime(),
    )
  );

  protected readonly timeSlots = computed(() => buildTimelineSlots(this.timelineBounds()));

  protected readonly showNowMarker = computed(() => {
    if (!this.isCurrentDayView()) {
      return false;
    }

    const nowMinutes = minutesFromDate(this.currentDateTime());
    return nowMinutes >= this.timelineBounds().startMinutes
      && nowMinutes <= this.timelineBounds().endMinutes;
  });

  protected readonly nowLineTop = computed(() =>
    getNowMarkerTop(this.timelineBounds(), this.currentDateTime())
  );

  protected readonly visibleAppointments = computed<AgendaAppointmentViewModel[]>(() =>
    buildAgendaAppointments(
      this.selectedDayAppointments(),
      this.lookupMaps(),
      this.timelineBounds().startMinutes,
    )
  );

  protected readonly summary = computed(() =>
    buildAgendaSummary(this.visibleAppointments(), this.currentDateTime())
  );

  protected readonly summaryCards = computed<SummaryCardViewModel[]>(() => {
    const summary = this.summary();

    return [
      {
        id: 'total',
        label: 'Atendimentos',
        value: String(summary.total),
        detail: 'no dia selecionado',
      },
      {
        id: 'scheduled',
        label: 'Agendados',
        value: String(summary.statusCounts.Scheduled),
        detail: 'ainda previstos',
      },
      {
        id: 'completed',
        label: 'Concluídos',
        value: String(summary.statusCounts.Completed),
        detail: 'já finalizados',
      },
      {
        id: 'review',
        label: 'Revisão',
        value: String(summary.requiresReview),
        detail: 'pedem atenção',
      },
    ];
  });

  protected readonly summaryLead = computed(() => {
    const total = this.summary().total;
    if (total === 0) {
      return 'Nenhum atendimento encontrado para o dia selecionado.';
    }

    const next = this.summary().nextAppointment;
    if (!next) {
      return `${total} atendimento${total === 1 ? '' : 's'} real${total === 1 ? '' : 'es'} neste dia.`;
    }

    return `Próximo destaque às ${next.startTimeLabel} com ${next.clientName}.`;
  });

  protected readonly summarySecondary = computed(() => {
    const items = this.visibleAppointments();
    if (items.length === 0) {
      return 'Troque o dia na semana para consultar outras datas.';
    }

    const first = items[0];
    const last = items[items.length - 1];
    return `Janela do dia entre ${first.startTimeLabel} e ${last.endTimeLabel}.`;
  });

  protected readonly statusBreakdown = computed(() => [
    { id: 'scheduled', label: 'Agendados', value: this.summary().statusCounts.Scheduled },
    { id: 'completed', label: 'Concluídos', value: this.summary().statusCounts.Completed },
    { id: 'cancelled', label: 'Cancelados', value: this.summary().statusCounts.Cancelled },
    { id: 'no-show', label: 'Não compareceu', value: this.summary().statusCounts.NoShow },
    { id: 'review', label: 'Requer revisão', value: this.summary().requiresReview },
  ]);

  async ngOnInit(): Promise<void> {
    await this.refreshAgenda();
  }

  ngOnDestroy(): void {
    if (this.nowTimerId !== null) {
      window.clearInterval(this.nowTimerId);
    }
  }

  protected async selectDay(date: string): Promise<void> {
    if (date === this.selectedDate()) {
      return;
    }

    this.selectedDate.set(date);
    await this.ensureAgendaCoverage();
  }

  protected async goToPreviousWeek(): Promise<void> {
    this.selectedDate.set(shiftApiDate(this.selectedDate(), -7));
    await this.ensureAgendaCoverage();
  }

  protected async goToNextWeek(): Promise<void> {
    this.selectedDate.set(shiftApiDate(this.selectedDate(), 7));
    await this.ensureAgendaCoverage();
  }

  protected async refreshAgenda(): Promise<void> {
    if (this.isMineUnavailable()) {
      this.hasLoadedOnce.set(true);
      this.error.set(null);
      this.appointments.set([]);
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.loadBusinessHours();
      await this.loadLookups();
      this.appointments.set([]);
      this.nextAppointmentsCursor.set(undefined);
      await this.loadAppointmentsUntilWeekEnd();
      this.hasLoadedOnce.set(true);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'Não foi possível carregar a agenda agora.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  protected openCreateSheet(): void {
    if (!this.canCreateAppointment()) {
      return;
    }

    this.isCreateSheetOpen.set(true);
  }

  protected closeCreateSheet(): void {
    this.isCreateSheetOpen.set(false);
  }

  protected async handleAppointmentCreated(appointment: AppointmentResponse): Promise<void> {
    this.selectedDate.set(toApiDate(new Date(appointment.startAtUtc)));
    this.closeCreateSheet();
    await this.refreshAgenda();
  }

  private async ensureAgendaCoverage(): Promise<void> {
    if (this.isMineUnavailable()) {
      return;
    }

    if (this.isWeekCovered()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.loadAppointmentsUntilWeekEnd();
      this.hasLoadedOnce.set(true);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'Não foi possível atualizar a agenda.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private isWeekCovered(): boolean {
    if (this.nextAppointmentsCursor() === null) {
      return true;
    }

    const loadedUntil = lastLocalAppointmentDate(this.appointments());
    const weekEndDate = this.weekDays()[this.weekDays().length - 1]?.date ?? this.selectedDate();

    if (!loadedUntil) {
      return false;
    }

    return loadedUntil >= weekEndDate;
  }

  private async loadLookups(): Promise<void> {
    const [clients, professionals, services] = await Promise.all([
      this.collectAllClients(),
      this.collectAllProfessionals(),
      this.collectAllServices(),
    ]);

    this.lookupMaps.set(buildAgendaLookupMaps(clients, professionals, services));
  }

  private async loadBusinessHours(): Promise<void> {
    const hours = await this.salonSettingsApi.getBusinessHours();
    this.businessHours.set(hours);
  }

  private async collectAllClients(): Promise<ClientResponse[]> {
    const result = await collectCursorPages(
      ({ cursor, pageSize }) => this.clientsApi.list(cursor, pageSize),
      { pageSize: AGENDA_PAGE_SIZE },
    );

    return result.items;
  }

  private async collectAllProfessionals(): Promise<ProfessionalResponse[]> {
    const result = await collectCursorPages(
      ({ cursor, pageSize }) => this.professionalsApi.list(cursor, pageSize),
      { pageSize: AGENDA_PAGE_SIZE },
    );

    return result.items;
  }

  private async collectAllServices(): Promise<ServiceResponse[]> {
    const result = await collectCursorPages(
      ({ cursor, pageSize }) => this.servicesApi.list(cursor, pageSize),
      { pageSize: AGENDA_PAGE_SIZE },
    );

    return result.items;
  }

  private async loadAppointmentsUntilWeekEnd(): Promise<void> {
    const weekEndDate = this.weekDays()[this.weekDays().length - 1]?.date ?? this.selectedDate();
    const currentAppointments = this.appointments();

    if (currentAppointments.length > 0 && this.isWeekCovered()) {
      return;
    }

    const result = await collectCursorPages(
      ({ cursor, pageSize }) => this.agendaApi.list({ cursor, pageSize }),
      {
        initialCursor: this.nextAppointmentsCursor() ?? undefined,
        pageSize: AGENDA_PAGE_SIZE,
        stopWhen: ({ items, page }) => {
          if (!page.nextCursor) {
            return true;
          }

          const loadedUntil = lastLocalAppointmentDate(items);
          return loadedUntil !== null && loadedUntil >= weekEndDate;
        },
      },
    );

    if (result.items.length > 0) {
      this.appointments.update(items => [...items, ...result.items]);
    } else if (this.nextAppointmentsCursor() === undefined) {
      this.appointments.set([]);
    }

    this.nextAppointmentsCursor.set(result.nextCursor);
  }
}
