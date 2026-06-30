import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfessionalsApiService } from './professionals-api.service';
import { WeeklyAvailabilityEditorComponent } from './weekly-availability-editor.component';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
  mergeCursorItemsById,
} from '../../core/api/cursor-pagination';
import { applyPhoneMask, digitsOnly, formatStoredPhone } from '../../core/utils/phone';
import type { ProfessionalResponse, CreateProfessionalRequest } from '../../core/api/api.models';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';

const EMPTY_FORM: CreateProfessionalRequest = { name: '', phone: '', email: '' };
const PROFESSIONALS_PAGE_SIZE = 20;

@Component({
  selector: 'app-professionals-page',
  standalone: true,
  imports: [WeeklyAvailabilityEditorComponent],
  templateUrl: './professionals-page.component.html',
  styleUrl: './professionals-page.component.css',
})
export class ProfessionalsPageComponent implements OnInit {
  private readonly api  = inject(ProfessionalsApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly auth         = inject(AuthService);
  private readonly pagination = createCursorPaginationState<ProfessionalResponse>();

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
  readonly form         = signal<CreateProfessionalRequest>({ ...EMPTY_FORM });
  readonly expandedId   = signal<string | null>(null);
  readonly fieldErrors  = signal<Record<string, string[]>>({});
  readonly formatStoredPhone = formatStoredPhone;

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(reset = true): Promise<void> {
    try {
      await loadCursorPage({
        state: this.pagination,
        reset,
        pageSize: PROFESSIONALS_PAGE_SIZE,
        loadPage: ({ cursor, pageSize }) => this.api.list(cursor, pageSize),
        mergeItems: mergeCursorItemsById,
        fallbackMessage: 'Erro ao carregar profissionais.',
      });
    } catch {
      // Estado já refletido no helper compartilhado.
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formMode.set('create');
    this.expandedId.set(null);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  openEdit(item: ProfessionalResponse): void {
    this.form.set({ name: item.name, phone: formatStoredPhone(item.phone), email: item.email });
    this.editingId.set(item.id);
    this.formMode.set('edit');
    this.expandedId.set(null);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  closeForm(): void {
    this.formMode.set(null);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  toggleAvailability(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
    this.formMode.set(null);
  }

  setField<K extends keyof CreateProfessionalRequest>(key: K, value: string): void {
    const nextValue = key === 'phone' ? applyPhoneMask(value) : value;
    this.form.update(f => ({ ...f, [key]: nextValue }));
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[key];
      return next;
    });
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.formError.set(null);
    this.fieldErrors.set({});
    try {
      const payload = {
        ...this.form(),
        phone: digitsOnly(this.form().phone),
      };
      if (this.formMode() === 'edit' && this.editingId()) {
        const updated = await this.api.update(this.editingId()!, payload);
        this.items.update(items => items.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await this.api.create(payload);
        this.items.update(items => [created, ...items]);
      }
      this.closeForm();
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao salvar profissional.');
      this.fieldErrors.set(uiError.fieldErrors);
      this.formError.set(uiError.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivate(item: ProfessionalResponse): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: `Desativar ${item.name}?`,
      message: 'A profissional deixa de aparecer como ativa para novos vínculos operacionais, mas registros existentes continuam preservados.',
      confirmLabel: 'Desativar profissional',
      cancelLabel: 'Manter ativa',
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
      this.pageError.set(mapApiErrorToUi(error, 'Erro ao desativar profissional.').message);
    }
  }

  async loadMore(): Promise<void> {
    await this.load(false);
  }

  fieldError(field: keyof CreateProfessionalRequest): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }
}
