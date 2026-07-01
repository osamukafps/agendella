import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientHistoryApiService } from './client-history-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
} from '../../core/api/cursor-pagination';
import type { ClientHistoryEventResponse, ClientHistoryEventType, ClientResponse } from '../../core/api/api.models';
import { AppIconComponent } from '../../shared/app-icon.component';

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
  imports: [RouterLink, AppIconComponent],
  templateUrl: './client-history-page.component.html',
  styleUrl: './clients-page.component.css',
})
export class ClientHistoryPageComponent implements OnInit {
  private readonly api   = inject(ClientHistoryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly pagination = createCursorPaginationState<ClientHistoryEventResponse>();

  readonly client       = signal<ClientResponse | null>(null);
  readonly events       = this.pagination.items;
  readonly nextCursor   = this.pagination.nextCursor;
  readonly isLoading    = this.pagination.isLoading;
  readonly isLoadingMore = this.pagination.isLoadingMore;
  readonly initialError = this.pagination.initialError;
  readonly loadMoreError = this.pagination.loadMoreError;
  readonly error        = signal<string | null>(null);
  private clientId = '';

  async ngOnInit(): Promise<void> {
    this.clientId = this.route.snapshot.paramMap.get('clientId') ?? '';
    await this.load();
  }

  async load(reset = true): Promise<void> {
    this.error.set(null);
    try {
      if (reset) {
        const clientRes = await this.api.getClient(this.clientId);
        this.client.set(clientRes);
      }

      await loadCursorPage({
        state: this.pagination,
        reset,
        loadPage: ({ cursor, pageSize }) => this.api.getHistory(this.clientId, cursor, pageSize),
        fallbackMessage: 'Erro ao carregar histórico.',
      });
    } catch (error) {
      if (reset && !this.events().length) {
        this.error.set(mapApiErrorToUi(error, 'Erro ao carregar histórico.').message);
      }
    }
  }

  async loadMore(): Promise<void> {
    await this.load(false);
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
