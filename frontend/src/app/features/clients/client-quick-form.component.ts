import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { ClientsApiService, ClientPhoneDuplicateError } from './clients-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import { applyPhoneMask, digitsOnly } from '../../core/utils/phone';
import type { ClientResponse, CreateClientRequest } from '../../core/api/api.models';

@Component({
  selector: 'app-client-quick-form',
  standalone: true,
  template: `
    <form class="form-card client-quick-form" (submit)="save($event)" novalidate aria-label="Formulário rápido de cliente">
      <div class="client-quick-form__header">
        <h3 class="form-title">{{ editingId() ? 'Editar cliente' : 'Nova cliente' }}</h3>
        <p>Cadastre rapidamente e volte para o agendamento sem perder o que já foi preenchido.</p>
      </div>

      @if (error()) {
        <div class="state-error" role="alert">{{ error() }}</div>
      }

      <div class="field">
        <label class="field-label" for="qf-name">Nome</label>
        <input
          id="qf-name"
          class="field-input"
          type="text"
          required
          [value]="form().name"
          (input)="set('name', $any($event.target).value)"
          [attr.aria-invalid]="fieldError('name') ? 'true' : null"
        >
        @if (fieldError('name')) {
          <span class="field-error" role="alert">{{ fieldError('name') }}</span>
        }
      </div>

      <div class="field">
        <label class="field-label" for="qf-phone">Telefone</label>
        <input
          id="qf-phone"
          class="field-input"
          type="tel"
          required
          placeholder="(00) 00000-0000"
          [value]="form().phone"
          (input)="set('phone', $any($event.target).value)"
          [attr.aria-invalid]="phoneError() || fieldError('phone') ? 'true' : null"
        >
        @if (phoneError()) {
          <span class="field-error" role="alert">{{ phoneError() }}</span>
        } @else if (fieldError('phone')) {
          <span class="field-error" role="alert">{{ fieldError('phone') }}</span>
        }
      </div>

      <div class="field">
        <label class="field-label" for="qf-email">E-mail</label>
        <input
          id="qf-email"
          class="field-input"
          type="email"
          [value]="form().email"
          (input)="set('email', $any($event.target).value)"
          [attr.aria-invalid]="fieldError('email') ? 'true' : null"
        >
        @if (fieldError('email')) {
          <span class="field-error" role="alert">{{ fieldError('email') }}</span>
        }
      </div>

      <div class="field">
        <label class="field-label" for="qf-notes">Observações</label>
        <textarea
          id="qf-notes"
          class="field-input field-textarea"
          rows="3"
          [value]="form().notes"
          (input)="set('notes', $any($event.target).value)"
        ></textarea>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-ghost" (click)="cancelled.emit()">Cancelar</button>
        <button type="submit" class="btn-primary" [disabled]="isSaving()">
          {{ isSaving() ? 'Salvando…' : 'Salvar cliente' }}
        </button>
      </div>
    </form>
  `,
  styleUrl: './client-quick-form.component.css',
})
export class ClientQuickFormComponent {
  @Output() saved = new EventEmitter<ClientResponse>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly api = inject(ClientsApiService);

  readonly editingId = signal<string | null>(null);
  readonly form = signal<CreateClientRequest>({ name: '', phone: '', email: '', notes: '' });
  readonly isSaving = signal(false);
  readonly error = signal<string | null>(null);
  readonly phoneError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  setClient(client: ClientResponse): void {
    this.editingId.set(client.id);
    this.form.set({
      name: client.name,
      phone: applyPhoneMask(client.phone),
      email: client.email,
      notes: client.notes,
    });
  }

  reset(): void {
    this.editingId.set(null);
    this.form.set({ name: '', phone: '', email: '', notes: '' });
    this.error.set(null);
    this.phoneError.set(null);
    this.fieldErrors.set({});
  }

  set<K extends keyof CreateClientRequest>(key: K, value: string): void {
    const nextValue = key === 'phone' ? applyPhoneMask(value) : value;
    this.form.update(form => ({ ...form, [key]: nextValue }));

    if (key === 'phone') {
      this.phoneError.set(null);
    }

    this.fieldErrors.update(errors => {
      const next = { ...errors };
      delete next[key];
      return next;
    });
  }

  fieldError(field: string): string | null {
    return this.fieldErrors()[field]?.[0] ?? null;
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    this.phoneError.set(null);
    this.fieldErrors.set({});

    try {
      const payload: CreateClientRequest = {
        ...this.form(),
        phone: digitsOnly(this.form().phone),
      };

      const result = this.editingId()
        ? await this.api.update(this.editingId()!, payload)
        : await this.api.create(payload);

      this.saved.emit(result);
    } catch (error) {
      if (error instanceof ClientPhoneDuplicateError) {
        this.phoneError.set(error.message);
      } else {
        const uiError = mapApiErrorToUi(error, 'Não foi possível salvar a cliente.');
        this.fieldErrors.set(uiError.fieldErrors);
        this.error.set(uiError.message);
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
