import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfessionalAbsencesApiService } from './professional-absences-api.service';
import { ProfessionalsApiService } from '../professionals/professionals-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  createCursorPaginationState,
  loadCursorPage,
  mergeCursorItemsById,
} from '../../core/api/cursor-pagination';
import type {
  ProfessionalAbsenceResponse,
  CreateProfessionalAbsenceRequest,
  ProfessionalResponse,
} from '../../core/api/api.models';
import { ConfirmDialogService } from '../../shared/confirm-dialog.service';
import { ModalSheetComponent } from '../../shared/modal-sheet.component';
import { DatePickerComponent } from '../../shared/date-picker.component';
import { TimePickerComponent } from '../../shared/time-picker.component';
import { localDateTimeToUtc } from '../../core/utils/date-time';
import { AppIconComponent } from '../../shared/app-icon.component';

const PROFESSIONALS_PAGE_SIZE = 20;

@Component({
  selector: 'app-professional-absences-page',
  standalone: true,
  imports: [ModalSheetComponent, DatePickerComponent, TimePickerComponent, AppIconComponent],
  templateUrl: './professional-absences-page.component.html',
  styleUrl: './professional-absences-page.component.css',
})
export class ProfessionalAbsencesPageComponent implements OnInit {
  private readonly api  = inject(ProfessionalAbsencesApiService);
  private readonly professionalsApi = inject(ProfessionalsApiService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly auth         = inject(AuthService);

  readonly role = this.auth.role;
  readonly ownProfessionalId = computed(() => this.auth.currentUser()?.professionalId ?? null);
  private readonly professionalsPagination = createCursorPaginationState<ProfessionalResponse>();
  private readonly absencesPagination = createCursorPaginationState<ProfessionalAbsenceResponse>();

  readonly professionals = this.professionalsPagination.items;
  readonly professionalsNextCursor = this.professionalsPagination.nextCursor;
  readonly isLoadingProfessionals = this.professionalsPagination.isLoading;
  readonly professionalsError = this.professionalsPagination.initialError;
  readonly isLoadingMoreProfessionals = this.professionalsPagination.isLoadingMore;
  readonly items       = this.absencesPagination.items;
  readonly nextCursor  = this.absencesPagination.nextCursor;
  readonly isLoading   = this.absencesPagination.isLoading;
  readonly isLoadingMore = this.absencesPagination.isLoadingMore;
  readonly initialError = this.absencesPagination.initialError;
  readonly loadMoreError = this.absencesPagination.loadMoreError;
  readonly isSaving    = signal(false);
  readonly pageError   = signal<string | null>(null);
  readonly formError   = signal<string | null>(null);
  readonly showForm    = signal(false);
  readonly selectedProfessionalId = signal('');
  readonly fieldErrors = signal<Record<string, string[]>>({});

  readonly formStartDate = signal('');
  readonly formStartTime = signal('');
  readonly formEndDate   = signal('');
  readonly formEndTime   = signal('');
  readonly formReason     = signal('');
  readonly activeProfessionalId = computed(() =>
    this.role() === 'administradora'
      ? this.selectedProfessionalId()
      : (this.ownProfessionalId() ?? '')
  );
  readonly activeProfessional = computed(() =>
    this.professionals().find(professional => professional.id === this.selectedProfessionalId()) ?? null
  );
  readonly isAdmin = computed(() => this.role() === 'administradora');

  async ngOnInit(): Promise<void> {
    if (this.isAdmin()) {
      await this.loadProfessionals();
      if (this.professionals().length > 0 && !this.selectedProfessionalId()) {
        await this.selectProfessional(this.professionals()[0]!.id);
      }
      return;
    }

    const profId = this.ownProfessionalId();
    if (!profId) {
      this.pageError.set('Profissional não identificada.');
      return;
    }
    await this.load();
  }

  async load(reset = true): Promise<void> {
    const professionalId = this.activeProfessionalId();
    if (!professionalId) {
      return;
    }

    try {
      await loadCursorPage({
        state: this.absencesPagination,
        reset,
        loadPage: ({ cursor }) => this.api.list(professionalId, cursor),
        fallbackMessage: 'Erro ao carregar ausências.',
      });
    } catch {
      // Estado refletido pelo helper compartilhado.
    }
  }

  openCreate(): void {
    this.formStartDate.set('');
    this.formStartTime.set('');
    this.formEndDate.set('');
    this.formEndTime.set('');
    this.formReason.set('');
    this.showForm.set(true);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  closeForm(): void {
    this.showForm.set(false);
    this.formError.set(null);
    this.fieldErrors.set({});
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    const profId = this.activeProfessionalId();
    if (!profId) return;

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
      const req: CreateProfessionalAbsenceRequest = {
        professionalId: profId,
        startAtUtc,
        endAtUtc,
        reason:     this.formReason(),
      };
      const created = await this.api.create(req);
      this.items.update(items => [created, ...items]);
      this.closeForm();
    } catch (error) {
      const uiError = mapApiErrorToUi(error, 'Erro ao criar ausência.');
      this.fieldErrors.set(uiError.fieldErrors);
      this.formError.set(uiError.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  async cancel(absence: ProfessionalAbsenceResponse): Promise<void> {
    const confirmed = await this.confirmDialog.open({
      title: 'Cancelar esta ausência?',
      message: 'A ausência deixa de ficar ativa para este período, mas o registro permanece no histórico.',
      confirmLabel: 'Cancelar ausência',
      cancelLabel: 'Manter ausência',
      tone: 'danger',
    });
    if (!confirmed) return;

    const profId = this.activeProfessionalId();
    if (!profId) return;
    try {
      await this.api.cancel(profId, absence.id);
      this.items.update(items =>
        items.map(a => a.id === absence.id ? { ...a, status: 'Inactive' as const } : a)
      );
      this.pageError.set(null);
    } catch (error) {
      this.pageError.set(mapApiErrorToUi(error, 'Erro ao cancelar ausência.').message);
    }
  }

  formatDateTime(utc: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(utc));
  }

  async selectProfessional(professionalId: string): Promise<void> {
    this.selectedProfessionalId.set(professionalId);
    this.absencesPagination.items.set([]);
    this.absencesPagination.nextCursor.set(null);
    this.absencesPagination.initialError.set(null);
    this.absencesPagination.loadMoreError.set(null);
    this.pageError.set(null);
    await this.load();
  }

  async loadMore(): Promise<void> {
    await this.load(false);
  }

  async loadProfessionals(reset = true): Promise<void> {
    try {
      await loadCursorPage({
        state: this.professionalsPagination,
        reset,
        pageSize: PROFESSIONALS_PAGE_SIZE,
        loadPage: ({ cursor, pageSize }) => this.professionalsApi.list(cursor, pageSize),
        mergeItems: mergeCursorItemsById,
        selectItems: items => items.filter(item => item.status === 'Active'),
        fallbackMessage: 'Erro ao carregar profissionais.',
      });
    } catch {
      // Estado refletido no helper compartilhado.
    }
  }

  async loadMoreProfessionals(): Promise<void> {
    await this.loadProfessionals(false);
  }

  fieldError(field: 'professionalId' | 'startAtUtc' | 'endAtUtc' | 'reason'): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }

  clearFieldError(field: 'professionalId' | 'startAtUtc' | 'endAtUtc' | 'reason'): void {
    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[field];
      return next;
    });
  }
}
