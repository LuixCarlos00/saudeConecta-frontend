import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor para tratamento global de erros HTTP
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Trata erros de autenticação
        if (error.status === 401) {
          this.handleUnauthorized();
        }

        // Trata erros de permissão
        if (error.status === 403) {
          this.handleForbidden();
        }

        // Propaga o erro para tratamento específico no componente
        return throwError(() => error);
      })
    );
  }

  /**
   * Trata erro 401 - Não autorizado
   */
  private handleUnauthorized(): void {
    console.warn('[ErrorInterceptor] Token expirado ou inválido');
    this.authService.logout();
  }

  /**
   * Trata erro 403 - Proibido
   */
  private handleForbidden(): void {
    console.warn('[ErrorInterceptor] Acesso negado');
    // Não faz logout, apenas loga o erro
    // O componente pode tratar de forma específica
  }
}
