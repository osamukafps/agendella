import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { ServicesApiService } from './services-api.service';
import type { ServiceResponse, CreateServiceRequest } from '../../core/api/api.models';

const EMPTY_FORM: CreateServiceRequest = {
  name: '', description: '', durationMinutes: 60, priceAmount: 0, currency: 'BRL',
};

@Component({
  selector: 'app-services-page',
  standalone: true,
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.css',
})
export class ServicesPageComponent implements OnInit {
  private readonly api  = inject(ServicesApiService);
  readonly auth         = inject(AuthService);

  readonly items        = signal<ServiceResponse[]>([]);
  readonly isLoading    = signal(false);
  readonly isSaving     = signal(false);
  readonly error        = signal<string | null>(null);
  readonly formMode     = signal<'create' | 'edit' | null>(null);
  readonly editingId    = signal<string | null>(null);
  readonly form         = signal<CreateServiceRequest>({ ...EMPTY_FORM });

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.list();
      this.items.set(res.items);
    } catch {
      this.error.set('Erro ao carregar serviços.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formMode.set('create');
  }

  openEdit(item: ServiceResponse): void {
    this.form.set({
      name: item.name, description: item.description,
      durationMinutes: item.durationMinutes,
      priceAmount: item.priceAmount, currency: item.currency,
    });
    this.editingId.set(item.id);
    this.formMode.set('edit');
  }

  closeForm(): void { this.formMode.set(null); this.error.set(null); }

  setField(key: keyof CreateServiceRequest, value: string | number): void {
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
      this.error.set('Erro ao salvar serviço.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivate(item: ServiceResponse): Promise<void> {
    if (!confirm(`Desativar "${item.name}"?`)) return;
    try {
      await this.api.deactivate(item.id);
      this.items.update(items =>
        items.map(i => i.id === item.id ? { ...i, status: 'Inactive' as const } : i)
      );
    } catch {
      this.error.set('Erro ao desativar serviço.');
    }
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  }
}
