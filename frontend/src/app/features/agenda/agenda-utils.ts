import type {
  AppointmentResponse,
  AppointmentStatus,
  AvailabilitySlotDto,
  BusinessHourDto,
  ClientResponse,
  ProfessionalResponse,
  ServiceResponse,
} from '../../core/api/api.models';
import type { CollaboratorRole } from '../../core/auth/auth.models';

export const DEFAULT_TIMELINE_START_MINUTES = 8 * 60;
export const DEFAULT_TIMELINE_END_MINUTES = 18 * 60;
export const SLOT_MINUTES = 30;
export const TIMELINE_SLOT_HEIGHT_PX = 72;
export const TIMELINE_APPOINTMENT_VERTICAL_GAP_PX = 8;
export const MIN_TIMELINE_APPOINTMENT_HEIGHT_PX = 76;

const ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const API_DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

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

export function getApiDayOfWeek(dateStr: string): BusinessHourDto['dayOfWeek'] {
  return API_DAY_ORDER[parseApiDate(dateStr).getDay()];
}

export function formatBusinessHoursLabel(hours: BusinessHourDto | null | undefined): string {
  if (!hours || hours.isClosed || !hours.startLocalTime || !hours.endLocalTime) {
    return 'Fechado neste dia';
  }

  return `${hours.startLocalTime} - ${hours.endLocalTime}`;
}

