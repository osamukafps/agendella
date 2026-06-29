import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-me-page',
  standalone: true,
  templateUrl: './me-page.component.html',
  styleUrl: './me-page.component.css',
})
export class MePageComponent {
  private readonly auth = inject(AuthService);
  readonly name      = computed(() => this.auth.currentUser()?.displayName ?? '—');
  readonly role      = computed(() => this.auth.currentUser()?.role ?? '—');
  readonly salonName = computed(() => this.auth.currentUser()?.salonName ?? '—');
}
