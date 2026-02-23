import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";

/**
 * Guard para a página de LOGIN
 * 
 * Regras:
 * - Se o usuário NÃO está logado: permite acesso à tela de login
 * - Se o usuário ESTÁ logado: redireciona para o Dashboard
 */
@Injectable({ providedIn: 'root' })
export class GuardaRotasLogin {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    // Verifica se o usuário está autenticado (token válido)
    if (this.authService.isAuthenticated()) {
      // Usuário já está logado - redireciona para Dashboard
      return this.router.parseUrl('/Dashboard');
    }

    // Usuário não está logado - permite acesso à tela de login
    return true;
  }
}
