import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

import { AuthService } from 'src/app/core/services/auth.service';

/**
 * Fachada fina de compatibilidade sobre o AuthService.
 *
 * O armazenamento do token (chave 'authToken') é do AuthService; este serviço só
 * mantém a API antiga (usada em ~20 componentes) e o payload completo do JWT
 * (inclui campos como `nome`, que o DecodedToken do AuthService não tipa).
 * Código novo deve usar o AuthService diretamente.
 */
@Injectable({ providedIn: 'root' })
export class tokenService {
  private UsuarioLogadoSubject = new BehaviorSubject<any | null>(null);
  UsuarioLogadoValue$ = this.UsuarioLogadoSubject.asObservable();

  constructor(private authService: AuthService) {}

  /**
   * Retorna o usuário logado (payload do JWT) de forma síncrona.
   * @returns payload decodificado ou null se ainda não decodificado
   */
  getUsuarioLogado(): any | null {
    return this.UsuarioLogadoSubject.getValue();
  }

  /**
   * Retorna o token salvo (delegado ao AuthService).
   * @returns token ou string vazia
   */
  retornaToken(): string {
    return this.authService.getToken();
  }

  /**
   * Indica se há token salvo (delegado ao AuthService).
   * @returns true se existe token
   */
  possuiToken(): boolean {
    return this.authService.hasToken();
  }

  /**
   * Decodifica o token atual e publica o payload em UsuarioLogadoValue$.
   */
  public decodificaToken(): void {
    const token = this.retornaToken();
    if (token) {
      this.UsuarioLogadoSubject.next(jwtDecode<any>(token));
    }
  }

  obterAutorizacao(): string {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.aud : '';
  }

  obterOrganizacaoId(): number | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.organizacaoId : null;
  }

  obterUsuarioId(): number | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.id : null;
  }

  obterNome(): string | null {
    this.decodificaToken();
    const usuario = this.UsuarioLogadoSubject.getValue();
    return usuario ? usuario.nome : null;
  }
}
