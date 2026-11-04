import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Rotas do front acessíveis sem login: um 401 nelas não deve expulsar o paciente para o login. */
const ROTAS_PUBLICAS = ['/cadastro', '/recuperaCadastro', '/assinatura', '/questionario-saude', '/assinatura-planejamento'];

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
        if (error.status === 401 && !this.isPublicRequest(request)) {
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
   * Indica se o 401 veio de chamada /publico/** ou ocorreu em uma rota pública do front.
   * Compara por segmento para não confundir '/cadastro' com '/cadastroadmin'.
   */
  private isPublicRequest(request: HttpRequest<any>): boolean {
    if (request.url.includes('/publico/')) return true;
    const caminho = this.router.url.split(/[?#]/)[0];
    return ROTAS_PUBLICAS.some(rota => caminho === rota || caminho.startsWith(rota + '/'));
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
