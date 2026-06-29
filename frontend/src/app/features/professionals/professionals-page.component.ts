import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ProfessionalsApiService } from './professionals-api.service';
import { WeeklyAvailabilityEditorComponent } from './weekly-availability-editor.component';
import type { ProfessionalResponse, CreateProfessionalRequest } from '../../core/api/api.models';

const EMPTY_FORM: CreateProfessionalRequest = { name: '', phone: '', email: '' };

@Component({
  selector: 'app-professionals-page',
  standalone: true,
  imports: [WeeklyAvailabilityEditorComponent],
  templateUrl: './professionals-page.component.html',
  styleUrl: './professionals-page.component.css',
})
export class ProfessionalsPageComponent implements OnInit {
  private readonly api  = inject(ProfessionalsApiService);
  readonly auth         = inject(AuthService);

  readonly items        = signal<ProfessionalResponse[]>([]);
  readonly isLoading    = signal(false);
  readonly isSaving     = signal(false);
  readonly error        = signal<string | null>(null);
  readonly formMode     = signal<'create' | 'edit' | null>(null);
  readonly editingId    = signal<string | null>(null);
  readonly form         = signal<CreateProfessionalRequest>({ ...EMPTY_FORM });
  readonly expandedId   = signal<string | null>(null);

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.list();
      this.items.set(res.items);
    } catch {
      this.error.set('Erro ao carregar profissionais.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formMode.set('create');
    this.expandedId.set(null);
  }

  openEdit(item: ProfessionalResponse): void {
    this.form.set({ name: item.name, phone: item.phone, email: item.email });
    this.editingId.set(item.id);
    this.formMode.set('edit');
    this.expandedId.set(null);
  }

  closeForm(): void { this.formMode.set(null); this.error.set(null); }

  toggleAvailability(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
    this.formMode.set(null);
  }

  setField<K extends keyof CreateProfessionalRequest>(key: K, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    try {
      if (this.formMode() === 'edit' && this.editingId()) {
        const updated = await this.api.update(this.editingId()!, this.form());
        this.items.update(items => items.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await this.api.create(this.form());
        this.items.update(items => [created, ...items]);
      }
      this.closeForm();
    } catch {
      this.error.set('Erro ao salvar profissional.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivate(item: ProfessionalResponse): Promise<void> {
    if (!confirm(`Desativar ${item.name}?`)) return;
    try {
      await this.api.deactivate(item.id);
      this.items.update(items =>
        items.map(i => i.id === item.id ? { ...i, status: 'Inactive' as const } : i)
      );
    } catch {
      this.error.set('Erro ao desativar profissional.');
    }
  }
}
