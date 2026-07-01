import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ServicesApiService } from './services-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
  mergeCursorItemsById,
} from '../../core/api/cursor-pagination';
import type { ServiceResponse, CreateServiceRequest } from '../../core/api/api.models';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { ModalSheetComponent } from '../../shared/modal-sheet.component';

const EMPTY_FORM: CreateServiceRequest = {
  name: '', description: '', durationMinutes: 60, priceAmount: 0, currency: 'BRL',
};
const SERVICES_PAGE_SIZE = 20;

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [ModalSheetComponent],
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.css',
})
export class ServicesPageComponent implements OnInit {
  private readonly api  = inject(ServicesApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly auth         = inject(AuthService);
  private readonly pagination = createCursorPaginationState<ServiceResponse>();

  readonly items        = this.pagination.items;
  readonly nextCursor   = this.pagination.nextCursor;
  readonly isLoading    = this.pagination.isLoading;
  readonly isLoadingMore = this.pagination.isLoadingMore;
  readonly initialError = this.pagination.initialError;
  readonly loadMoreError = this.pagination.loadMoreError;
  readonly isSaving     = signal(false);
  readonly pageError    = signal<string | null>(null);
  readonly formError    = signal<string | null>(null);
  readonly formMode     = signal<'create' | 'edit' | null>(null);
  readonly editingId    = signal<string | null>(null);
  readonly form         = signal<CreateServiceRequest>({ ...EMPTY_FORM });
  readonly fieldErrors  = signal<Record<string, string[]>>({});

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(reset = true): Promise<void> {
    try {
      await loadCursorPage({
        state: this.pagination,
        reset,
        pageSize: SERVICES_PAGE_SIZE,
        loadPage: ({ cursor, pageSize }) => this.api.list(cursor, pageSize),
        mergeItems: mergeCursorItemsById,
        fallbackMessage: 'Erro ao carregar serviços.',
      });
    } catch {
      // Estado refletido no helper compartilhado.
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formMode.set('create');
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  openEdit(item: ServiceResponse): void {
    this.form.set({
      name: item.name, description: item.description,
      durationMinutes: item.durationMinutes,
      priceAmount: item.priceAmount, currency: item.currency,
    });
    this.editingId.set(item.id);
    this.formMode.set('edit');
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  closeForm(): void {
    this.formMode.set(null);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  setField(key: keyof CreateServiceRequest, value: string | number): void {
    const nextValue = key === 'currency' && typeof value === 'string'
      ? value.toUpperCase()
      : value;
    this.form.update(f => ({ ...f, [key]: nextValue }));
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[key];
      return next;
    });
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.isSaving.set(true);
    this.fieldErrors.set({});
    try {
      if (this.formMode() === 'edit' && this.editingId()) {
        const updated = await this.api.update(this.editingId()!, this.form());
        this.items.update(items => items.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await this.api.create(this.form());
        this.items.update(items => [created, ...items]);
      }
      this.closeForm();
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao salvar serviço.');
      this.fieldErrors.set(uiError.fieldErrors);
      this.formError.set(uiError.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivate(item: ServiceResponse): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: `Desativar "${item.name}"?`,
      message: 'O serviço deixa de aparecer como ativo para novos agendamentos, mas registros existentes continuam preservados.',
      confirmLabel: 'Desativar serviço',
      cancelLabel: 'Manter ativo',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await this.api.deactivate(item.id);
      this.items.update(items =>
        items.map(i => i.id === item.id ? { ...i, status: 'Inactive' as const } : i)
      );
      this.pageError.set(null);
    } catch (error) {
      this.pageError.set(mapApiErrorToUi(error, 'Erro ao desativar serviço.').message);
    }
  }

  async loadMore(): Promise<void> {
    await this.load(false);
  }

  fieldError(field: keyof CreateServiceRequest): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }

  formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount);
  }
}
