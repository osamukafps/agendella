import type {
  AppointmentResponse,
  AppointmentStatus,
  AvailabilitySlotDto,
  ClientResponse,
  ProfessionalResponse,
  ServiceResponse,
} from '../../core/api/api.models';

export const DEFAULT_TIMELINE_START_MINUTES = 8 * 60;
export const DEFAULT_TIMELINE_END_MINUTES = 18 * 60;
export const SLOT_MINUTES = 30;

const ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── Formatação de datas/horários ─────────────────────────────────────────────

export function formatLocalTime(utcStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })
    .format(new Date(utcStr));
}

export function formatSlotTime(slot: AvailabilitySlotDto): string {
  return `${formatLocalTime(slot.startAtUtc)} – ${formatLocalTime(slot.endAtUtc)}`;
}

export function toApiDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseApiDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function todayApiDate(): string {
  return toApiDate(new Date());
}

export function shiftApiDate(dateStr: string, days: number): string {
  const date = parseApiDate(dateStr);
  date.setDate(date.getDate() + days);
  return toApiDate(date);
}

export function formatAgendaDateLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseApiDate(dateStr));
}

// ─── Status labels e classes ──────────────────────────────────────────────────

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Scheduled: 'Agendado',
  Cancelled: 'Cancelado',
  Completed: 'Concluído',
  NoShow: 'Não compareceu',
};

export function getStatusLabel(status: AppointmentStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusBadgeClass(status: AppointmentStatus, requiresReview: boolean): string {
  if (requiresReview) return 'badge-review';
  const map: Record<AppointmentStatus, string> = {
    Scheduled: 'badge-scheduled',
    Cancelled: 'badge-cancelled',
    Completed: 'badge-completed',
    NoShow: 'badge-noshow',
  };
  return map[status] ?? 'badge-default';
}

export function getStatusCardClass(status: AppointmentStatus, requiresReview: boolean): string {
  if (requiresReview) return 'appt-card--review';

  const map: Record<AppointmentStatus, string> = {
    Scheduled: 'appt-card--scheduled',
    Cancelled: 'appt-card--cancelled',
    Completed: 'appt-card--completed',
    NoShow: 'appt-card--noshow',
  };

  return map[status] ?? 'appt-card--scheduled';
}

// ─── Regras de ação por status ────────────────────────────────────────────────

export function canComplete(status: AppointmentStatus): boolean { return status === 'Scheduled'; }
export function canNoShow(status: AppointmentStatus): boolean { return status === 'Scheduled'; }
export function canCancel(status: AppointmentStatus): boolean { return status === 'Scheduled'; }
export function canReschedule(status: AppointmentStatus): boolean { return status === 'Scheduled'; }
export function canResolveReview(requiresReview: boolean): boolean { return requiresReview; }

export function hasAnyAction(appt: AppointmentResponse): boolean {
  return canComplete(appt.status) || canResolveReview(appt.requiresReview);
}

// ─── Tipos de conflito ────────────────────────────────────────────────────────

export const CONFLICT_LABELS: Record<string, string> = {
  business_hours: 'Fora do horário de funcionamento do salão',
  professional_availability: 'Fora da disponibilidade da profissional',
  salon_block: 'Bloqueio do salão neste horário',
  professional_absence: 'Ausência da profissional neste horário',
  existing_appointment: 'Já existe um agendamento neste horário',
};

export function conflictTypeLabel(conflictType: string): string {
  return CONFLICT_LABELS[conflictType] ?? 'Conflito de horário';
}

// ─── Seletor semanal ──────────────────────────────────────────────────────────

export interface WeekDay {
  date: string;
  abbr: string;
  num: number;
  isToday: boolean;
}

export function getWeekDays(base: Date = new Date()): WeekDay[] {
  const today = todayApiDate();
  const dow = base.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(base);
  monday.setDate(base.getDate() - daysFromMon);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const dateStr = toApiDate(date);

    return {
      date: dateStr,
      abbr: ABBRS[date.getDay()],
      num: date.getDate(),
      isToday: dateStr === today,
    };
  });
}

