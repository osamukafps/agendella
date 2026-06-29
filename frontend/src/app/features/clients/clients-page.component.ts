import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ClientsApiService, ClientPhoneDuplicateError } from './clients-api.service';
import { applyPhoneMask, digitsOnly, formatStoredPhone } from '../../core/utils/phone';
import type { ClientResponse, CreateClientRequest } from '../../core/api/api.models';

const EMPTY_FORM: CreateClientRequest = { name: '', phone: '', email: '', notes: '' };

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.css',
})
export class ClientsPageComponent implements OnInit {
  private readonly api  = inject(ClientsApiService);
  readonly auth         = inject(AuthService);

  readonly items        = signal<ClientResponse[]>([]);
  readonly isLoading    = signal(false);
  readonly isSaving     = signal(false);
  readonly error        = signal<string | null>(null);
  readonly formMode     = signal<'create' | 'edit' | null>(null);
  readonly editingId    = signal<string | null>(null);
  readonly form         = signal<CreateClientRequest>({ ...EMPTY_FORM });
  readonly phoneError   = signal<string | null>(null);
  readonly formatStoredPhone = formatStoredPhone;

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.list();
      this.items.set(res.items);
    } catch {
      this.error.set('Erro ao carregar clientes.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.editingId.set(null);
    this.formMode.set('create');
    this.phoneError.set(null);
  }

  openEdit(item: ClientResponse): void {
    this.form.set({ name: item.name, phone: formatStoredPhone(item.phone), email: item.email, notes: item.notes });
    this.editingId.set(item.id);
    this.formMode.set('edit');
    this.phoneError.set(null);
  }

  closeForm(): void { this.formMode.set(null); this.error.set(null); this.phoneError.set(null); }

  setField<K extends keyof CreateClientRequest>(key: K, value: string): void {
    const processed = key === 'phone' ? applyPhoneMask(value) : value;
    this.form.update(f => ({ ...f, [key]: processed }));
    if (key === 'phone') this.phoneError.set(null);
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    this.phoneError.set(null);
    try {
      const payload = { ...this.form(), phone: digitsOnly(this.form().phone) };
      if (this.formMode() === 'edit' && this.editingId()) {
        const updated = await this.api.update(this.editingId()!, payload);
        this.items.update(items => items.map(i => i.id === updated.id ? updated : i));
      } else {
        const created = await this.api.create(payload);
        this.items.update(items => [created, ...items]);
      }
      this.closeForm();
    } catch (err) {
      if (err instanceof ClientPhoneDuplicateError) {
        this.phoneError.set(err.message);
      } else {
        this.error.set('Erro ao salvar cliente.');
      }
    } finally {
      this.isSaving.set(false);
    }
  }

  async deactivate(item: ClientResponse): Promise<void> {
    if (!confirm(`Desativar ${item.name}?`)) return;
    try {
      await this.api.deactivate(item.id);
      this.items.update(items =>
        items.map(i => i.id === item.id ? { ...i, status: 'Inactive' as const } : i)
      );
    } catch {
      this.error.set('Erro ao desativar cliente.');
    }
  }
}
