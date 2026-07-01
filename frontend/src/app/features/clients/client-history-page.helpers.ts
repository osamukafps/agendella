import type { ClientHistoryEventResponse, ClientHistoryEventType } from '../../core/api/api.models';

export interface ClientHistoryEventVisual {
  icon: string;
  accentColor: string;
  surfaceColor: string;
  borderColor: string;
  badgeBackground: string;
  badgeColor: string;
  badgeLabel: string;
}

export interface ClientHistoryTimelineItem {
  id: string;
  title: string;
  timeLabel: string;
  description: string;
  scheduleLabel: string | null;
  visual: ClientHistoryEventVisual;
}

export interface ClientHistoryTimelineGroup {
  dateKey: string;
  label: string;
  items: ClientHistoryTimelineItem[];
}

const EVENT_LABELS: Record<ClientHistoryEventType, string> = {
  AppointmentCreated: 'Agendamento criado',
  Rescheduled: 'Reagendado',
  Cancelled: 'Cancelado',
  LateCancelled: 'Cancelado com atraso',
  NoShow: 'Não compareceu',
  ReviewRequired: 'Requer revisão',
  ReviewResolved: 'Revisão resolvida',
  Completed: 'Concluído',
};

const EVENT_VISUALS: Record<ClientHistoryEventType, ClientHistoryEventVisual> = {
  AppointmentCreated: {
    icon: 'calendar-add',
    accentColor: 'var(--color-primary)',
    surfaceColor: 'rgba(255, 252, 251, 0.96)',
    borderColor: 'rgba(124, 59, 80, 0.16)',
    badgeBackground: 'var(--color-primary-subtle)',
    badgeColor: 'var(--color-primary)',
    badgeLabel: 'Agendado',
  },
  Rescheduled: {
    icon: 'repeat',
    accentColor: 'var(--color-info)',
    surfaceColor: 'rgba(249, 251, 255, 0.96)',
    borderColor: 'rgba(74, 111, 165, 0.18)',
    badgeBackground: 'var(--color-info-subtle)',
    badgeColor: 'var(--color-info)',
    badgeLabel: 'Reagendado',
  },
  Cancelled: {
    icon: 'archive-minus',
    accentColor: 'var(--color-error)',
    surfaceColor: 'rgba(255, 250, 249, 0.96)',
    borderColor: 'rgba(168, 55, 42, 0.18)',
    badgeBackground: 'var(--color-error-subtle)',
    badgeColor: 'var(--color-error)',
    badgeLabel: 'Cancelado',
  },
  LateCancelled: {
    icon: 'archive-minus',
    accentColor: 'var(--color-error)',
    surfaceColor: 'rgba(255, 250, 249, 0.96)',
    borderColor: 'rgba(168, 55, 42, 0.18)',
    badgeBackground: 'var(--color-error-subtle)',
    badgeColor: 'var(--color-error)',
    badgeLabel: 'Cancelado',
  },
  NoShow: {
    icon: 'user-remove',
    accentColor: 'var(--color-error)',
    surfaceColor: 'rgba(255, 250, 249, 0.96)',
    borderColor: 'rgba(168, 55, 42, 0.18)',
    badgeBackground: 'var(--color-error-subtle)',
    badgeColor: 'var(--color-error)',
    badgeLabel: 'Não compareceu',
  },
  ReviewRequired: {
    icon: 'danger',
    accentColor: 'var(--color-warning)',
    surfaceColor: 'rgba(255, 252, 247, 0.97)',
    borderColor: 'rgba(192, 122, 36, 0.18)',
    badgeBackground: 'var(--color-warning-subtle)',
    badgeColor: 'var(--color-warning)',
    badgeLabel: 'Revisão',
  },
  ReviewResolved: {
    icon: 'edit',
    accentColor: 'var(--color-success)',
    surfaceColor: 'rgba(248, 253, 249, 0.97)',
    borderColor: 'rgba(61, 122, 90, 0.18)',
    badgeBackground: 'var(--color-success-subtle)',
    badgeColor: 'var(--color-success)',
    badgeLabel: 'Resolvido',
  },
  Completed: {
    icon: 'archive-tick',
    accentColor: 'var(--color-success)',
    surfaceColor: 'rgba(248, 253, 249, 0.97)',
    borderColor: 'rgba(61, 122, 90, 0.18)',
    badgeBackground: 'var(--color-success-subtle)',
    badgeColor: 'var(--color-success)',
    badgeLabel: 'Concluído',
  },
};

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return formatDateKey(left) === formatDateKey(right);
}

export function getHistoryEventLabel(type: ClientHistoryEventType): string {
  return EVENT_LABELS[type] ?? type;
}

export function getHistoryEventVisual(type: ClientHistoryEventType): ClientHistoryEventVisual {
  return EVENT_VISUALS[type] ?? {
    icon: 'information',
    accentColor: 'var(--color-neutral-600)',
    surfaceColor: 'rgba(255, 255, 255, 0.96)',
    borderColor: 'rgba(168, 162, 158, 0.22)',
    badgeBackground: 'var(--color-neutral-100)',
    badgeColor: 'var(--color-neutral-600)',
    badgeLabel: 'Informação',
  };
}

export function formatHistoryTime(utc: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(utc));
}

export function formatHistoryGroupLabel(utc: string, now = new Date()): string {
  const date = new Date(utc);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameLocalDay(date, now)) {
    return 'Hoje';
  }

  if (isSameLocalDay(date, yesterday)) {
    return 'Ontem';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function normalizeHistoryDescription(description: string | null | undefined): string {
  if (!description) {
    return '';
  }

  return description
    .replace(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})(?:\s*UTC)?/g, '$1 às $2')
    .replace(/\bUTC\b/g, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function extractHistoryScheduleLabel(description: string): string | null {
  const fullDateMatch = description.match(/(\d{2}\/\d{2}\/\d{4}) às (\d{2}:\d{2})/);
  if (fullDateMatch) {
    return `${fullDateMatch[1]} às ${fullDateMatch[2]}`;
  }

  const timeOnlyMatch = description.match(/\b(\d{2}:\d{2})\b/);
  if (timeOnlyMatch) {
    return `Horário relacionado: ${timeOnlyMatch[1]}`;
  }

  return null;
}

export function buildClientHistoryTimelineGroups(
  events: ClientHistoryEventResponse[],
  now = new Date(),
): ClientHistoryTimelineGroup[] {
  const sortedEvents = [...events].sort((left, right) =>
    new Date(right.occurredAtUtc).getTime() - new Date(left.occurredAtUtc).getTime()
  );

  const groups = new Map<string, ClientHistoryTimelineGroup>();

  for (const event of sortedEvents) {
    const date = new Date(event.occurredAtUtc);
    const dateKey = formatDateKey(date);
    const description = normalizeHistoryDescription(event.description);
    const item: ClientHistoryTimelineItem = {
      id: event.id,
      title: getHistoryEventLabel(event.type),
      timeLabel: formatHistoryTime(event.occurredAtUtc),
      description,
      scheduleLabel: extractHistoryScheduleLabel(description),
      visual: getHistoryEventVisual(event.type),
    };

    const existingGroup = groups.get(dateKey);
    if (existingGroup) {
      existingGroup.items.push(item);
      continue;
    }

    groups.set(dateKey, {
      dateKey,
      label: formatHistoryGroupLabel(event.occurredAtUtc, now),
      items: [item],
    });
  }

  return [...groups.values()];
}
