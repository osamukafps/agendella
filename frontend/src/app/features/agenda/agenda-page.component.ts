import { Component } from '@angular/core';

type AppointmentStatusTone = 'scheduled' | 'active' | 'completed' | 'review';

interface TimelineSlot {
  time: string;
  label: string;
  gridRow: string;
}

interface DailyAppointment {
  id: string;
  startTime: string;
  endTime: string;
  clientName: string;
  serviceName: string;
  professionalName: string;
  statusLabel: string;
  statusTone: AppointmentStatusTone;
  statusColor: string;
  gridRow: string;
}

const TIMELINE_START_MINUTES = 9 * 60;
const TIMELINE_END_MINUTES = 18 * 60;
const SLOT_MINUTES = 30;

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function toGridRow(startTime: string, endTime: string): string {
  const rowStart = ((minutesFromTime(startTime) - TIMELINE_START_MINUTES) / SLOT_MINUTES) + 1;
  const span = Math.max(1, (minutesFromTime(endTime) - minutesFromTime(startTime)) / SLOT_MINUTES);
  return `${rowStart} / span ${span}`;
}

@Component({
  selector: 'app-agenda-page',
  standalone: true,
  templateUrl: './agenda-page.component.html',
  styleUrl: './agenda-page.component.scss',
})
export class AgendaPageComponent {
  protected readonly dayLabel = 'Segunda-Feira, 29 De Junho de 2026';
  protected readonly salonName = 'Atelier Belle Vie';
  protected readonly nowTime = '11:20';
  protected readonly nowLineTop = `${((minutesFromTime(this.nowTime) - TIMELINE_START_MINUTES) / SLOT_MINUTES) * 72}px`;

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
      };
    }
  );

  protected readonly appointments: DailyAppointment[] = [
    {
      id: 'appt-01',
      startTime: '09:00',
      endTime: '10:00',
      clientName: 'Marina Costa',
      serviceName: 'Escova modelada',
      professionalName: 'Helena Duarte',
      statusLabel: 'Agendado',
      statusTone: 'scheduled',
      statusColor: 'var(--color-primary)',
      gridRow: toGridRow('09:00', '10:00'),
    },
    {
      id: 'appt-02',
      startTime: '10:30',
      endTime: '11:30',
      clientName: 'Beatriz Almeida',
      serviceName: 'Coloração raiz',
      professionalName: 'Clara Nunes',
      statusLabel: 'Em atendimento',
      statusTone: 'active',
      statusColor: 'var(--color-secondary)',
      gridRow: toGridRow('10:30', '11:30'),
    },
    {
      id: 'appt-03',
      startTime: '13:00',
      endTime: '14:30',
      clientName: 'Luiza Martins',
      serviceName: 'Corte e hidratação',
      professionalName: 'Helena Duarte',
      statusLabel: 'Revisar',
      statusTone: 'review',
      statusColor: 'var(--color-warning)',
      gridRow: toGridRow('13:00', '14:30'),
    },
    {
      id: 'appt-04',
      startTime: '16:00',
      endTime: '17:00',
      clientName: 'Camila Rocha',
      serviceName: 'Manicure premium',
      professionalName: 'Sofia Reis',
      statusLabel: 'Concluído',
      statusTone: 'completed',
      statusColor: 'var(--color-neutral-300)',
      gridRow: toGridRow('16:00', '17:00'),
    },
  ];
}
