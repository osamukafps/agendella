import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { ClientsApiService, ClientPhoneDuplicateError } from './clients-api.service';
import type { ClientResponse, CreateClientRequest } from '../../core/api/api.models';

@Component({
  selector: 'app-client-quick-form',
  standalone: true,
  template: `
    <form class="form-card" (submit)="save($event)" novalidate aria-label="Formulário rápido de cliente">
      <h3 class="form-title">{{ editingId() ? 'Editar cliente' : 'Novo cliente' }}</h3>

      @if (error()) { <div class="state-error" role="alert">{{ error() }}</div> }

      <div class="field">
        <label class="field-label" for="qf-name">Nome</label>
        <input id="qf-name" class="field-input" type="text" required
          [value]="form().name" (input)="set('name', $any($event.target).value)">
      </div>
      <div class="field">
        <label class="field-label" for="qf-phone">Telefone</label>
        <input id="qf-phone" class="field-input" type="tel" required
          [value]="form().phone" (input)="set('phone', $any($event.target).value)"
          [attr.aria-invalid]="phoneError() ? 'true' : null">
        @if (phoneError()) {
          <span class="field-error" role="alert">{{ phoneError() }}</span>
        }
      </div>
      <div class="field">
        <label class="field-label" for="qf-notes">Observações</label>
        <input id="qf-notes" class="field-input" type="text"
          [value]="form().notes" (input)="set('notes', $any($event.target).value)">
      </div>
      <div class="form-actions">
        <button type="button" class="btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn-primary" [disabled]="isSaving()">
          {{ isSaving() ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './clients-page.component.css',
})
export class ClientQuickFormComponent {
  @Output() saved    = new EventEmitter<ClientResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api = inject(ClientsApiService);

  readonly editingId  = signal<string | null>(null);
  readonly form       = signal<CreateClientRequest>({ name: '', phone: '', email: '', notes: '' });
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  readonly phoneError = signal<string | null>(null);

  setClient(client: ClientResponse): void {
    this.editingId.set(client.id);
    this.form.set({ name: client.name, phone: client.phone, email: client.email, notes: client.notes });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.set({ name: '', phone: '', email: '', notes: '' });
    this.error.set(null);
    this.phoneError.set(null);
  }

  set<K extends keyof CreateClientRequest>(key: K, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
    if (key === 'phone') this.phoneError.set(null);
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    this.phoneError.set(null);
    try {
      const result = this.editingId()
        ? await this.api.update(this.editingId()!, this.form())
        : await this.api.create(this.form());
      this.saved.emit(result);
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
}
