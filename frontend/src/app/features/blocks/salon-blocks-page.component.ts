import { Component, OnInit, inject, signal } from '@angular/core';
import { SalonBlocksApiService } from './salon-blocks-api.service';
import type { SalonBlockResponse, CreateSalonBlockRequest } from '../../core/api/api.models';

const EMPTY_FORM: CreateSalonBlockRequest = {
  startAtUtc: '', endAtUtc: '', reason: '',
};

@Component({
  selector: 'app-salon-blocks-page',
  standalone: true,
  templateUrl: './salon-blocks-page.component.html',
  styleUrl: './salon-blocks-page.component.css',
})
export class SalonBlocksPageComponent implements OnInit {
  private readonly api = inject(SalonBlocksApiService);

  readonly items      = signal<SalonBlockResponse[]>([]);
  readonly nextCursor = signal<string | null>(null);
  readonly isLoading  = signal(false);
  readonly isSaving   = signal(false);
  readonly error      = signal<string | null>(null);
  readonly showForm   = signal(false);
  readonly form       = signal<CreateSalonBlockRequest>({ ...EMPTY_FORM });

  async ngOnInit(): Promise<void> { await this.load(); }

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.list();
      this.items.set(res.items);
      this.nextCursor.set(res.nextCursor);
    } catch {
      this.error.set('Erro ao carregar bloqueios.');
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreate(): void {
    this.form.set({ ...EMPTY_FORM });
    this.showForm.set(true);
    this.error.set(null);
  }

  closeForm(): void { this.showForm.set(false); this.error.set(null); }

  setField(key: keyof CreateSalonBlockRequest, value: string): void {
    this.form.update(f => ({ ...f, [key]: value }));
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    this.isSaving.set(true);
    this.error.set(null);
    try {
      const created = await this.api.create(this.form());
      this.items.update(items => [created, ...items]);
      this.closeForm();
    } catch {
      this.error.set('Erro ao criar bloqueio.');
    } finally {
      this.isSaving.set(false);
    }
  }

  async delete(block: SalonBlockResponse): Promise<void> {
    if (!confirm('Remover este bloqueio do salão?')) return;
    try {
      await this.api.delete(block.id);
      this.items.update(items => items.filter(b => b.id !== block.id));
    } catch {
      this.error.set('Erro ao remover bloqueio.');
    }
  }

  formatDateTime(utc: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(utc));
  }

  toLocalInputValue(utc: string): string {
    if (!utc) return '';
    const d = new Date(utc);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  toUtcFromInput(localValue: string): string {
    if (!localValue) return '';
    return new Date(localValue).toISOString();
  }
}
