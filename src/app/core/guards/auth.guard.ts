import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para ROTAS PROTEGIDAS (que requerem login)
 * 
 * Regras:
 * - Verifica se o login ainda está válido (token válido + 2FA)
 * - Se NÃO está logado: redireciona para tela de login
 * - Se ESTÁ logado: permite acesso à rota
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
      return true;
    }

    // Limpa qualquer estado de autenticação inválido
    this.authService.logout();
    
    // Redireciona para tela de login
    return this.router.createUrlTree(['']);
  }
}
