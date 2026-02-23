import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../../shared/constants/roles.constant';

/**
 * Guard para verificar PERMISSÕES DE ROLE
 * 
 * Regras:
 * - Verifica se o usuário tem a role necessária para acessar a rota
 * - Deve ser usado APÓS o AuthGuard (que já verificou se está logado)
 * - Se não tem permissão: redireciona para Dashboard
 * 
 * Uso: canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] }
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {

    // Obtém roles requeridas da configuração da rota
    const requiredRoles = route.data['roles'] as Role[];

    // Se não há roles definidas na rota, permite acesso (qualquer usuário logado)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtém role do usuário atual
    const userRole = this.authService.getUserRole();

    // Verifica se o usuário tem uma das roles requeridas
    // Usa includes() porque a role do token pode conter múltiplas roles
    const hasRequiredRole = requiredRoles.some(role => {
      // Para roles legadas - comparação exata
      if (userRole === role) return true;
      
      // Para roles multi-tenant - verifica se contém a role
      if (role === Role.ADMIN && (userRole.includes('ROLE_ADMIN') || userRole.includes('ROLE_SUPER_ADMIN'))) return true;
      if (role === Role.DOCTOR && (userRole.includes('ROLE_Medico') || userRole.includes('ROLE_PROFISSIONAL'))) return true;
      if (role === Role.SECRETARY && (userRole.includes('ROLE_Secretaria') || userRole.includes('ROLE_RECEPCIONISTA'))) return true;
      
      return false;
    });

    if (hasRequiredRole) {
      return true;
    }

    // Usuário não tem permissão para esta rota
    // Redireciona para Dashboard (rota padrão após login)
    return this.router.createUrlTree(['/Dashboard']);
  }
}
