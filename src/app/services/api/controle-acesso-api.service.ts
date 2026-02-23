import { Injectable } from '@angular/core';
import { tokenService } from 'src/app/util/Token/Token.service';

export interface UsuarioLogado {
  id: number;
  aud: string;
  exp: string;
  iss: string;
  sub: string;
}

export enum TipoUsuario {
  SUPER_ADMIN = 'ROLE_SUPER_ADMIN',
  ADMIN = 'ROLE_ADMIN',
  GERENTE = 'ROLE_GERENTE',
  PROFISSIONAL = 'ROLE_PROFISSIONAL',
  RECEPCIONISTA = 'ROLE_RECEPCIONISTA'
}

@Injectable({
  providedIn: 'root',
})
export class ControleAcessoApiService {
  UsuarioLogado: UsuarioLogado = {
    id: 0,
    aud: '',
    exp: '',
    iss: '',
    sub: '',
  };

  constructor(private tokenService: tokenService) {
    this.tokenService.decodificaToken();
    this.tokenService.UsuarioLogadoValue$.subscribe((usuario) => {
      if (usuario) {
        this.UsuarioLogado = usuario;
      }
    });
  }

  private possuiRole(role: TipoUsuario): boolean {
    const autorizacao = this.tokenService.obterAutorizacao();
    return autorizacao.includes(role);
  }

  // ========== VERIFICAÇÕES POR TIPO ==========

  isSuperAdmin(): boolean {
    return this.possuiRole(TipoUsuario.SUPER_ADMIN);
  }

  isAdmin(): boolean {
    return this.possuiRole(TipoUsuario.ADMIN);
  }

  isGerente(): boolean {
    return this.possuiRole(TipoUsuario.GERENTE);
  }

  isProfissional(): boolean {
    return this.possuiRole(TipoUsuario.PROFISSIONAL);
  }

  isRecepcionista(): boolean {
    return this.possuiRole(TipoUsuario.RECEPCIONISTA);
  }

  // ========== VERIFICAÇÕES DE PERMISSÃO POR MENU ==========

  // Menu Usuários: Super Admin, Admin
  podeVerMenuUsuarios(): boolean {
    return this.isSuperAdmin() || this.isAdmin();
  }

  // Menu Agenda: Admin apenas (não Super Admin)
  podeVerMenuAgenda(): boolean {
    return this.isAdmin() && !this.isSuperAdmin();
  }

  // Menu Minha Agenda: Profissional apenas (não Admin)
  podeVerMenuMinhaAgenda(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // Menu Prontuário: Profissional apenas (não Admin)
  podeVerMenuProntuario(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // Menu Meus Dados: Admin, Profissional
  podeVerMenuMeusDados(): boolean {
    return this.isAdmin() || (this.isProfissional() && !this.isDashboardAdministrativo());
  }

  // Menu Pacientes: Profissional apenas (não Admin)
  podeVerMenuPacientes(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // Menu Mensageria: Admin apenas
  podeVerMenuMensageria(): boolean {
    return this.isAdmin();
  }

  // ========== DASHBOARDS ==========

  isDashboardAdministrativo(): boolean {
    return this.isSuperAdmin() || this.isAdmin();
  }

  isDashboardProfissional(): boolean {
    return this.isProfissional() && !this.isDashboardAdministrativo();
  }

  // ========== RETROCOMPATIBILIDADE ==========

  podeGerenciarOrganizacao(): boolean {
    return this.isSuperAdmin() || this.isAdmin() || this.isGerente();
  }

  podeGerenciarUsuarios(): boolean {
    return this.podeVerMenuUsuarios();
  }

  podeAcessarMinhaAgenda(): boolean {
    return this.podeVerMenuMinhaAgenda();
  }

  podeAcessarAgenda(): boolean {
    return this.podeVerMenuAgenda();
  }

  podeAcessarProntuario(): boolean {
    return this.podeVerMenuProntuario();
  }

  // ========== RETROCOMPATIBILIDADE (métodos antigos) ==========

  AcessoMedico(): boolean {
    return this.isProfissional();
  }

  AcessoAdministrador(): boolean {
    return this.isAdmin();
  }

  AcessoSecretaria(): boolean {
    return this.isRecepcionista();
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
