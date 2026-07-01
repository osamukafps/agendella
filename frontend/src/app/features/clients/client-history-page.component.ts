import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientHistoryApiService } from './client-history-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
} from '../../core/api/cursor-pagination';
import type { ClientHistoryEventResponse, ClientResponse } from '../../core/api/api.models';
import { AppIconComponent } from '../../shared/app-icon.component';
import { buildClientHistoryTimelineGroups } from './client-history-page.helpers';

@Component({
  selector: 'app-client-history-page',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './client-history-page.component.html',
  styleUrl: './client-history-page.component.css',
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
  readonly timelineGroups = computed(() => buildClientHistoryTimelineGroups(this.events()));
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
}
