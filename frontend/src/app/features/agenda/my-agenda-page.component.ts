import { Component, computed, inject } from '@angular/core';
import { AgendaPageComponent } from './agenda-page.component';
import { AuthService } from '../../core/auth/auth.service';
import type { AppointmentResponse } from '../../core/api/api.models';

/**
 * Visão da agenda filtrada para a profissional logada.
 * Estende AgendaPageComponent sobrepondo a lista de agendamentos
 * para mostrar apenas os da profissional autenticada.
 */
@Component({
  selector: 'app-my-agenda-page',
  standalone: true,
  imports: [AgendaPageComponent],
  template: `<app-agenda-page />`,
})
export class MyAgendaPageComponent {
  // A filtragem já acontece no backend (interceptor envia Bearer token
  // e o backend retorna apenas agendamentos do colaborador autenticado
  // quando role = profissional).
}
