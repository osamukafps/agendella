import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email     = signal('');
  readonly password  = signal('');
  readonly error     = signal<string | null>(null);
  readonly isLoading = signal(false);

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (!this.email() || !this.password()) {
      this.error.set('Preencha o email e a senha.');
      return;
    }

    this.error.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.login(this.email(), this.password());
      await this.router.navigateByUrl('/agenda');
    } catch {
      this.error.set('Email ou senha incorretos. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
