import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';

/** Única tela liberada enquanto a senha recebida por e-mail não for trocada. */
const ROTA_TROCA_SENHA = '/trocaSenha';

/**
 * Guard para ROTAS PROTEGIDAS (que requerem login)
 * 
 * Regras:
 * - Verifica se o login ainda está válido (token válido + 2FA)
 * - Se NÃO está logado: redireciona para tela de login
 * - Se ESTÁ logado: permite acesso à rota
 * - Se ESTÁ logado no primeiro acesso: só a troca de senha abre; o resto redireciona para ela
 * 
 * Usuários permitidos: admin, medico, secretaria
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    // Verifica se está completamente autenticado (token válido + 2FA)
    if (this.authService.isAuthenticated()) {
      // Primeiro acesso: qualquer tela protegida leva à troca de senha (o back recusa o resto com 403)
      const caminho = state.url.split(/[?#]/)[0];
      if (this.authService.deveTrocarSenha() && caminho !== ROTA_TROCA_SENHA) {
        return this.router.createUrlTree([ROTA_TROCA_SENHA]);
      }
      return true;
    }

    // Limpa qualquer estado de autenticação inválido
    this.authService.logout();
    
    // Redireciona para tela de login
    return this.router.createUrlTree(['']);
  }
}
