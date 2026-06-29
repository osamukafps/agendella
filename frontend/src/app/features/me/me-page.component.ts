import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-me-page',
  standalone: true,
  template: `
    <div class="page-layout">
      <header class="page-header">
        <h2 class="page-title">Meu perfil</h2>
      </header>
      <section class="form-section">
        <div class="field">
          <span class="field-label">Nome</span>
          <p class="me-value">{{ name() }}</p>
        </div>
        <div class="field">
          <span class="field-label">Papel</span>
          <p class="me-value me-role">{{ role() }}</p>
        </div>
        <div class="field">
          <span class="field-label">Salão</span>
          <p class="me-value">{{ salonName() }}</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    @import '../../../styles/page.css';
    .me-value { margin: 0; font-size: var(--text-base); color: var(--color-text-primary); }
    .me-role  { text-transform: capitalize; color: var(--color-text-secondary); }
  `],
})
export class MePageComponent {
  private readonly auth = inject(AuthService);
  readonly name      = computed(() => this.auth.currentUser()?.displayName ?? '—');
  readonly role      = computed(() => this.auth.currentUser()?.role ?? '—');
  readonly salonName = computed(() => this.auth.currentUser()?.salonName ?? '—');
}
