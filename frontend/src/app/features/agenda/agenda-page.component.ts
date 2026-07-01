import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { AgendaApiService } from './agenda-api.service';
import { ClientsApiService } from '../clients/clients-api.service';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { ServicesApiService } from '../services/services-api.service';
import { SalonSettingsApiService } from '../salon-settings/salon-settings-api.service';
import { AppointmentFormComponent } from './appointment-form.component';
import { AppointmentActionsComponent } from './appointment-actions.component';
import { ShellTopbarService } from '../../core/layout/shell-topbar.service';
import { getApiErrorMessage } from '../../core/api/api-error.utils';
import { collectCursorPages } from '../../core/api/cursor-pagination';
import { AppIconComponent } from '../../shared/app-icon.component';
import {
  AGENDA_STATUS_VISUALS,
  getAgendaStatusVisual,
  DEFAULT_TIMELINE_START_MINUTES,
  buildAgendaAppointments,
  buildAgendaLookupMaps,
  formatAgendaDateLabel,
  formatBusinessHoursLabel,
  getApiDayOfWeek,
  getStatusBadgeClass,
  getWeekDays,
  hasAnyAction,
  isSameLocalDay,
  parseApiDate,
  shiftApiDate,
  todayApiDate,
  toApiDate,
} from './agenda-utils';
import type {
  AgendaAppointmentViewModel,
  AgendaLookupMaps,
} from './agenda-utils';
import type {
  AppointmentResponse,
  BusinessHourDto,
  ClientResponse,
  ProfessionalResponse,
  ServiceResponse,
} from '../../core/api/api.models';

const AGENDA_PAGE_SIZE = 100;

type AppointmentMutationAction = 'complete' | 'no-show' | 'cancel' | 'resolve-review';
type AgendaViewMode = 'day' | 'week' | 'month';

interface ActionConfirmationCopy {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'success' | 'warning' | 'danger' | 'primary';
  fallbackError: string;
}

interface AgendaViewOption {
  id: AgendaViewMode;
  label: string;
}

interface AgendaAppointmentGroup {
  id: string;
  label: string;
  items: AgendaAppointmentViewModel[];
}

interface AgendaIndicatorCard {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
}

function lastLocalAppointmentDate(appointments: AppointmentResponse[]): string | null {
  const last = appointments[appointments.length - 1];
  return last ? toApiDate(new Date(last.startAtUtc)) : null;
}

function countLabel(total: number): string {
  return `${total} atendimento${total === 1 ? '' : 's'}`;
}

function formatMonthLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(parseApiDate(dateStr));
}

function startOfMonthApiDate(dateStr: string): string {
  const date = parseApiDate(dateStr);
  return toApiDate(new Date(date.getFullYear(), date.getMonth(), 1, 12));
}

function endOfMonthApiDate(dateStr: string): string {
  const date = parseApiDate(dateStr);
  return toApiDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
}

function shiftApiMonth(dateStr: string, months: number): string {
  const date = parseApiDate(dateStr);
  date.setMonth(date.getMonth() + months);
  return toApiDate(date);
}

function formatCompactCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(amount);
}

