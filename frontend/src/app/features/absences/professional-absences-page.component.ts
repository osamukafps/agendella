import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfessionalAbsencesApiService } from './professional-absences-api.service';
import type { ProfessionalAbsenceResponse, CreateProfessionalAbsenceRequest } from '../../core/api/api.models';

@Component({
  selector: 'app-professional-absences-page',
  standalone: true,
  templateUrl: './professional-absences-page.component.html',
  styleUrl: './professional-absences-page.component.css',
})
export class ProfessionalAbsencesPageComponent implements OnInit {
  private readonly api  = inject(ProfessionalAbsencesApiService);
  readonly auth         = inject(AuthService);

  readonly professionalId = computed(() => this.auth.currentUser()?.professionalId ?? null);

  readonly items       = signal<ProfessionalAbsenceResponse[]>([]);
  readonly nextCursor  = signal<string | null>(null);
  readonly isLoading   = signal(false);
  readonly isSaving    = signal(false);
  readonly error       = signal<string | null>(null);
  readonly showForm    = signal(false);

  readonly formStartLocal = signal('');
  readonly formEndLocal   = signal('');
  readonly formReason     = signal('');

  async ngOnInit(): Promise<void> {
    const profId = this.professionalId();
    if (!profId) {
      this.error.set('Profissional não identificada.');
      return;
    }
    await this.load(profId);
  }

  private async load(professionalId: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.list(professionalId);
      this.items.set(res.items);
      this.nextCursor.set(res.nextCursor);
    } catch {
      this.error.set('Erro ao carregar ausências.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.formStartLocal.set('');
    this.formEndLocal.set('');
    this.formReason.set('');
    this.showForm.set(true);
    this.error.set(null);
  }

  closeForm(): void { this.showForm.set(false); this.error.set(null); }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    const profId = this.professionalId();
    if (!profId) return;

    this.isSaving.set(true);
    this.error.set(null);
    try {
      const req: CreateProfessionalAbsenceRequest = {
        professionalId: profId,
        startAtUtc: new Date(this.formStartLocal()).toISOString(),
        endAtUtc:   new Date(this.formEndLocal()).toISOString(),
        reason:     this.formReason(),
      };
      const created = await this.api.create(req);
      this.items.update(items => [created, ...items]);
      this.closeForm();
    } catch {
      this.error.set('Erro ao criar ausência.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async cancel(absence: ProfessionalAbsenceResponse): Promise<void> {
    if (!confirm('Cancelar esta ausência?')) return;
    const profId = this.professionalId();
    if (!profId) return;
    try {
      await this.api.cancel(profId, absence.id);
      this.items.update(items =>
        items.map(a => a.id === absence.id ? { ...a, status: 'Inactive' as const } : a)
      );
    } catch {
      this.error.set('Erro ao cancelar ausência.');
    }
  }

  formatDateTime(utc: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(utc));
  }
}
