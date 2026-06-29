import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { WeeklyAvailabilityEditorComponent } from './weekly-availability-editor.component';

@Component({
  selector: 'app-my-availability-page',
  standalone: true,
  imports: [WeeklyAvailabilityEditorComponent],
  template: `
    <div class="page-layout">
      <header class="page-header">
        <h2 class="page-title">Minha disponibilidade</h2>
      </header>
      @if (professionalId()) {
        <app-weekly-availability-editor [professionalId]="professionalId()!" />
      } @else {
        <p class="state-empty">Conta não vinculada a um profissional.</p>
      }
    </div>
  `,
  styleUrl: './professionals-page.component.css',
})
export class MyAvailabilityPageComponent {
  private readonly auth = inject(AuthService);
  readonly professionalId = computed(() => this.auth.currentUser()?.professionalId ?? null);
}
