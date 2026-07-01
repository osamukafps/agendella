import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { getApiErrorMessage } from '../../core/api/api-error.utils';
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
  readonly showPassword = signal(false);

  updateEmail(value: string): void {
    this.email.set(value);
    if (this.error()) {
      this.error.set(null);
    }
  }

  updatePassword(value: string): void {
    this.password.set(value);
    if (this.error()) {
      this.error.set(null);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isLoading()) {
      return;
    }

    if (!this.email() || !this.password()) {
      this.error.set('Preencha o email e a senha.');
      return;
    }

    this.error.set(null);
    this.isLoading.set(true);

    try {
      await this.authService.login(this.email(), this.password());
      await this.router.navigateByUrl('/agenda');
    } catch (error) {
      this.error.set(getApiErrorMessage(error, 'Email ou senha incorretos. Tente novamente.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
