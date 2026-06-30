import { describe, expect, it } from 'vitest';
import {
  MIN_TIMELINE_APPOINTMENT_HEIGHT_PX,
  buildAppointmentLayout,
} from './agenda-utils';

function readLayout(
  appointments: Array<{ id: string; startAtUtc: string; endAtUtc: string }>,
  timelineStartMinutes = 0,
) {
  return buildAppointmentLayout(appointments, timelineStartMinutes);
}

describe('buildAppointmentLayout()', () => {
  it('mantém card único com laneCount 1', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
    ]);

    expect(layout.get('a')).toMatchObject({
      laneIndex: 0,
      laneCount: 1,
    });
  });

  it('divide largura para dois agendamentos no mesmo horário', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
      { id: 'b', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
    ]);

    expect(layout.get('a')).toMatchObject({ laneIndex: 0, laneCount: 2 });
    expect(layout.get('b')).toMatchObject({ laneIndex: 1, laneCount: 2 });
  });

  it('trata overlap parcial como cluster compartilhado', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:45:00Z', endAtUtc: '2024-06-10T15:45:00Z' },
      { id: 'b', startAtUtc: '2024-06-10T15:00:00Z', endAtUtc: '2024-06-10T16:00:00Z' },
    ]);

    expect(layout.get('a')).toMatchObject({ laneCount: 2 });
    expect(layout.get('b')).toMatchObject({ laneCount: 2 });
    expect(layout.get('a')?.clusterId).toBe(layout.get('b')?.clusterId);
  });

  it('não trata cards adjacentes como overlap', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
      { id: 'b', startAtUtc: '2024-06-10T15:00:00Z', endAtUtc: '2024-06-10T16:00:00Z' },
    ]);

    expect(layout.get('a')).toMatchObject({ laneCount: 1, laneIndex: 0 });
    expect(layout.get('b')).toMatchObject({ laneCount: 1, laneIndex: 0 });
    expect(layout.get('a')?.clusterId).not.toBe(layout.get('b')?.clusterId);
  });

  it('mantém encadeamento de overlaps no mesmo cluster', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
      { id: 'b', startAtUtc: '2024-06-10T14:30:00Z', endAtUtc: '2024-06-10T15:30:00Z' },
      { id: 'c', startAtUtc: '2024-06-10T15:15:00Z', endAtUtc: '2024-06-10T16:00:00Z' },
    ]);

    expect(layout.get('a')?.clusterId).toBe(layout.get('b')?.clusterId);
    expect(layout.get('b')?.clusterId).toBe(layout.get('c')?.clusterId);
    expect(layout.get('a')).toMatchObject({ laneCount: 2, laneIndex: 0 });
    expect(layout.get('b')).toMatchObject({ laneCount: 2, laneIndex: 1 });
    expect(layout.get('c')).toMatchObject({ laneCount: 2, laneIndex: 0 });
  });

  it('reaproveita lane quando um card termina exatamente no início do próximo', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
      { id: 'b', startAtUtc: '2024-06-10T14:30:00Z', endAtUtc: '2024-06-10T15:30:00Z' },
      { id: 'c', startAtUtc: '2024-06-10T15:00:00Z', endAtUtc: '2024-06-10T15:45:00Z' },
    ]);

    expect(layout.get('c')).toMatchObject({ laneIndex: 0, laneCount: 2 });
  });

  it('respeita altura mínima para legibilidade', () => {
    const layout = readLayout([
      { id: 'a', startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T14:15:00Z' },
    ]);

    expect(layout.get('a')?.heightPx).toBe(MIN_TIMELINE_APPOINTMENT_HEIGHT_PX);
  });
});