export function minutesFromLocalTime(localTime: string | null | undefined): number | null {
  if (!localTime) {
    return null;
  }

  const [hours, minutes] = localTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return (hours * 60) + minutes;
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
export function canResolveReview(
  requiresReview: boolean,
  role?: CollaboratorRole | null,
): boolean {
  return requiresReview && role === 'administradora';
}

export function hasAnyAction(
  appt: AppointmentResponse,
  role?: CollaboratorRole | null,
): boolean {
  return canComplete(appt.status)
    || canNoShow(appt.status)
    || canCancel(appt.status)
    || canReschedule(appt.status)
    || canResolveReview(appt.requiresReview, role);
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
  return formatDurationMinutes(getDurationMinutes(startUtc, endUtc));
}

export function getDurationMinutes(startUtc: string, endUtc: string): number {
  return Math.round((new Date(endUtc).getTime() - new Date(startUtc).getTime()) / 60000);
}

export function formatDurationMinutes(minutes: number): string {
  return minutes >= 60
    ? `${Math.floor(minutes / 60)}h${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`
    : `${minutes} min`;
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
  businessHours?: BusinessHourDto | null,
  now: Date = new Date(),
): TimelineBounds {
  const businessStart = minutesFromLocalTime(businessHours?.startLocalTime);
  const businessEnd = minutesFromLocalTime(businessHours?.endLocalTime);
  const fallbackStart = businessStart ?? DEFAULT_TIMELINE_START_MINUTES;
  const fallbackEnd = businessEnd ?? DEFAULT_TIMELINE_END_MINUTES;

  if (appointments.length === 0) {
    const endMinutes = clampMinutes(
      ceilToSlot(fallbackEnd + SLOT_MINUTES),
    );

    return {
      startMinutes: clampMinutes(floorToSlot(fallbackStart)),
      endMinutes,
      slotCount: Math.max(1, (endMinutes - clampMinutes(floorToSlot(fallbackStart))) / SLOT_MINUTES),
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
    fallbackStart,
    floorToSlot(earliest - SLOT_MINUTES),
  ));
  const endMinutes = clampMinutes(Math.max(
    ceilToSlot(fallbackEnd + SLOT_MINUTES),
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
  return `${(offsetMinutes / SLOT_MINUTES) * TIMELINE_SLOT_HEIGHT_PX}px`;
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
  durationMinutes: number;
  startAtUtc: string;
  endAtUtc: string;
  startTimeLabel: string;
  endTimeLabel: string;
  timeRangeLabel: string;
  durationLabel: string;
  statusLabel: string;
  gridRow: string;
  layout: {
    topPx: number;
    heightPx: number;
    laneIndex: number;
    laneCount: number;
    clusterId: string;
  };
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

interface AgendaAppointmentLayoutSeed {
  id: string;
  startAtUtc: string;
  endAtUtc: string;
}

interface AgendaAppointmentLayout {
  topPx: number;
  heightPx: number;
  laneIndex: number;
  laneCount: number;
  clusterId: string;
}

function getLocalMinutesBounds(startAtUtc: string, endAtUtc: string): { startMinutes: number; endMinutes: number } {
  return {
    startMinutes: minutesFromUtcString(startAtUtc),
    endMinutes: minutesFromUtcString(endAtUtc),
  };
}

export function buildAppointmentLayout(
  appointments: AgendaAppointmentLayoutSeed[],
  timelineStartMinutes: number,
): ReadonlyMap<string, AgendaAppointmentLayout> {
  const sortedAppointments = [...appointments]
    .map(appointment => ({
      appointment,
      ...getLocalMinutesBounds(appointment.startAtUtc, appointment.endAtUtc),
    }))
    .sort((left, right) => (
      left.startMinutes - right.startMinutes
      || left.endMinutes - right.endMinutes
      || left.appointment.id.localeCompare(right.appointment.id)
    ));

  const layoutById = new Map<string, AgendaAppointmentLayout>();
  const clusterAssignments: Array<{
    id: string;
    startMinutes: number;
    endMinutes: number;
    laneIndex: number;
  }> = [];

  let currentClusterId = 0;
  let currentClusterEnd = Number.NEGATIVE_INFINITY;
  let currentClusterItems: typeof sortedAppointments = [];

  const flushCluster = (): void => {
    if (currentClusterItems.length === 0) {
      return;
    }

    const laneEnds: number[] = [];

    currentClusterItems.forEach(item => {
      let laneIndex = laneEnds.findIndex(endMinutes => endMinutes <= item.startMinutes);
      if (laneIndex === -1) {
        laneIndex = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[laneIndex] = item.endMinutes;
      }

      clusterAssignments.push({
        id: item.appointment.id,
        startMinutes: item.startMinutes,
        endMinutes: item.endMinutes,
        laneIndex,
      });
    });

    const laneCount = laneEnds.length;
    const clusterId = `cluster-${currentClusterId}`;

    clusterAssignments.splice(0).forEach(assignment => {
      const rawHeightPx = ((assignment.endMinutes - assignment.startMinutes) / SLOT_MINUTES) * TIMELINE_SLOT_HEIGHT_PX;

      layoutById.set(assignment.id, {
        topPx: ((assignment.startMinutes - timelineStartMinutes) / SLOT_MINUTES) * TIMELINE_SLOT_HEIGHT_PX,
        heightPx: Math.max(
          MIN_TIMELINE_APPOINTMENT_HEIGHT_PX,
          rawHeightPx - TIMELINE_APPOINTMENT_VERTICAL_GAP_PX,
        ),
        laneIndex: assignment.laneIndex,
        laneCount,
        clusterId,
      });
    });

    currentClusterItems = [];
  };

  sortedAppointments.forEach(item => {
    if (currentClusterItems.length === 0) {
      currentClusterId += 1;
      currentClusterEnd = item.endMinutes;
      currentClusterItems = [item];
      return;
    }

    if (item.startMinutes < currentClusterEnd) {
      currentClusterItems.push(item);
      currentClusterEnd = Math.max(currentClusterEnd, item.endMinutes);
      return;
    }

    flushCluster();
    currentClusterId += 1;
    currentClusterEnd = item.endMinutes;
    currentClusterItems = [item];
  });

  flushCluster();

  return layoutById;
}

export function buildAgendaAppointments(
  appointments: AppointmentResponse[],
  lookups: AgendaLookupMaps,
  timelineStartMinutes: number,
): AgendaAppointmentViewModel[] {
  const sortedAppointments = [...appointments]
    .sort((left, right) => new Date(left.startAtUtc).getTime() - new Date(right.startAtUtc).getTime());
  const layoutById = buildAppointmentLayout(sortedAppointments, timelineStartMinutes);

  return sortedAppointments
    .map(appointment => {
      const startTimeLabel = formatLocalTime(appointment.startAtUtc);
      const endTimeLabel = formatLocalTime(appointment.endAtUtc);
      const durationMinutes = getDurationMinutes(appointment.startAtUtc, appointment.endAtUtc);

      return {
        id: appointment.id,
        appointment,
        clientName: getClientName(lookups, appointment.clientId),
        serviceName: getServiceName(lookups, appointment.serviceId),
        professionalName: getProfessionalName(lookups, appointment.professionalId),
        durationMinutes,
        startAtUtc: appointment.startAtUtc,
        endAtUtc: appointment.endAtUtc,
        startTimeLabel,
        endTimeLabel,
        timeRangeLabel: `${startTimeLabel} - ${endTimeLabel}`,
        durationLabel: formatDurationMinutes(durationMinutes),
        statusLabel: getStatusLabel(appointment.status),
        gridRow: toGridRow(appointment.startAtUtc, appointment.endAtUtc, timelineStartMinutes),
        layout: layoutById.get(appointment.id)!,
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
