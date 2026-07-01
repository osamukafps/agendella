import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, WritableSignal, computed, inject, signal } from '@angular/core';
import { AgendaApiService, AppointmentConflictError } from './agenda-api.service';
import { AvailabilityPickerComponent } from './availability-picker.component';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { ClientsApiService } from '../clients/clients-api.service';
import { ServicesApiService } from '../services/services-api.service';
import { ClientQuickFormComponent } from '../clients/client-quick-form.component';
import { conflictTypeLabel, formatDuration, formatDurationMinutes, getDurationMinutes } from './agenda-utils';
import { getApiErrorMessage, mapApiErrorToUi } from '../../core/api/api-error.utils';
import { isValidTimeValue, localDateTimeToUtc, utcToLocalDateTimeParts } from '../../core/utils/date-time';
import { TimePickerComponent } from '../../shared/time-picker.component';
import type {
  AppointmentResponse,
  AvailabilitySlotDto,
  ClientResponse,
  PaginatedResponse,
  ProfessionalResponse,
  ServiceResponse,
} from '../../core/api/api.models';

const FORM_PAGE_SIZE = 20;

interface SelectableListState<T> {
  items: WritableSignal<T[]>;
  query: WritableSignal<string>;
  nextCursor: WritableSignal<string | null>;
  isLoading: WritableSignal<boolean>;
  isLoadingMore: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
}

function createListState<T>(): SelectableListState<T> {
  return {
    items: signal<T[]>([]),
    query: signal(''),
    nextCursor: signal<string | null>(null),
    isLoading: signal(false),
    isLoadingMore: signal(false),
    error: signal<string | null>(null),
  };
}

function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  const map = new Map(current.map(item => [item.id, item]));
  incoming.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function matchesSearch(query: string, values: Array<string | null | undefined>): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return true;
  }

  return values.some(value => normalizeSearch(value ?? '').includes(normalizedQuery));
}

function addMinutesToUtc(utcString: string, minutes: number): string {
  const date = new Date(utcString);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function sameUtcInstant(left: string, right: string): boolean {
  return new Date(left).getTime() === new Date(right).getTime();
}

export function formatServicePrice(amount: number | null | undefined, currency: string | null | undefined): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || !currency?.trim()) {
    return '';
  }

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return '';
  }
}

export function getSuggestedEndTime(
  slot: AvailabilitySlotDto,
  manualDurationMinutes: number | null,
): string {
  const nextEndAtUtc = manualDurationMinutes && manualDurationMinutes > 0
    ? addMinutesToUtc(slot.startAtUtc, manualDurationMinutes)
    : slot.endAtUtc;

  return utcToLocalDateTimeParts(nextEndAtUtc).time;
}

export interface ManualEndResolution {
  endAtUtc: string | null;
  manualEndAtUtc: string | null;
  error: string | null;
}

