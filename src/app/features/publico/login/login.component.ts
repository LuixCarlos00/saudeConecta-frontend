import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

// Core services
import { AuthService } from 'src/app/core/services/auth.service';
import { ErrorHandlerService } from 'src/app/core/services/error-handler.service';

// Constants
import { ALLOWED_ROLES, Role } from 'src/app/shared/constants/roles.constant';

// Token service
import { tokenService } from 'src/app/util/Token/Token.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {

  /** Formulário de login */
  loginForm!: FormGroup;

  /** Flag de loading */
  isLoading = false;

  /** Subject para gerenciar unsubscribe */
  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private tokenService: tokenService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa o formulário de login
   */
  private initForm(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  /**
   * Navega para cadastro de novo usuário
   */
  navigateToRegister(): void {
    this.router.navigate(['cadastroUsuario']);
  }

  /**
   * Navega para recuperação de senha
   */
  navigateToPasswordRecovery(): void {
    this.router.navigate(['recuperaCadastro']);
  }

  /**
   * Realiza o login do usuário
   */
  login(): void {
    // Valida formulário
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const credentials = {
      login: this.loginForm.get('username')?.value,
      senha: this.loginForm.get('password')?.value,
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (error) => this.handleLoginError(error)
      });
  }

  /**
   * Processa login bem-sucedido
   */
  private handleLoginSuccess(response: any): void {
    this.isLoading = false;

    if (!response.body?.token) {
      this.errorHandler.showError('Resposta inválida do servidor');
      return;
    }

    const token = response.body.token;
    const success = this.authService.handleLoginSuccess(token);

    if (success) {
      this.router.navigate(['/Dashboard']);
    } else {
      this.errorHandler.showError('Você não tem permissão para acessar esta página');
    }
  }

  /**
   * Processa erro de login
   */
  private handleLoginError(error: any): void {
    this.isLoading = false;
    this.errorHandler.showError('Email ou senha inválidos');
    console.error('[Login] Erro:', error);
  }

  // ========== Getters para template ==========

  get usernameControl() {
    return this.loginForm.get('username');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  // ========== Métodos legados (compatibilidade) ==========

  /** @deprecated Use navigateToRegister() */
  cadastraNovoUsuario(): void {
    this.navigateToRegister();
  }

  /** @deprecated Use navigateToPasswordRecovery() */
  recuperaSenha_Usuario(): void {
    this.navigateToPasswordRecovery();
  }

  /** @deprecated Use login() */
  Login(): void {
    this.login();
  }

  /** @deprecated Manter FormularioUsuario para compatibilidade com template */
  get FormularioUsuario(): FormGroup {
    return this.loginForm;
  }
}
