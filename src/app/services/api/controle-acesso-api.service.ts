import { Injectable } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

export interface UsuarioLogado {
  id: number;
  aud: string;
  exp: number;
  iss: string;
  sub: string;
}

@Injectable({
  providedIn: 'root',
})
export class ControleAcessoApiService {
  UsuarioLogado: UsuarioLogado = {
    id: 0,
    aud: '',
    exp: 0,
    iss: '',
    sub: '',
  };

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe((usuario) => {
      if (usuario) {
        this.UsuarioLogado = usuario;
      }
    });
  }

  private possuiRole(role: string): boolean {
    const autorizacao = this.authService.getUserRole();
    return autorizacao.includes(role);
  }

  // ========== VERIFICAÇÕES POR TIPO ==========

  isSuperAdmin(): boolean {
    return this.possuiRole('ROLE_SUPER_ADMIN');
  }

  isAdmin(): boolean {
    return this.possuiRole('ROLE_ADMIN') && !this.possuiRole('ROLE_SUPER_ADMIN');
  }

  isGerente(): boolean {
    return this.possuiRole('ROLE_GERENTE');
  }

  isProfissional(): boolean {
    return this.possuiRole('ROLE_PROFISSIONAL');
  }

  isRecepcionista(): boolean {
    return this.possuiRole('ROLE_RECEPCIONISTA');
  }

  /**
   * Indica se o usuário logado pode editar/excluir um Administrador.
   * O back exige ROLE_ADMIN (ROOT e GESTOR) nesses endpoints; ASSISTENTE/CLINICO recebem 403.
   *
   * @returns true para Super Admin ou ROLE_ADMIN
   */
  podeGerenciarAdministrador(): boolean {
    return this.isSuperAdmin() || this.isAdmin();
  }

  // ========== VERIFICAÇÕES DE PERMISSÃO POR MENU ==========

  // Menu Usuários: Super Admin, Admin
  podeVerMenuUsuarios(): boolean {
    return this.isSuperAdmin() || this.isAdmin();
  }

  // Menu Agenda: Admin e Recepcionista (não Super Admin)
  podeVerMenuAgenda(): boolean {
    return (this.isAdmin() || this.isRecepcionista()) && !this.isSuperAdmin();
  }

  // Menu Minha Agenda: Profissional apenas (não Admin)
  podeVerMenuMinhaAgenda(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // Menu Prontuário: Profissional apenas (não Admin)
  podeVerMenuProntuario(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // Menu Meus Dados: Admin, Profissional, Recepcionista
  podeVerMenuMeusDados(): boolean {
    return this.isAdmin() || this.isRecepcionista() || (this.isProfissional() && !this.isDashboardAdministrativo());
  }

  // Menu Mensageria: Super Admin, Admin
  podeVerMenuMensageria(): boolean {
    return this.isSuperAdmin() || this.isAdmin();
  }

  // ========== DASHBOARDS ==========

  isDashboardAdministrativo(): boolean {
    return this.isSuperAdmin() || this.isAdmin() || this.isRecepcionista();
  }

  isDashboardProfissional(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // ========== RETROCOMPATIBILIDADE (métodos antigos) ==========

  AcessoMedico(): boolean {
    return this.isProfissional();
  }

  // ========== UTILITÁRIOS ==========

  getTipoUsuarioDescricao(): string {
    if (this.isSuperAdmin()) return 'Super Administrador';
    if (this.isAdmin()) return 'Administrador';
    if (this.isGerente()) return 'Gerente';
    if (this.isProfissional()) return 'Profissional de Saúde';
    if (this.isRecepcionista()) return 'Recepcionista';
    return 'Usuário';
  }
}
