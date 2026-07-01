import { describe, it, expect, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPageComponent } from './login-page.component';

function createComponent() {
  const login = vi.fn().mockResolvedValue(undefined);
  const navigateByUrl = vi.fn().mockResolvedValue(true);

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthService, useValue: { login } },
      { provide: Router, useValue: { navigateByUrl } },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new LoginPageComponent());

  return {
    component,
    login,
    navigateByUrl,
  };
}

describe('LoginPageComponent', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
  });

  it('mostra erro quando email e senha estão vazios', async () => {
    const { component } = createComponent();

    await component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('Preencha o email e a senha.');
  });

  it('mostra e oculta a senha sem alterar o valor atual', () => {
    const { component } = createComponent();

    component.updatePassword('segredo123');
    expect(component.showPassword()).toBe(false);

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    expect(component.password()).toBe('segredo123');

    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
    expect(component.password()).toBe('segredo123');
  });

  it('faz login e redireciona para /agenda quando autenticação dá certo', async () => {
    const { component, login, navigateByUrl } = createComponent();

    component.updateEmail('ana@salao.com');
    component.updatePassword('123456');

    await component.onSubmit(new Event('submit'));

    expect(login).toHaveBeenCalledWith('ana@salao.com', '123456');
    expect(navigateByUrl).toHaveBeenCalledWith('/agenda');
    expect(component.error()).toBeNull();
    expect(component.isLoading()).toBe(false);
  });

  it('preserva a mensagem da API quando o login falha', async () => {
    const { component, login } = createComponent();
    login.mockRejectedValue(new HttpErrorResponse({
      status: 401,
      error: {
        code: 'auth.invalid_credentials',
        message: 'Credenciais inválidas para este salão.',
      },
    }));

    component.updateEmail('ana@salao.com');
    component.updatePassword('senha-ruim');

    await component.onSubmit(new Event('submit'));

    expect(component.error()).toBe('Credenciais inválidas para este salão.');
    expect(component.email()).toBe('ana@salao.com');
    expect(component.password()).toBe('senha-ruim');
    expect(component.isLoading()).toBe(false);
  });
});
