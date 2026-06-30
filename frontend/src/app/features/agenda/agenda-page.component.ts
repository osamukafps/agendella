import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

type AppointmentStatusTone = 'scheduled' | 'active' | 'completed' | 'review' | 'cancelled';

interface TimelineSlot {
  time: string;
  label: string;
  gridRow: string;
  isHour: boolean;
}

interface DayChip {
  id: string;
  weekday: string;
  dayNumber: string;
  isToday: boolean;
  isWeekend: boolean;
}

interface ViewModeOption {
  id: 'day' | 'week' | 'month';
  label: string;
  active: boolean;
}

interface SummaryMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
}

interface Insight {
  id: string;
  text: string;
  emphasis: string;
}

interface DailyAppointment {
  id: string;
  startTime: string;
  endTime: string;
  durationSlots: number;
  isCompact: boolean;
  clientName: string;
  serviceName: string;
  professionalName: string;
  statusLabel: string;
  statusTone: AppointmentStatusTone;
  statusColor: string;
  statusBackground: string;
  details: string;
  gridRow: string;
}

const TIMELINE_START_MINUTES = 9 * 60;
const TIMELINE_END_MINUTES = 18 * 60;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT_PX = 72;
const TODAY = new Date();

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesFromDate(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function toGridRow(startTime: string, endTime: string, minimumSpan = 1): string {
  const rowStart = ((minutesFromTime(startTime) - TIMELINE_START_MINUTES) / SLOT_MINUTES) + 1;
  const durationSpan = (minutesFromTime(endTime) - minutesFromTime(startTime)) / SLOT_MINUTES;
  const span = Math.max(minimumSpan, durationSpan);
  return `${rowStart} / span ${span}`;
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatTimeLabel(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function isSameCalendarDate(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function buildWeekDays(referenceDate: Date): DayChip[] {
  const weekdayIndex = referenceDate.getDay();
  const mondayOffset = weekdayIndex === 0 ? -6 : 1 - weekdayIndex;
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' })
      .format(date)
      .replace('.', '')
      .slice(0, 3);

    return {
      id: date.toISOString(),
      weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
      dayNumber: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(date),
      isToday: date.toDateString() === referenceDate.toDateString(),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
    };
  });
}

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly currentDateTime = signal(new Date());
  private readonly nowTimerId = typeof window === 'undefined'
    ? null
    : window.setInterval(() => {
      this.currentDateTime.set(new Date());
    }, 60_000);
  private readonly agendaDate = TODAY;

  protected readonly dayLabel = formatDateLabel(TODAY);
  protected readonly weekDays = buildWeekDays(TODAY);
  protected readonly viewModes: ViewModeOption[] = [
    { id: 'day', label: 'Dia', active: true },
    { id: 'week', label: 'Semana', active: false },
    { id: 'month', label: 'Mês', active: false },
  ];
  protected readonly isCurrentDayView = computed(() =>
    isSameCalendarDate(this.agendaDate, this.currentDateTime())
  );
  protected readonly currentTimeLabel = computed(() =>
    `Agora · ${formatTimeLabel(this.currentDateTime())}`
  );
  protected readonly showNowMarker = computed(() => {
    if (!this.isCurrentDayView()) {
      return false;
    }

    const currentMinutes = minutesFromDate(this.currentDateTime());
    return currentMinutes >= TIMELINE_START_MINUTES && currentMinutes <= TIMELINE_END_MINUTES;
  });
  protected readonly nowLineTop = computed(() => {
    const currentMinutes = minutesFromDate(this.currentDateTime());
    return `${((currentMinutes - TIMELINE_START_MINUTES) / SLOT_MINUTES) * SLOT_HEIGHT_PX}px`;
  });

  protected readonly greetingName = computed(() => {
    const displayName = this.authService.currentUser()?.displayName?.trim();
    return displayName ? displayName.split(/\s+/)[0] : 'Beatriz';
  });

  protected readonly salonName = computed(() =>
    this.authService.currentUser()?.salonName ?? 'Atelier Belle Vie'
  );

  protected readonly timeSlots: TimelineSlot[] = Array.from(
    { length: (TIMELINE_END_MINUTES - TIMELINE_START_MINUTES) / SLOT_MINUTES },
    (_, index) => {
      const totalMinutes = TIMELINE_START_MINUTES + (index * SLOT_MINUTES);
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const minutes = (totalMinutes % 60).toString().padStart(2, '0');
      const time = `${hours}:${minutes}`;

      return {
        time,
        label: minutes === '00' ? time : '',
        gridRow: `${index + 1}`,
        isHour: minutes === '00',
      };
    }
  );

  protected readonly appointments: DailyAppointment[] = [
    {
      id: 'appt-01',
      startTime: '09:00',
      endTime: '10:00',
      durationSlots: 2,
      isCompact: false,
      clientName: 'Mariana Coelho',
      serviceName: 'Escova modelada',
      professionalName: 'Camila',
      statusLabel: 'Concluído',
      statusTone: 'completed',
      statusColor: 'var(--color-neutral-600)',
      statusBackground: 'var(--color-neutral-100)',
      details: 'Finalizado sem pendências.',
      gridRow: toGridRow('09:00', '10:00'),
    },
    {
      id: 'appt-02',
      startTime: '10:30',
      endTime: '11:30',
      durationSlots: 2,
      isCompact: false,
      clientName: 'Beatriz Andrade',
      serviceName: 'Manicure e pedicure',
      professionalName: 'Larissa',
      statusLabel: 'Em atendimento',
      statusTone: 'active',
      statusColor: 'var(--color-secondary)',
      statusBackground: 'var(--color-secondary-subtle)',
      details: 'Mesa 2, esmaltação em andamento.',
      gridRow: toGridRow('10:30', '11:30'),
    },
    {
      id: 'appt-03',
      startTime: '13:00',
      endTime: '14:00',
      durationSlots: 2,
      isCompact: false,
      clientName: 'Sofia Marques',
      serviceName: 'Design de sobrancelhas',
      professionalName: 'Camila',
      statusLabel: 'Agendado',
      statusTone: 'scheduled',
      statusColor: 'var(--color-primary)',
      statusBackground: 'var(--color-primary-subtle)',
      details: 'Confirmado por WhatsApp.',
      gridRow: toGridRow('13:00', '14:00'),
    },
    {
      id: 'appt-04',
      startTime: '14:30',
      endTime: '15:30',
      durationSlots: 2,
      isCompact: false,
      clientName: 'Antonella Reis',
      serviceName: 'Hidratação profunda',
      professionalName: 'Larissa',
      statusLabel: 'Revisar',
      statusTone: 'review',
      statusColor: 'var(--color-warning)',
      statusBackground: 'var(--color-warning-subtle)',
      details: 'Revisar encaixe com bloqueio.',
      gridRow: toGridRow('14:30', '15:30'),
    },
    {
      id: 'appt-05',
      startTime: '17:30',
      endTime: '18:00',
      durationSlots: 1,
      isCompact: true,
      clientName: 'Eduarda Lima',
      serviceName: 'Escova + penteado',
      professionalName: 'Camila',
      statusLabel: 'Cancelado',
      statusTone: 'cancelled',
      statusColor: 'var(--color-error)',
      statusBackground: 'var(--color-error-subtle)',
      details: 'Reagendado para quinta.',
      gridRow: toGridRow('17:30', '18:00', 2),
    },
  ];

  protected readonly summaryMetrics: SummaryMetric[] = [
    { id: 'clients', label: 'Clientes atendidas', value: '284', detail: 'no mês de junho' },
    { id: 'revenue', label: 'Faturamento', value: 'R$ 38.420', detail: '+12% vs. maio' },
    { id: 'new', label: 'Novas clientes', value: '42', detail: 'primeira visita' },
    { id: 'return', label: 'Taxa de retorno', value: '78%', detail: 'clientes recorrentes' },
  ];

  protected readonly insights: Insight[] = [
    { id: 'best-day', text: 'Seu melhor dia foi', emphasis: 'sexta-feira, com 38 atendimentos.' },
    { id: 'best-service', text: 'Serviço mais vendido:', emphasis: 'Escova modelada (94 vezes).' },
    { id: 'growth', text: 'Faturamento com', emphasis: '+12% em relação ao mês passado.' },
  ];

  protected readonly statusLegend = [
    { id: 'scheduled', label: 'Agendado', color: 'var(--color-primary)' },
    { id: 'active', label: 'Em atendimento', color: 'var(--color-secondary)' },
    { id: 'completed', label: 'Concluído', color: 'var(--color-neutral-400)' },
    { id: 'review', label: 'Revisar', color: 'var(--color-warning)' },
  ];

  ngOnDestroy(): void {
    if (this.nowTimerId !== null) {
      window.clearInterval(this.nowTimerId);
    }
  }
}
