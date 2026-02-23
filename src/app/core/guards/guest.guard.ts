import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para rotas de visitantes (login, cadastro)
 * Redireciona para Dashboard se já autenticado
 */
@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    // Se já está autenticado, redireciona para Dashboard
    if (this.authService.isAuthenticated()) {
      return this.router.createUrlTree(['/Dashboard']);
    }

    // Se tem token válido mas não completou 2FA, permite acesso ao login
    // para que possa completar o processo
    return true;
  }
}
