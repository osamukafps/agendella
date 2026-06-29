import type { AppointmentResponse, AppointmentStatus, AvailabilitySlotDto } from '../../core/api/api.models';

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

export function todayApiDate(): string {
  return toApiDate(new Date());
}

// ─── Status labels e classes ──────────────────────────────────────────────────

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  Scheduled: 'Agendado',
  Cancelled: 'Cancelado',
  Completed: 'Concluído',
  NoShow:    'Não compareceu',
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
    NoShow:    'badge-noshow',
  };
  return map[status] ?? 'badge-default';
}

// ─── Regras de ação por status ────────────────────────────────────────────────

export function canComplete(status: AppointmentStatus): boolean     { return status === 'Scheduled'; }
export function canNoShow(status: AppointmentStatus): boolean       { return status === 'Scheduled'; }
export function canCancel(status: AppointmentStatus): boolean       { return status === 'Scheduled'; }
export function canReschedule(status: AppointmentStatus): boolean   { return status === 'Scheduled'; }
export function canResolveReview(requiresReview: boolean): boolean  { return requiresReview; }

export function hasAnyAction(appt: AppointmentResponse): boolean {
  return canComplete(appt.status) || canResolveReview(appt.requiresReview);
}

// ─── Tipos de conflito ────────────────────────────────────────────────────────

export const CONFLICT_LABELS: Record<string, string> = {
  business_hours:              'Fora do horário de funcionamento do salão',
  professional_availability:   'Fora da disponibilidade da profissional',
  salon_block:                 'Bloqueio do salão neste horário',
  professional_absence:        'Ausência da profissional neste horário',
  existing_appointment:        'Já existe um agendamento neste horário',
};

export function conflictTypeLabel(conflictType: string): string {
  return CONFLICT_LABELS[conflictType] ?? 'Conflito de horário';
}

// ─── Seletor semanal ──────────────────────────────────────────────────────────

export interface WeekDay {
  date: string;   // YYYY-MM-DD
  abbr: string;   // 'Seg', 'Ter', ...
  num: number;    // day of month
  isToday: boolean;
}

const ABBRS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function getWeekDays(base: Date = new Date()): WeekDay[] {
  const today = toApiDate();
  const dow = base.getDay(); // 0 = Sun
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const monday = new Date(base);
  monday.setDate(base.getDate() - daysFromMon);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = toApiDate(d);
    return { date: dateStr, abbr: ABBRS[d.getDay()], num: d.getDate(), isToday: dateStr === today };
  });
}

export function isSameLocalDay(utcStr: string, dateStr: string): boolean {
  const local = new Date(utcStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
  return local === dateStr;
}

// ─── Duração legível ──────────────────────────────────────────────────────────

export function formatDuration(startUtc: string, endUtc: string): string {
  const mins = Math.round((new Date(endUtc).getTime() - new Date(startUtc).getTime()) / 60000);
  return mins >= 60
    ? `${Math.floor(mins / 60)}h${mins % 60 ? String(mins % 60).padStart(2, '0') : ''}`
    : `${mins} min`;
}