export function isSameLocalDay(utcStr: string, dateStr: string): boolean {
  return toApiDate(new Date(utcStr)) === dateStr;
}

// ─── Duração legível ──────────────────────────────────────────────────────────

export function formatDuration(startUtc: string, endUtc: string): string {
  const mins = Math.round((new Date(endUtc).getTime() - new Date(startUtc).getTime()) / 60000);
  return mins >= 60
    ? `${Math.floor(mins / 60)}h${mins % 60 ? String(mins % 60).padStart(2, '0') : ''}`
    : `${mins} min`;
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineBounds {
  startMinutes: number;
  endMinutes: number;
  slotCount: number;
}

export interface TimelineSlot {
  time: string;
  label: string;
  gridRow: string;
  isHour: boolean;
}

function minutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesFromUtcString(utcStr: string): number {
  return minutesFromDate(new Date(utcStr));
}

function floorToSlot(minutes: number): number {
  return Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

function ceilToSlot(minutes: number): number {
  return Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

function clampMinutes(minutes: number): number {
  return Math.max(0, Math.min(24 * 60, minutes));
}

export function getTimelineBounds(
  appointments: AppointmentResponse[],
  isCurrentDay: boolean,
  now: Date = new Date(),
): TimelineBounds {
  if (appointments.length === 0) {
    return {
      startMinutes: DEFAULT_TIMELINE_START_MINUTES,
      endMinutes: DEFAULT_TIMELINE_END_MINUTES,
      slotCount: (DEFAULT_TIMELINE_END_MINUTES - DEFAULT_TIMELINE_START_MINUTES) / SLOT_MINUTES,
    };
  }

  const starts = appointments.map(appointment => minutesFromUtcString(appointment.startAtUtc));
  const ends = appointments.map(appointment => minutesFromUtcString(appointment.endAtUtc));

  if (isCurrentDay) {
    const nowMinutes = minutesFromDate(now);
    starts.push(nowMinutes);
    ends.push(nowMinutes);
  }

  const earliest = Math.min(...starts);
  const latest = Math.max(...ends);
  const startMinutes = clampMinutes(Math.min(
    DEFAULT_TIMELINE_START_MINUTES,
    floorToSlot(earliest - SLOT_MINUTES),
  ));
  const endMinutes = clampMinutes(Math.max(
    DEFAULT_TIMELINE_END_MINUTES,
    ceilToSlot(latest + SLOT_MINUTES),
  ));

  return {
    startMinutes,
    endMinutes,
    slotCount: Math.max(1, (endMinutes - startMinutes) / SLOT_MINUTES),
  };
}

export function buildTimelineSlots(bounds: TimelineBounds): TimelineSlot[] {
  return Array.from({ length: bounds.slotCount }, (_, index) => {
    const totalMinutes = bounds.startMinutes + (index * SLOT_MINUTES);
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;

    return {
      time,
      label: minutes === '00' ? time : '',
      gridRow: `${index + 1}`,
      isHour: minutes === '00',
    };
  });
}

export function getNowMarkerTop(bounds: TimelineBounds, now: Date = new Date()): string {
  const offsetMinutes = minutesFromDate(now) - bounds.startMinutes;
  return `${(offsetMinutes / SLOT_MINUTES) * 72}px`;
}

function toGridRow(startUtc: string, endUtc: string, timelineStartMinutes: number): string {
  const startMinutes = minutesFromUtcString(startUtc);
  const endMinutes = minutesFromUtcString(endUtc);
  const rowStart = Math.max(1, Math.floor((startMinutes - timelineStartMinutes) / SLOT_MINUTES) + 1);
  const span = Math.max(1, Math.ceil((endMinutes - startMinutes) / SLOT_MINUTES));
  return `${rowStart} / span ${span}`;
}

// ─── View-model da agenda ─────────────────────────────────────────────────────

export interface AgendaLookupMaps {
  clientsById: ReadonlyMap<string, string>;
  professionalsById: ReadonlyMap<string, string>;
  servicesById: ReadonlyMap<string, string>;
}

export interface AgendaAppointmentViewModel {
  id: string;
  appointment: AppointmentResponse;
  clientName: string;
  serviceName: string;
  professionalName: string;
  startAtUtc: string;
  endAtUtc: string;
  startTimeLabel: string;
  endTimeLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
  statusLabel: string;
  gridRow: string;
}

export interface AgendaSummary {
  total: number;
  requiresReview: number;
  statusCounts: Record<AppointmentStatus, number>;
  nextAppointment: AgendaAppointmentViewModel | null;
}

export function buildAgendaLookupMaps(
  clients: ClientResponse[],
  professionals: ProfessionalResponse[],
  services: ServiceResponse[],
): AgendaLookupMaps {
  return {
    clientsById: new Map(clients.map(client => [client.id, client.name])),
    professionalsById: new Map(professionals.map(professional => [professional.id, professional.name])),
    servicesById: new Map(services.map(service => [service.id, service.name])),
  };
}

function getClientName(lookup: AgendaLookupMaps, clientId: string): string {
  return lookup.clientsById.get(clientId) ?? 'Cliente não encontrado';
}

function getServiceName(lookup: AgendaLookupMaps, serviceId: string): string {
  return lookup.servicesById.get(serviceId) ?? 'Serviço não encontrado';
}

function getProfessionalName(lookup: AgendaLookupMaps, professionalId: string): string {
  return lookup.professionalsById.get(professionalId) ?? 'Profissional não encontrada';
}

export function buildAgendaAppointments(
  appointments: AppointmentResponse[],
  lookups: AgendaLookupMaps,
  timelineStartMinutes: number,
): AgendaAppointmentViewModel[] {
  return [...appointments]
    .sort((left, right) => new Date(left.startAtUtc).getTime() - new Date(right.startAtUtc).getTime())
    .map(appointment => {
      const startTimeLabel = formatLocalTime(appointment.startAtUtc);
      const endTimeLabel = formatLocalTime(appointment.endAtUtc);

      return {
        id: appointment.id,
        appointment,
        clientName: getClientName(lookups, appointment.clientId),
        serviceName: getServiceName(lookups, appointment.serviceId),
        professionalName: getProfessionalName(lookups, appointment.professionalId),
        startAtUtc: appointment.startAtUtc,
        endAtUtc: appointment.endAtUtc,
        startTimeLabel,
        endTimeLabel,
        timeRangeLabel: `${startTimeLabel} - ${endTimeLabel}`,
        durationLabel: formatDuration(appointment.startAtUtc, appointment.endAtUtc),
        statusLabel: getStatusLabel(appointment.status),
        gridRow: toGridRow(appointment.startAtUtc, appointment.endAtUtc, timelineStartMinutes),
      };
    });
}

export function buildAgendaSummary(
  appointments: AgendaAppointmentViewModel[],
  now: Date = new Date(),
): AgendaSummary {
  const statusCounts: Record<AppointmentStatus, number> = {
    Scheduled: 0,
    Cancelled: 0,
    Completed: 0,
    NoShow: 0,
  };

  appointments.forEach(appointment => {
    statusCounts[appointment.appointment.status] += 1;
  });

  const nextAppointment = appointments.find(appointment =>
    new Date(appointment.startAtUtc).getTime() >= now.getTime(),
  ) ?? appointments[0] ?? null;

  return {
    total: appointments.length,
    requiresReview: appointments.filter(appointment => appointment.appointment.requiresReview).length,
    statusCounts,
    nextAppointment,
  };
}