export function resolveManualEndSelection(
  slot: AvailabilitySlotDto | null,
  endTime: string,
): ManualEndResolution {
  if (!slot) {
    return {
      endAtUtc: null,
      manualEndAtUtc: null,
      error: 'Selecione um horário inicial antes de ajustar o fim.',
    };
  }

  if (!isValidTimeValue(endTime)) {
    return {
      endAtUtc: null,
      manualEndAtUtc: null,
      error: 'Selecione um horário final válido.',
    };
  }

  const { date } = utcToLocalDateTimeParts(slot.startAtUtc);
  const endAtUtc = localDateTimeToUtc(date, endTime);

  if (!endAtUtc) {
    return {
      endAtUtc: null,
      manualEndAtUtc: null,
      error: 'Não foi possível interpretar o horário final informado.',
    };
  }

  if (new Date(endAtUtc).getTime() <= new Date(slot.startAtUtc).getTime()) {
    return {
      endAtUtc: null,
      manualEndAtUtc: null,
      error: 'O horário final deve ser maior que o inicial.',
    };
  }

  return {
    endAtUtc,
    manualEndAtUtc: sameUtcInstant(endAtUtc, slot.endAtUtc) ? null : endAtUtc,
    error: null,
  };
}

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [AvailabilityPickerComponent, ClientQuickFormComponent, TimePickerComponent],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css',
})
export class AppointmentFormComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'reschedule' = 'create';
  @Input() appointmentId?: string;
  @Input() currentProfessionalId?: string;
  @Input() currentProfessionalName = '';
  @Input() currentClientName = '';
  @Input() currentServiceName = '';
  @Input() currentTimeRangeLabel = '';
  @Input() currentStartAtUtc = '';
  @Input() currentEndAtUtc = '';
  @Input() currentDurationMinutes = 0;
  @Input() currentServicePriceAmount: number | null = null;
  @Input() currentServiceCurrency = 'BRL';
  @Input() preferredDate = '';
  @Input() preferredProfessionalId?: string;

  @Output() saved = new EventEmitter<AppointmentResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly agendaApi = inject(AgendaApiService);
  private readonly professionalsApi = inject(ProfessionalsApiService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly servicesApi = inject(ServicesApiService);

  protected readonly professionalsState = createListState<ProfessionalResponse>();
  protected readonly clientsState = createListState<ClientResponse>();
  protected readonly servicesState = createListState<ServiceResponse>();

  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly fieldErrors = signal<Record<string, string[]>>({});

  protected readonly selectedProfId = signal('');
  protected readonly selectedClientId = signal('');
  protected readonly selectedSvcId = signal('');
  protected readonly selectedSlot = signal<AvailabilitySlotDto | null>(null);
  protected readonly selectedAvailabilityDate = signal('');
  protected readonly showNewClient = signal(false);
  protected readonly selectedEndTime = signal('');
  protected readonly manualDurationMinutes = signal<number | null>(null);
  protected readonly hasManualEndOverride = signal(false);

  protected readonly filteredProfessionals = computed(() =>
    this.professionalsState.items().filter(professional =>
      matchesSearch(this.professionalsState.query(), [
        professional.name,
        professional.email,
        professional.phone,
      ])
    )
  );

  protected readonly filteredClients = computed(() =>
    this.clientsState.items().filter(client =>
      matchesSearch(this.clientsState.query(), [
        client.name,
        client.phone,
        client.email,
        client.notes,
      ])
    )
  );

  protected readonly filteredServices = computed(() =>
    this.servicesState.items().filter(service =>
      matchesSearch(this.servicesState.query(), [
        service.name,
        service.description,
        String(service.durationMinutes),
      ])
    )
  );

  protected readonly selectedProfessional = computed(() =>
    this.professionalsState.items().find(item => item.id === this.selectedProfId()) ?? null
  );

  protected readonly selectedClient = computed(() =>
    this.clientsState.items().find(item => item.id === this.selectedClientId()) ?? null
  );

  protected readonly selectedService = computed(() =>
    this.servicesState.items().find(item => item.id === this.selectedSvcId()) ?? null
  );

  protected readonly selectedServicePriceLabel = computed(() =>
    formatServicePrice(this.selectedService()?.priceAmount, this.selectedService()?.currency)
  );

  protected readonly currentServicePriceLabel = computed(() =>
    formatServicePrice(this.currentServicePriceAmount, this.currentServiceCurrency)
  );

  protected readonly durationLabel = computed(() => {
    if (this.mode === 'reschedule') {
      return this.currentDurationMinutes > 0
        ? formatDurationMinutes(this.currentDurationMinutes)
        : '';
    }

    const service = this.selectedService();
    if (!service) {
      return '';
    }

    const end = new Date(2024, 0, 1, 0, service.durationMinutes);
    return formatDuration('2024-01-01T00:00:00Z', end.toISOString());
  });

  protected readonly durationMinutes = computed(() =>
    this.mode === 'reschedule'
      ? this.currentDurationMinutes
      : (this.selectedService()?.durationMinutes ?? 0)
  );

  protected readonly activeProfessionalId = computed(() =>
    this.mode === 'reschedule'
      ? (this.currentProfessionalId ?? '')
      : this.selectedProfId()
  );

  protected readonly activeProfessionalName = computed(() =>
    this.mode === 'reschedule'
      ? (this.currentProfessionalName || 'Profissional atual')
      : (this.selectedProfessional()?.name ?? '')
  );

  protected readonly timingSelection = computed(() => {
    const slot = this.selectedSlot();
    if (!slot) {
      return null;
    }

    const startParts = utcToLocalDateTimeParts(slot.startAtUtc);
    const suggestedEndTime = utcToLocalDateTimeParts(slot.endAtUtc).time;
    const manualEnd = resolveManualEndSelection(slot, this.selectedEndTime());
    const resolvedEndAtUtc = manualEnd.endAtUtc ?? slot.endAtUtc;
    const resolvedEndTime = manualEnd.endAtUtc
      ? utcToLocalDateTimeParts(manualEnd.endAtUtc).time
      : this.selectedEndTime();

    return {
      startDate: startParts.date,
      startTime: startParts.time,
      suggestedEndTime,
      resolvedEndAtUtc,
      resolvedEndTime,
      durationLabel: formatDurationMinutes(getDurationMinutes(slot.startAtUtc, resolvedEndAtUtc)),
      validationError: manualEnd.error,
    };
  });

  protected readonly canSubmit = computed(() => {
    const timing = this.timingSelection();
    if (!timing || timing.validationError) {
      return false;
    }

    if (this.mode === 'create') {
      return !!(this.selectedProfId() && this.selectedClientId() && this.selectedSvcId());
    }

    return !!this.appointmentId;
  });

  protected readonly hasMoreProfessionals = computed(() => !!this.professionalsState.nextCursor());
  protected readonly hasMoreClients = computed(() => !!this.clientsState.nextCursor());
  protected readonly hasMoreServices = computed(() => !!this.servicesState.nextCursor());

  async ngOnInit(): Promise<void> {
    await this.loadInitialData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preferredDate']?.currentValue && !this.selectedAvailabilityDate()) {
      this.selectedAvailabilityDate.set(this.preferredDate);
    }

    if (changes['preferredProfessionalId']?.currentValue && !this.selectedProfId()) {
      this.selectedProfId.set(this.preferredProfessionalId ?? '');
    }

    if (
      this.mode === 'reschedule'
      && (
        changes['currentDurationMinutes']
        || changes['currentEndAtUtc']
      )
    ) {
      this.initializeRescheduleTiming();
    }
  }

  protected fieldError(...keys: string[]): string | null {
    const errors = this.fieldErrors();

    for (const key of keys) {
      const message = errors[key]?.[0];
      if (message) {
        return message;
      }
    }

    return null;
  }

  protected setQuery(
    state: SelectableListState<ProfessionalResponse | ClientResponse | ServiceResponse>,
    value: string,
  ): void {
    state.query.set(value);
  }

  protected chooseProfessional(id: string): void {
    this.selectedProfId.set(id);
    this.clearSelectedTiming(true);
    this.clearFieldErrors('professionalId', 'startAtUtc', 'newStartAtUtc');
  }

  protected chooseClient(id: string): void {
    this.selectedClientId.set(id);
    this.clearFieldErrors('clientId');
  }

  protected chooseService(id: string): void {
    this.selectedSvcId.set(id);
    this.clearSelectedTiming(false);
    this.clearFieldErrors('serviceId', 'startAtUtc', 'newStartAtUtc');
  }

  protected openNewClient(): void {
    this.showNewClient.set(true);
  }

  protected closeNewClient(): void {
    this.showNewClient.set(false);
  }

  protected handleNewClientSaved(client: ClientResponse): void {
    this.clientsState.items.update(items => mergeById([client], items));
    this.clientsState.query.set(client.name);
    this.selectedClientId.set(client.id);
    this.showNewClient.set(false);
    this.clearFieldErrors('clientId');
  }

  protected onSlotSelected(slot: AvailabilitySlotDto | null): void {
    this.selectedSlot.set(slot);
    if (!slot) {
      this.selectedEndTime.set('');
    } else {
      this.selectedEndTime.set(getSuggestedEndTime(
        slot,
        this.hasManualEndOverride() ? this.manualDurationMinutes() : null,
      ));
    }

    this.clearFieldErrors('startAtUtc', 'newStartAtUtc', 'manualEndAtUtc', 'newManualEndAtUtc');
  }

  protected onAvailabilityDateSelected(date: string): void {
    this.selectedAvailabilityDate.set(date);
    this.clearSelectedTiming(true);
    this.clearFieldErrors('startAtUtc', 'newStartAtUtc');
  }

  protected updateSelectedEndTime(value: string): void {
    this.selectedEndTime.set(value);
    this.clearFieldErrors('manualEndAtUtc', 'newManualEndAtUtc');

    const slot = this.selectedSlot();
    const resolved = resolveManualEndSelection(slot, value);
    if (!slot || resolved.error || !resolved.endAtUtc) {
      return;
    }

    const isManualOverride = resolved.manualEndAtUtc !== null;
    this.hasManualEndOverride.set(isManualOverride);
    this.manualDurationMinutes.set(
      isManualOverride
        ? getDurationMinutes(slot.startAtUtc, resolved.endAtUtc)
        : null
    );
  }

  protected async loadMoreProfessionals(): Promise<void> {
    try {
      await this.loadProfessionals(false);
    } catch {
      // O erro já é refletido no estado inline da lista.
    }
  }

  protected async loadMoreClients(): Promise<void> {
    try {
      await this.loadClients(false);
    } catch {
      // O erro já é refletido no estado inline da lista.
    }
  }

  protected async loadMoreServices(): Promise<void> {
    try {
      await this.loadServices(false);
    } catch {
      // O erro já é refletido no estado inline da lista.
    }
  }

  protected async retryInitialData(): Promise<void> {
    await this.loadInitialData();
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.canSubmit()) {
      const timing = this.timingSelection();
      if (timing?.validationError) {
        this.fieldErrors.set({
          ...this.fieldErrors(),
          [this.endFieldKey()]: [timing.validationError],
        });
      }
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.fieldErrors.set({});

    try {
      const slot = this.selectedSlot()!;
      const manualEnd = resolveManualEndSelection(slot, this.selectedEndTime());
      if (manualEnd.error) {
        this.fieldErrors.set({ [this.endFieldKey()]: [manualEnd.error] });
        return;
      }

      const result = this.mode === 'reschedule'
        ? await this.agendaApi.reschedule(this.appointmentId!, {
          newStartAtUtc: slot.startAtUtc,
          newManualEndAtUtc: manualEnd.manualEndAtUtc,
        })
        : await this.agendaApi.create({
          clientId: this.selectedClientId(),
          professionalId: this.selectedProfId(),
          serviceId: this.selectedSvcId(),
          startAtUtc: slot.startAtUtc,
          manualEndAtUtc: manualEnd.manualEndAtUtc,
        });

      this.saved.emit(result);
    } catch (error) {
      if (error instanceof AppointmentConflictError) {
        const conflictMessage = conflictTypeLabel(error.conflictType);
        this.error.set(conflictMessage);
        this.fieldErrors.set({ startAtUtc: [conflictMessage] });
      } else {
        const uiError = mapApiErrorToUi(error, 'Não foi possível salvar o agendamento.');
        this.fieldErrors.set(uiError.fieldErrors);
        this.error.set(uiError.message);
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  private clearFieldErrors(...keys: string[]): void {
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      keys.forEach(key => delete next[key]);
      return next;
    });
  }

  private async loadInitialData(): Promise<void> {
    if (this.mode !== 'create') {
      if (this.currentProfessionalId) {
        this.selectedProfId.set(this.currentProfessionalId);
      }
      if (this.preferredDate) {
        this.selectedAvailabilityDate.set(this.preferredDate);
      }
      this.initializeRescheduleTiming();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const results = await Promise.allSettled([
      this.loadProfessionals(true),
      this.loadClients(true),
      this.loadServices(true),
    ]);

    this.isLoading.set(false);

    if (this.preferredProfessionalId && !this.selectedProfId()) {
      this.selectedProfId.set(this.preferredProfessionalId);
    }

    if (this.preferredDate) {
      this.selectedAvailabilityDate.set(this.preferredDate);
    }

    if (results.some(result => result.status === 'rejected')) {
      this.error.set('Algumas listas não puderam ser carregadas. Você pode tentar novamente ou carregar mais abaixo.');
    }
  }

  private async loadProfessionals(reset: boolean): Promise<void> {
    await this.loadListPage(
      this.professionalsState,
      (cursor, pageSize) => this.professionalsApi.list(cursor, pageSize),
      reset,
      professional => professional.status === 'Active',
      'Não foi possível carregar profissionais.',
    );
  }

  private async loadClients(reset: boolean): Promise<void> {
    await this.loadListPage(
      this.clientsState,
      (cursor, pageSize) => this.clientsApi.list(cursor, pageSize),
      reset,
      client => client.status === 'Active',
      'Não foi possível carregar clientes.',
    );
  }

  private async loadServices(reset: boolean): Promise<void> {
    await this.loadListPage(
      this.servicesState,
      (cursor, pageSize) => this.servicesApi.list(cursor, pageSize),
      reset,
      service => service.status === 'Active',
      'Não foi possível carregar serviços.',
    );
  }

  private async loadListPage<T extends { id: string }>(
    state: SelectableListState<T>,
    loader: (cursor?: string, pageSize?: number) => Promise<PaginatedResponse<T>>,
    reset: boolean,
    predicate: (item: T) => boolean,
    fallbackMessage: string,
  ): Promise<void> {
    if (!reset && !state.nextCursor()) {
      return;
    }

    if (reset) {
      state.isLoading.set(true);
    } else {
      state.isLoadingMore.set(true);
    }

    state.error.set(null);

    try {
      const response = await loader(reset ? undefined : (state.nextCursor() ?? undefined), FORM_PAGE_SIZE);
      const nextItems = response.items.filter(predicate);

      state.items.set(reset ? nextItems : mergeById(state.items(), nextItems));
      state.nextCursor.set(response.nextCursor);
    } catch (error) {
      state.error.set(getApiErrorMessage(error, fallbackMessage));
      throw error;
    } finally {
      if (reset) {
        state.isLoading.set(false);
      } else {
        state.isLoadingMore.set(false);
      }
    }
  }

  protected formatServicePrice(amount: number | null | undefined, currency: string | null | undefined): string {
    return formatServicePrice(amount, currency);
  }

  private clearSelectedTiming(preserveManualDuration: boolean): void {
    this.selectedSlot.set(null);
    this.selectedEndTime.set('');

    if (!preserveManualDuration) {
      this.hasManualEndOverride.set(false);
      this.manualDurationMinutes.set(null);
    }

    this.clearFieldErrors('startAtUtc', 'newStartAtUtc', 'manualEndAtUtc', 'newManualEndAtUtc');
  }

  private initializeRescheduleTiming(): void {
    if (this.mode !== 'reschedule') {
      return;
    }

    this.selectedEndTime.set(this.currentEndAtUtc ? utcToLocalDateTimeParts(this.currentEndAtUtc).time : '');
    this.manualDurationMinutes.set(this.currentDurationMinutes > 0 ? this.currentDurationMinutes : null);
    this.hasManualEndOverride.set(this.currentDurationMinutes > 0);
  }

  private endFieldKey(): 'manualEndAtUtc' | 'newManualEndAtUtc' {
    return this.mode === 'reschedule' ? 'newManualEndAtUtc' : 'manualEndAtUtc';
  }
}
