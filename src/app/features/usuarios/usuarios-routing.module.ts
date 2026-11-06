import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from 'src/app/core/auth/guards';
import { CadastroAdmComponent } from 'src/app/features/usuarios/pages/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from 'src/app/features/usuarios/pages/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroMedicoComponent } from 'src/app/features/usuarios/pages/cadastro-medico/cadastro-medico.component';
import { CadastroSecretariaComponent } from 'src/app/features/usuarios/pages/cadastro-secretaria/cadastro-secretaria.component';
import { DadosPessoaisComponent } from 'src/app/features/usuarios/pages/dados-pessoais/DadosPessoais.component';
import { GerenciamentoUsuarioComponent } from 'src/app/features/usuarios/pages/gerenciamento-usuarios/gerenciamento-usuario.component';
import { Role } from 'src/app/shared/constants/roles.constant';

/**
 * Rotas da area usuarios (gerenciamento de usuarios, cadastros e dados pessoais).
 * Os paths sao os mesmos que existiam no app-routing; a area e carregada sob demanda
 * pelo matcher declarado em app-routing.module.ts.
 */
const routes: Routes = [
  { path: 'Gerenciamento-Usuarios', component: GerenciamentoUsuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroadmin', component: CadastroAdmComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroMedico', component: CadastroMedicoComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroSecretaria', component: CadastroSecretariaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroAdminOrg', component: CadastroAdminOrgComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'dadospessoais', component: DadosPessoaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR, Role.SECRETARY] } },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsuariosRoutingModule {}
