import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = dirname(fileURLToPath(import.meta.url));

function read(relativePath: string): string {
  return readFileSync(resolve(currentDir, relativePath), 'utf8');
}

describe('responsive smoke', () => {
  it('keeps the mobile bottom navigation in the authenticated shell', () => {
    const shellTemplate = read('./core/layout/app-shell.component.html');
    expect(shellTemplate).toContain('bottom-nav');
  });

  it('keeps agenda flows wired through dedicated mobile-capable components', () => {
    const agendaComponent = read('./features/agenda/agenda-page.component.ts');
    expect(agendaComponent).toContain('AppointmentFormComponent');
    expect(agendaComponent).toContain('AppointmentActionsComponent');
  });

  it('keeps tenant setup and history screens as standalone routes', () => {
    const professionalsComponent = read('./features/professionals/professionals-page.component.ts');
    const clientHistoryComponent = read('./features/clients/client-history-page.component.ts');
    expect(professionalsComponent).toContain('standalone: true');
    expect(clientHistoryComponent).toContain('standalone: true');
  });
});