function buildActionConfirmationCopy(
  action: AppointmentMutationAction,
  appointment: AgendaAppointmentViewModel,
): ActionConfirmationCopy {
  switch (action) {
    case 'complete':
      return {
        title: 'Concluir atendimento',
        description: `Confirme a conclusão de ${appointment.clientName} às ${appointment.timeRangeLabel}.`,
        confirmLabel: 'Concluir atendimento',
        tone: 'success',
        fallbackError: 'Não foi possível concluir o agendamento.',
      };
    case 'no-show':
      return {
        title: 'Marcar como não compareceu',
        description: `Confirme que ${appointment.clientName} não compareceu ao horário ${appointment.timeRangeLabel}.`,
        confirmLabel: 'Confirmar no-show',
        tone: 'danger',
        fallbackError: 'Não foi possível marcar o não comparecimento.',
      };
    case 'cancel':
      return {
        title: 'Cancelar agendamento',
        description: `Confirme o cancelamento do agendamento de ${appointment.clientName} às ${appointment.timeRangeLabel}.`,
        confirmLabel: 'Cancelar agendamento',
        tone: 'danger',
        fallbackError: 'Não foi possível cancelar o agendamento.',
      };
    case 'resolve-review':
      return {
        title: 'Resolver revisão',
        description: `Confirme a resolução da revisão pendente deste agendamento de ${appointment.clientName}.`,
        confirmLabel: 'Resolver revisão',
        tone: 'primary',
        fallbackError: 'Não foi possível resolver a revisão do agendamento.',
      };
  }
}

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  imports: [AppointmentFormComponent, AppointmentActionsComponent, AppIconComponent],
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
  private readonly shellTopbar = inject(ShellTopbarService);

  private readonly currentDateTime = signal(new Date());
  private readonly nowTimerId = typeof window === 'undefined'
    ? null
    : window.setInterval(() => this.currentDateTime.set(new Date()), 60_000);

  protected readonly currentRole = this.authService.role;
  protected readonly selectedDate = signal(todayApiDate());
  protected readonly viewMode = signal<AgendaViewMode>('day');
  protected readonly isLoading = signal(false);
  protected readonly hasLoadedOnce = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isCreateSheetOpen = signal(false);
  protected readonly actionSheetAppointment = signal<AgendaAppointmentViewModel | null>(null);
  protected readonly rescheduleSheetAppointment = signal<AgendaAppointmentViewModel | null>(null);
  protected readonly confirmAction = signal<AppointmentMutationAction | null>(null);
  protected readonly pendingAction = signal<AppointmentMutationAction | null>(null);
  protected readonly actionError = signal<string | null>(null);
  protected readonly nextAppointmentsCursor = signal<string | null | undefined>(undefined);
  protected readonly appointments = signal<AppointmentResponse[]>([]);
  protected readonly businessHours = signal<BusinessHourDto[]>([]);
  protected readonly lookupMaps = signal<AgendaLookupMaps>(buildAgendaLookupMaps([], [], []));
  protected readonly servicesCatalog = signal<ServiceResponse[]>([]);
  protected readonly viewOptions: AgendaViewOption[] = [
    { id: 'day', label: 'Dia' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mês' },
  ];
  protected readonly statusLegend = [
    AGENDA_STATUS_VISUALS.scheduled,
    AGENDA_STATUS_VISUALS.completed,
    AGENDA_STATUS_VISUALS.cancelled,
    AGENDA_STATUS_VISUALS.noshow,
    AGENDA_STATUS_VISUALS.review,
  ];

  protected readonly isMineUnavailable = computed(() =>
    this.scope === 'mine' && !this.authService.currentUser()?.professionalId
  );

  protected readonly showCreateAction = computed(() => this.scope !== 'mine');

  protected readonly canCreateAppointment = computed(() =>
    this.showCreateAction() && !this.isMineUnavailable()
  );

  protected readonly hasOpenSheet = computed(() =>
    this.isCreateSheetOpen()
    || this.actionSheetAppointment() !== null
    || this.rescheduleSheetAppointment() !== null
  );

  protected readonly actionConfirmation = computed(() => {
    const action = this.confirmAction();
    const appointment = this.actionSheetAppointment();

    if (!action || !appointment) {
      return null;
    }

    return buildActionConfirmationCopy(action, appointment);
  });

  protected readonly reschedulePreferredDate = computed(() => {
    const appointment = this.rescheduleSheetAppointment();
    return appointment ? toApiDate(new Date(appointment.startAtUtc)) : this.selectedDate();
  });

  protected readonly rescheduleCurrentService = computed(() => {
    const appointment = this.rescheduleSheetAppointment();
    if (!appointment) {
      return null;
    }

    return this.servicesCatalog().find(service => service.id === appointment.appointment.serviceId) ?? null;
  });

  protected readonly weekDays = computed(() => getWeekDays(parseApiDate(this.selectedDate())));
  protected readonly weekRangeLabel = computed(() => {
    const days = this.weekDays();
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
  });
  protected readonly selectedDayBusinessHours = computed(() =>
    this.businessHours().find(hour => hour.dayOfWeek === getApiDayOfWeek(this.selectedDate())) ?? null
  );
  protected readonly selectedDayBusinessHoursLabel = computed(() =>
    formatBusinessHoursLabel(this.selectedDayBusinessHours())
  );

  protected readonly agendaItems = computed<AgendaAppointmentViewModel[]>(() =>
    buildAgendaAppointments(
      this.appointments(),
      this.lookupMaps(),
      DEFAULT_TIMELINE_START_MINUTES,
    )
  );

  protected readonly currentViewItems = computed<AgendaAppointmentViewModel[]>(() => {
    const items = this.agendaItems();
    const selectedDate = this.selectedDate();
    const mode = this.viewMode();

    if (mode === 'day') {
      return items.filter(item => isSameLocalDay(item.startAtUtc, selectedDate));
    }

    if (mode === 'week') {
      const weekStart = this.weekDays()[0]?.date ?? selectedDate;
      const weekEnd = this.weekDays()[this.weekDays().length - 1]?.date ?? selectedDate;
      return items.filter(item => {
        const itemDate = toApiDate(new Date(item.startAtUtc));
        return itemDate >= weekStart && itemDate <= weekEnd;
      });
    }

    const monthStart = startOfMonthApiDate(selectedDate);
    const monthEnd = endOfMonthApiDate(selectedDate);
    return items.filter(item => {
      const itemDate = toApiDate(new Date(item.startAtUtc));
      return itemDate >= monthStart && itemDate <= monthEnd;
    });
  });

  protected readonly monthAppointments = computed(() => {
    const monthStart = startOfMonthApiDate(this.selectedDate());
    const monthEnd = endOfMonthApiDate(this.selectedDate());

    return this.agendaItems().filter(item => {
      const itemDate = toApiDate(new Date(item.startAtUtc));
      return itemDate >= monthStart && itemDate <= monthEnd;
    });
  });

  protected readonly monthIndicators = computed<AgendaIndicatorCard[]>(() => {
    const monthAppointments = this.monthAppointments();
    const scheduled = monthAppointments.filter(item => item.appointment.status === 'Scheduled').length;
    const completed = monthAppointments.filter(item => item.appointment.status === 'Completed').length;
    const cancelled = monthAppointments.filter(item => item.appointment.status === 'Cancelled').length;
    const noShow = monthAppointments.filter(item => item.appointment.status === 'NoShow').length;
    const review = monthAppointments.filter(item => item.appointment.requiresReview).length;

    const cards: AgendaIndicatorCard[] = [
      {
        id: 'appointments',
        label: 'Atendimentos do mês',
        value: String(monthAppointments.length),
        helper: 'Agendamentos visíveis no período',
        icon: 'calendar-search',
        tone: 'primary',
      },
      {
        id: 'scheduled',
        label: 'Agendados',
        value: String(scheduled),
        helper: 'Compromissos ainda abertos',
        icon: 'archive-tick',
        tone: 'primary',
      },
      {
        id: 'completed',
        label: 'Concluídos',
        value: String(completed),
        helper: 'Atendimentos finalizados',
        icon: 'check-tick',
        tone: 'success',
      },
      {
        id: 'cancelled',
        label: 'Cancelados',
        value: String(cancelled),
        helper: 'Compromissos cancelados no mês',
        icon: 'archive-minus',
        tone: 'danger',
      },
      {
        id: 'no-show',
        label: 'Não compareceu',
        value: String(noShow),
        helper: 'Ausências registradas',
        icon: 'user-remove',
        tone: 'warning',
      },
      {
        id: 'review',
        label: 'Requer revisão',
        value: String(review),
        helper: 'Agendamentos que pedem atenção',
        icon: 'danger',
        tone: 'warning',
      },
    ];

    const billableAppointments = monthAppointments.filter(item =>
      item.appointment.status === 'Scheduled' || item.appointment.status === 'Completed'
    );
    const pricedServices = billableAppointments
      .map(item => this.servicesCatalog().find(service => service.id === item.appointment.serviceId))
      .filter((service): service is ServiceResponse => !!service);

    if (billableAppointments.length > 0 && pricedServices.length === billableAppointments.length) {
      const estimatedRevenue = pricedServices.reduce((total, service) => total + service.priceAmount, 0);
      cards.push({
        id: 'revenue',
        label: 'Faturamento estimado',
        value: formatCompactCurrency(estimatedRevenue),
        helper: 'Soma dos serviços agendados e concluídos',
        icon: 'wallet-money',
        tone: 'success',
      });
    }

    const loyaltyMap = new Map<string, { name: string; total: number }>();
    monthAppointments.forEach(item => {
      const current = loyaltyMap.get(item.appointment.clientId);
      loyaltyMap.set(item.appointment.clientId, {
        name: item.clientName,
        total: (current?.total ?? 0) + 1,
      });
    });

    const rankedClients = [...loyaltyMap.values()].sort((left, right) => right.total - left.total);
    const topClient = rankedClients[0];
    const secondClient = rankedClients[1];

    if (topClient && (!secondClient || topClient.total > secondClient.total)) {
      cards.push({
        id: 'loyal-client',
        label: 'Cliente mais fiel',
        value: topClient.name,
        helper: `${topClient.total} atendimento${topClient.total === 1 ? '' : 's'} no mês`,
        icon: 'crown',
        tone: 'neutral',
      });
    }

    return cards;
  });

  protected readonly currentViewGroups = computed<AgendaAppointmentGroup[]>(() => {
    if (this.viewMode() === 'day') {
      return [];
    }

    const groups = new Map<string, AgendaAppointmentViewModel[]>();

    this.currentViewItems().forEach(item => {
      const date = toApiDate(new Date(item.startAtUtc));
      const bucket = groups.get(date);
      if (bucket) {
        bucket.push(item);
        return;
      }

      groups.set(date, [item]);
    });

    return [...groups.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, items]) => ({
        id: date,
        label: formatAgendaDateLabel(date),
        items,
      }));
  });

  protected readonly headingEyebrow = computed(() => {
    switch (this.viewMode()) {
      case 'day':
        return 'Agenda do dia';
      case 'week':
        return 'Agenda da semana';
      case 'month':
        return 'Agenda do mês';
    }
  });

  protected readonly headingTitle = computed(() => {
    const total = this.currentViewItems().length;
    const totalLabel = countLabel(total);

    switch (this.viewMode()) {
      case 'day':
        return this.selectedDate() === todayApiDate()
          ? `Hoje · ${totalLabel}`
          : `${formatAgendaDateLabel(this.selectedDate())} · ${totalLabel}`;
      case 'week':
        return `Semana · ${totalLabel}`;
      case 'month':
        return `${formatMonthLabel(this.selectedDate())} · ${totalLabel}`;
    }
  });

  protected readonly currentPeriodLabel = computed(() => {
    switch (this.viewMode()) {
      case 'day':
        return formatAgendaDateLabel(this.selectedDate());
      case 'week':
        return this.weekRangeLabel();
      case 'month':
        return formatMonthLabel(this.selectedDate());
    }
  });

  protected readonly monthLabel = computed(() => formatMonthLabel(this.selectedDate()));

  protected readonly emptyStateTitle = computed(() => {
    switch (this.viewMode()) {
      case 'day':
        return 'Nenhum atendimento neste dia';
      case 'week':
        return 'Nenhum atendimento nesta semana';
      case 'month':
        return 'Nenhum atendimento neste mês';
    }
  });

  protected readonly emptyStateMessage = computed(() => {
    switch (this.viewMode()) {
      case 'day':
        return 'Escolha outra data ou crie um novo agendamento para preencher a agenda do dia.';
      case 'week':
        return 'Avance ou volte o período para consultar outros atendimentos da semana.';
      case 'month':
        return 'Altere o mês para consultar outros atendimentos ou criar novos horários.';
    }
  });

  async ngOnInit(): Promise<void> {
    this.syncTopbarAction();
    await this.refreshAgenda();
  }

  ngOnDestroy(): void {
    this.shellTopbar.clearAction();

    if (this.nowTimerId !== null) {
      window.clearInterval(this.nowTimerId);
    }
  }

  private syncTopbarAction(): void {
    if (!this.showCreateAction()) {
      this.shellTopbar.clearAction();
      return;
    }

    this.shellTopbar.setAction({
      label: 'Novo agendamento',
      ariaLabel: 'Criar novo agendamento',
      icon: 'calendar-add',
      onClick: () => this.openCreateSheet(),
    });
  }

  protected async setViewMode(mode: AgendaViewMode): Promise<void> {
    if (mode === this.viewMode()) {
      return;
    }

    this.viewMode.set(mode);
    await this.ensureAgendaCoverage();
  }

  protected async goToPreviousPeriod(): Promise<void> {
    switch (this.viewMode()) {
      case 'day':
        this.selectedDate.set(shiftApiDate(this.selectedDate(), -1));
        break;
      case 'week':
        this.selectedDate.set(shiftApiDate(this.selectedDate(), -7));
        break;
      case 'month':
        this.selectedDate.set(shiftApiMonth(this.selectedDate(), -1));
        break;
    }

    await this.ensureAgendaCoverage();
  }

  protected async goToNextPeriod(): Promise<void> {
    switch (this.viewMode()) {
      case 'day':
        this.selectedDate.set(shiftApiDate(this.selectedDate(), 1));
        break;
      case 'week':
        this.selectedDate.set(shiftApiDate(this.selectedDate(), 7));
        break;
      case 'month':
        this.selectedDate.set(shiftApiMonth(this.selectedDate(), 1));
        break;
    }

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
      await this.loadAppointmentsUntilTargetDate();
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

    this.resetAppointmentOverlays();
    this.isCreateSheetOpen.set(true);
  }

  protected closeCreateSheet(): void {
    this.isCreateSheetOpen.set(false);
  }

  protected openAppointmentActions(appointment: AgendaAppointmentViewModel): void {
    if (!hasAnyAction(appointment.appointment, this.currentRole())) {
      return;
    }

    this.isCreateSheetOpen.set(false);
    this.rescheduleSheetAppointment.set(null);
    this.confirmAction.set(null);
    this.pendingAction.set(null);
    this.actionError.set(null);
    this.actionSheetAppointment.set(appointment);
  }

  protected closeActionSheet(): void {
    if (this.pendingAction()) {
      return;
    }

    this.actionSheetAppointment.set(null);
    this.confirmAction.set(null);
    this.actionError.set(null);
  }

  protected openRescheduleSheet(appointment: AgendaAppointmentViewModel): void {
    this.isCreateSheetOpen.set(false);
    this.actionSheetAppointment.set(null);
    this.confirmAction.set(null);
    this.pendingAction.set(null);
    this.actionError.set(null);
    this.rescheduleSheetAppointment.set(appointment);
  }

  protected startRescheduleFromActionSheet(): void {
    const appointment = this.actionSheetAppointment();
    if (!appointment) {
      return;
    }

    this.openRescheduleSheet(appointment);
  }

  protected closeRescheduleSheet(): void {
    this.rescheduleSheetAppointment.set(null);
  }

  protected closeActiveSheet(): void {
    if (this.pendingAction()) {
      return;
    }

    this.closeCreateSheet();
    this.closeActionSheet();
    this.closeRescheduleSheet();
  }

  protected requestActionConfirmation(action: AppointmentMutationAction): void {
    if (!this.actionSheetAppointment() || this.pendingAction()) {
      return;
    }

    this.actionError.set(null);
    this.confirmAction.set(action);
  }

  protected cancelActionConfirmation(): void {
    if (this.pendingAction()) {
      return;
    }

    this.confirmAction.set(null);
    this.actionError.set(null);
  }

  protected async confirmAppointmentAction(): Promise<void> {
    const appointment = this.actionSheetAppointment();
    const action = this.confirmAction();
    const copy = this.actionConfirmation();

    if (!appointment || !action || !copy) {
      return;
    }

    this.pendingAction.set(action);
    this.actionError.set(null);

    try {
      switch (action) {
        case 'complete':
          await this.agendaApi.complete(appointment.id);
          break;
        case 'no-show':
          await this.agendaApi.noShow(appointment.id);
          break;
        case 'cancel':
          await this.agendaApi.cancel(appointment.id);
          break;
        case 'resolve-review':
          await this.agendaApi.resolveReview(appointment.id);
          break;
      }
    } catch (error) {
      this.actionError.set(getApiErrorMessage(error, copy.fallbackError));
      return;
    } finally {
      this.pendingAction.set(null);
    }

    this.closeActionSheet();
    await this.refreshAgenda();
  }

  protected async handleAppointmentCreated(appointment: AppointmentResponse): Promise<void> {
    this.selectedDate.set(toApiDate(new Date(appointment.startAtUtc)));
    this.closeCreateSheet();
    await this.refreshAgenda();
  }

  protected async handleAppointmentRescheduled(appointment: AppointmentResponse): Promise<void> {
    this.selectedDate.set(toApiDate(new Date(appointment.startAtUtc)));
    this.closeRescheduleSheet();
    await this.refreshAgenda();
  }

  protected hasAppointmentActions(appointment: AgendaAppointmentViewModel): boolean {
    return hasAnyAction(appointment.appointment, this.currentRole());
  }

  protected getStatusBadgeClass(appointment: AgendaAppointmentViewModel): string {
    return getStatusBadgeClass(
      appointment.appointment.status,
      appointment.appointment.requiresReview,
    );
  }

  protected getStatusVisual(appointment: AgendaAppointmentViewModel) {
    return getAgendaStatusVisual(
      appointment.appointment.status,
      appointment.appointment.requiresReview,
    );
  }

  protected getStatusIcon(appointment: AgendaAppointmentViewModel): string {
    return this.getStatusVisual(appointment).icon;
  }

  protected getStatusTone(appointment: AgendaAppointmentViewModel): string {
    return this.getStatusVisual(appointment).key;
  }

  protected getClientInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'CL';
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  private resetAppointmentOverlays(): void {
    this.actionSheetAppointment.set(null);
    this.rescheduleSheetAppointment.set(null);
    this.confirmAction.set(null);
    this.pendingAction.set(null);
    this.actionError.set(null);
  }

  private async ensureAgendaCoverage(): Promise<void> {
    if (this.isMineUnavailable()) {
      return;
    }

    if (this.isTargetCovered()) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      await this.loadAppointmentsUntilTargetDate();
      this.hasLoadedOnce.set(true);
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'Não foi possível atualizar a agenda.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private getTargetCoverageDate(): string {
    switch (this.viewMode()) {
      case 'day':
        return this.selectedDate();
      case 'week':
        return this.weekDays()[this.weekDays().length - 1]?.date ?? this.selectedDate();
      case 'month':
        return endOfMonthApiDate(this.selectedDate());
    }
  }

  private isTargetCovered(): boolean {
    if (this.nextAppointmentsCursor() === null) {
      return true;
    }

    const loadedUntil = lastLocalAppointmentDate(this.appointments());
    if (!loadedUntil) {
      return false;
    }

    return loadedUntil >= this.getTargetCoverageDate();
  }

  private async loadLookups(): Promise<void> {
    const [clients, professionals, services] = await Promise.all([
      this.collectAllClients(),
      this.collectAllProfessionals(),
      this.collectAllServices(),
    ]);

    this.servicesCatalog.set(services);
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

  private async loadAppointmentsUntilTargetDate(): Promise<void> {
    const targetDate = this.getTargetCoverageDate();
    const currentAppointments = this.appointments();

    if (currentAppointments.length > 0 && this.isTargetCovered()) {
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
          return loadedUntil !== null && loadedUntil >= targetDate;
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
