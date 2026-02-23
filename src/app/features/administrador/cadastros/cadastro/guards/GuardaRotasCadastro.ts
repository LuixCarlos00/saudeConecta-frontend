import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { tokenService } from 'src/app/util/Token/Token.service';

@Injectable({ providedIn: 'root' })
export class GuardaRotasCadastra {
  constructor( private authService: AuthService, private router: Router, private tokeService: tokenService ) {}


  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Obtém a rota anterior
    const rotaAnterior = state?.url;

    // Verifica se a rota anterior foi 'cadastroUsuario'
    if (rotaAnterior && rotaAnterior.includes('/cadastroUsuario')) {
      // Se a rota anterior foi 'cadastroUsuario', verifica se há token de autenticação
      if (this.tokeService.possuiToken()) {
        // Com token de autenticação, permita o acesso
        return true;
      } else {
        // Sem token de autenticação, redirecione para a tela de login
        this.router.navigate(['/login']);
        return false;
      }
    } else {
      // Se a rota anterior não foi 'cadastroUsuario', permita o acesso
      return true;
    }
  }

  }


