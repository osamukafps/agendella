import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientHistoryApiService } from './client-history-api.service';
import type { ClientHistoryEventResponse, ClientHistoryEventType, ClientResponse } from '../../core/api/api.models';

const EVENT_LABELS: Record<ClientHistoryEventType, string> = {
  AppointmentCreated: 'Agendamento criado',
  Rescheduled:        'Reagendado',
  Cancelled:          'Cancelado',
  LateCancelled:      'Cancelado com atraso',
  NoShow:             'Não compareceu',
  ReviewRequired:     'Requer revisão',
  ReviewResolved:     'Revisão resolvida',
  Completed:          'Concluído',
};

@Component({
  selector: 'app-client-history-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './client-history-page.component.html',
  styleUrl: './clients-page.component.css',
})
export class ClientHistoryPageComponent implements OnInit {
  private readonly api   = inject(ClientHistoryApiService);
  private readonly route = inject(ActivatedRoute);

  readonly client       = signal<ClientResponse | null>(null);
  readonly events       = signal<ClientHistoryEventResponse[]>([]);
  readonly nextCursor   = signal<string | null>(null);
  readonly isLoading    = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error        = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    const clientId = this.route.snapshot.paramMap.get('clientId') ?? '';
    await this.load(clientId);
  }

  private async load(clientId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [clientRes, historyRes] = await Promise.all([
        this.api.getClient(clientId),
        this.api.getHistory(clientId),
      ]);
      this.client.set(clientRes);
      this.events.set(historyRes.items);
      this.nextCursor.set(historyRes.nextCursor);
    } catch {
      this.error.set('Erro ao carregar histórico.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    const clientId = this.client()?.id;
    if (!cursor || !clientId) return;

    this.isLoadingMore.set(true);
    try {
      const res = await this.api.getHistory(clientId, cursor);
      this.events.update(existing => [...existing, ...res.items]);
      this.nextCursor.set(res.nextCursor);
    } catch {
      this.error.set('Erro ao carregar mais eventos.');
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  eventLabel(type: ClientHistoryEventType): string {
    return EVENT_LABELS[type] ?? type;
  }

  formatDate(utc: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(utc));
  }
}
