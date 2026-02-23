import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { AuthService } from "src/app/core/services/auth.service";

/**
 * Guard para a Landing Page
 * 
 * Regras:
 * - Se o usuário NÃO está logado: permite acesso à Landing Page
 * - Se o usuário ESTÁ logado: redireciona para o Dashboard
 */
@Injectable({ providedIn: 'root' })
export class LandingPageGuard {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.authService.isAuthenticated()) {
      return this.router.parseUrl('/Dashboard');
    }
    return true;
  }
}
