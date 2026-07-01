import { Component, OnInit, inject, signal } from '@angular/core';
import { SalonBlocksApiService } from './salon-blocks-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
} from '../../core/api/cursor-pagination';
import type { SalonBlockResponse, CreateSalonBlockRequest } from '../../core/api/api.models';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { ModalSheetComponent } from '../../shared/modal-sheet.component';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { TimePickerComponent } from '../../shared/time-picker.component';
import { localDateTimeToUtc } from '../../core/utils/date-time';
import { AppIconComponent } from '../../shared/app-icon.component';

const EMPTY_FORM: CreateSalonBlockRequest = {
  startAtUtc: '', endAtUtc: '', reason: '',
};

@Component({
  selector: 'app-salon-blocks-page',
  standalone: true,
  imports: [ModalSheetComponent, DatePickerComponent, TimePickerComponent, AppIconComponent],
  templateUrl: './salon-blocks-page.component.html',
  styleUrl: './salon-blocks-page.component.css',
})
export class SalonBlocksPageComponent implements OnInit {
  private readonly api = inject(SalonBlocksApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly pagination = createCursorPaginationState<SalonBlockResponse>();

  readonly items      = this.pagination.items;
  readonly nextCursor = this.pagination.nextCursor;
  readonly isLoading  = this.pagination.isLoading;
  readonly isLoadingMore = this.pagination.isLoadingMore;
  readonly initialError = this.pagination.initialError;
  readonly loadMoreError = this.pagination.loadMoreError;
  readonly isSaving   = signal(false);
  readonly pageError  = signal<string | null>(null);
  readonly formError  = signal<string | null>(null);
  readonly showForm   = signal(false);
  readonly form       = signal<CreateSalonBlockRequest>({ ...EMPTY_FORM });
  readonly formStartDate = signal('');
  readonly formStartTime = signal('');
  readonly formEndDate = signal('');
  readonly formEndTime = signal('');
  readonly fieldErrors = signal<Record<string, string[]>>({});

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(reset = true): Promise<void> {
    try {
      await loadCursorPage({
        state: this.pagination,
        reset,
        loadPage: ({ cursor }) => this.api.list(cursor),
        fallbackMessage: 'Erro ao carregar bloqueios.',
      });
    } catch {
      // Estado refletido no helper compartilhado.
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.formStartDate.set('');
    this.formStartTime.set('');
    this.formEndDate.set('');
    this.formEndTime.set('');
    this.showForm.set(true);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  setField(key: keyof CreateSalonBlockRequest, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[key];
      return next;
    });
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.formError.set(null);
    this.fieldErrors.set({});

    const startAtUtc = localDateTimeToUtc(this.formStartDate(), this.formStartTime());
    const endAtUtc = localDateTimeToUtc(this.formEndDate(), this.formEndTime());

    if (!startAtUtc || !endAtUtc) {
      this.fieldErrors.set({
        ...(startAtUtc ? {} : { startAtUtc: ['Selecione data e hora válidas para o início.'] }),
        ...(endAtUtc ? {} : { endAtUtc: ['Selecione data e hora válidas para o fim.'] }),
      });
      return;
    }

    if (new Date(endAtUtc) <= new Date(startAtUtc)) {
      this.fieldErrors.set({
        endAtUtc: ['O fim precisa acontecer depois do início.'],
      });
      return;
    }

    this.isSaving.set(true);
    try {
      const created = await this.api.create({
        ...this.form(),
        startAtUtc,
        endAtUtc,
      });
      this.items.update(items => [created, ...items]);
      this.closeForm();
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao criar bloqueio.');
      this.fieldErrors.set(uiError.fieldErrors);
      this.formError.set(uiError.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  async delete(block: SalonBlockResponse): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Remover este bloqueio do salão?',
      message: 'A remoção libera novamente o intervalo para operação normal do salão.',
      confirmLabel: 'Remover bloqueio',
      cancelLabel: 'Manter bloqueio',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      await this.api.delete(block.id);
      this.items.update(items => items.filter(b => b.id !== block.id));
      this.pageError.set(null);
    } catch (error) {
      this.pageError.set(mapApiErrorToUi(error, 'Erro ao remover bloqueio.').message);
    }
  }

  formatDateTime(utc: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(utc));
  }

  async loadMore(): Promise<void> {
    await this.load(false);
  }

  fieldError(field: keyof CreateSalonBlockRequest): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }

  clearFieldError(field: keyof CreateSalonBlockRequest): void {
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[field];
      return next;
    });
  }
}
