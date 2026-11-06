import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { AuthService } from '../../auth/auth.service';
import { extrairCodigoErro, extrairMensagemErro } from 'src/app/shared/utils/mensagem-erro-http';

/** Rotas do front acessíveis sem login: um 401 nelas não deve expulsar o paciente para o login. */
const ROTAS_PUBLICAS = ['/cadastro', '/recuperaCadastro', '/assinatura', '/questionario-saude', '/assinatura-planejamento'];

/** Código que o back devolve (403) quando a assinatura da clínica não dá acesso ao sistema. */
const CODIGO_PLANO_SEM_ACESSO = 'PLANO_SEM_ACESSO';

/** Janela em que um novo aviso de plano suspenso é suprimido após o anterior ser fechado. */
const DEBOUNCE_AVISO_MS = 5000;

/**
 * Interceptor para tratamento global de erros HTTP
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  private avisoPlanoAberto = false;

  constructor(
    private notificacao: NotificacaoService,
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
          this.handleForbidden(error);
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
   * Trata erro 403 - Proibido. Quando é plano suspenso/cancelado, avisa uma única vez
   * (debounce) e leva o admin para "minha assinatura", sem logout.
   */
  private handleForbidden(error: HttpErrorResponse): void {
    console.warn('[ErrorInterceptor] Acesso negado');
    const mensagem = extrairMensagemErro(error);
    if (!this.isPlanoSemAcesso(error, mensagem)) return;

    // Já na tela de pagamento: o próprio componente trata o estado; avisar/navegar de novo geraria loop.
    if (this.router.url.startsWith('/minha-assinatura') || this.avisoPlanoAberto) return;

    this.avisoPlanoAberto = true;
    const papel = this.authService.getUserRole() ?? '';
    // Mesmos papéis que a rota /minha-assinatura aceita (ADMIN e secretária)
    const podePagar = /ROLE_ADMIN|ROLE_SUPER_ADMIN|ROLE_Secretaria|ROLE_RECEPCIONISTA/.test(papel);
    this.notificacao.fire({ icon: 'warning', title: 'Plano indisponível', text: mensagem ?? undefined }).finally(() => {
      setTimeout(() => (this.avisoPlanoAberto = false), DEBOUNCE_AVISO_MS);
    });
    if (podePagar) {
      this.router.navigate(['/minha-assinatura']);
    }
  }

  /**
   * Identifica o 403 de plano sem acesso pelo `code` do back; a regex na mensagem
   * fica como fallback para respostas antigas sem `code`.
   */
  private isPlanoSemAcesso(error: HttpErrorResponse, mensagem: string | null): boolean {
    if (extrairCodigoErro(error) === CODIGO_PLANO_SEM_ACESSO) return true;
    return !!mensagem && /plano.*(suspens|cancelad)/i.test(mensagem);
  }
}
