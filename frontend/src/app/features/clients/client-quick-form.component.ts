import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { ClientsApiService, ClientPhoneDuplicateError } from './clients-api.service';
import { mapApiErrorToUi } from '../../core/api/api-error.utils';
import {
  applyPhoneMask,
  digitsOnly,
  getPhoneValidationMessage,
  PHONE_MASK_MAX_LENGTH,
  shouldBlockPhoneBeforeInput,
  shouldBlockPhoneKey,
} from '../../core/utils/phone';
import { getEmailValidationMessage, normalizeEmail } from '../../core/utils/email';
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
          autocomplete="name"
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
          autocomplete="tel-national"
          inputmode="numeric"
          placeholder="(00) 00000-0000"
          [attr.maxlength]="phoneMaxLength"
          [value]="form().phone"
          (input)="set('phone', $any($event.target).value)"
          (keydown)="handlePhoneKeydown($event)"
          (beforeinput)="handlePhoneBeforeInput($event)"
          (blur)="validatePhoneField()"
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
          autocomplete="email"
          [value]="form().email"
          (input)="set('email', $any($event.target).value)"
          (blur)="normalizeEmailField()"
          [attr.aria-invalid]="emailError() || fieldError('email') ? 'true' : null"
        >
        @if (emailError()) {
          <span class="field-error" role="alert">{{ emailError() }}</span>
        } @else if (fieldError('email')) {
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
  readonly emailError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly phoneMaxLength = PHONE_MASK_MAX_LENGTH;

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
    this.emailError.set(null);
    this.fieldErrors.set({});
  }

  set<K extends keyof CreateClientRequest>(key: K, value: string): void {
    const nextValue = key === 'phone' ? applyPhoneMask(value) : value;
    this.form.update(form => ({ ...form, [key]: nextValue }));

    if (key === 'phone') {
      this.phoneError.set(null);
    }

    if (key === 'email') {
      this.emailError.set(null);
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

  validatePhoneField(): void {
    this.phoneError.set(getPhoneValidationMessage(this.form().phone));
  }

  handlePhoneKeydown(event: KeyboardEvent): void {
    if (shouldBlockPhoneKey(event)) {
      event.preventDefault();
    }
  }

  handlePhoneBeforeInput(event: InputEvent): void {
    if (shouldBlockPhoneBeforeInput(event)) {
      event.preventDefault();
    }
  }

  normalizeEmailField(): void {
    this.form.update(form => ({ ...form, email: normalizeEmail(form.email) }));
    this.emailError.set(getEmailValidationMessage(this.form().email));
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    this.validatePhoneField();
    this.normalizeEmailField();
    if (this.phoneError() || this.emailError()) {
      return;
    }
    this.isSaving.set(true);
    this.phoneError.set(null);
    this.emailError.set(null);
    this.fieldErrors.set({});

    try {
      const payload: CreateClientRequest = {
        ...this.form(),
        phone: digitsOnly(this.form().phone),
        email: normalizeEmail(this.form().email),
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
