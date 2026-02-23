import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from './core/guards';
import { ProntuarioGuard } from './core/guards/prontuario.guard';
import { Role } from './shared/constants/roles.constant';
import { NotFoudComponent } from './util/Erros/Erro404/not-foud.component';

// ========== FEATURES PÚBLICAS ==========
import { LandingPageComponent } from './features/publico/landing-page/landing-page.component';
import { LandingPageGuard } from './features/publico/landing-page/guards/landing-page.guard';
import { LoginComponent } from './features/publico/login/login.component';
import { GuardaRotasLogin } from './features/publico/login/guards/GuardaRotasLogin';
import { RecuperaCadastroComponent } from './features/publico/recupera-cadastro/recupera-cadastro/recupera-cadastro.component';

// ========== FEATURES ADMINISTRADOR ==========
import { DashboardComponent } from './features/administrador/dashboard/dashboard.component';
import { GerenciamentoComponent } from './features/administrador/gerenciamento-agenda/gerenciamento.component';
import { GerenciamentoUsuarioComponent } from './features/administrador/gerenciamento-usuarios/gerenciamento-usuario.component';
import { CadastroUsuarioComponent } from './features/administrador/cadastros/cadastro-usuario/cadastro-usuario.component';
import { CadastroComponent } from './features/administrador/cadastros/cadastro/cadastro.component';
import { CadastroPacienteComponent } from './features/administrador/cadastros/cadastro-paciente/cadastro-paciente.component';
import { CadastroMedicoComponent } from './features/administrador/cadastros/cadastro-medico/cadastro-medico.component';
import { CadastroAdmComponent } from './features/administrador/cadastros/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from './features/administrador/cadastros/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroSecretariaComponent } from './features/administrador/cadastros/cadastro-secretaria/cadastro-secretaria.component';
import { ConfiguracoesSistemaComponent } from './features/administrador/configuracoes/configuracoes-sistema.component';
import { TrocaSenhaComponent } from './features/administrador/troca-senha/troca-senha.component';
import { SobreComponent } from './features/administrador/sobre/sobre.component';
import { SuporteComponent } from './features/administrador/suporte/suporte.component';
import { MensageriaComponent } from './features/administrador/mensageria/mensageria.component';

// ========== FEATURES MÉDICO ==========
import { DadosPessoaisComponent } from './features/medico/dados-pessoais/DadosPessoais.component';
import { ProntuarioMedicoComponent } from './features/medico/prontuario-medico/prontuario-medico.component';
import { ProntuarioComponent } from './features/medico/prontuario/prontuario.component';
import { AgendaMedicoGerenciamentoComponent } from './features/medico/agenda/agenda-medico-gerenciamento.component';
import { ProntuarioDentistaComponent } from './features/medico/prontuario-dentista/prontuario-dentista.component';


const routes: Routes = [
  // ========== LANDING PAGE (PÁGINA INICIAL) ==========
  { path: '', component: LandingPageComponent, canActivate: [LandingPageGuard] },

  // ========== ROTAS PÚBLICAS ==========
  { path: 'login', component: LoginComponent, canActivate: [GuardaRotasLogin] },
  { path: 'cadastroUsuario', component: CadastroUsuarioComponent },
  { path: 'recuperaCadastro', component: RecuperaCadastroComponent },

  // ========== ROTAS ADMIN E MÉDICO ==========
  { path: 'Dashboard', component: DashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] } },
  { path: 'sistema', component: ConfiguracoesSistemaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] } },
  { path: 'trocaSenha', component: TrocaSenhaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] } },
  { path: 'sobre', component: SobreComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] } },
  { path: 'suporte', component: SuporteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR] } },

  // ========== ROTAS APENAS ADMIN ==========
  { path: 'gerenciamento', component: GerenciamentoComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'Gerenciamento-Usuarios', component: GerenciamentoUsuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroadmin', component: CadastroAdmComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastro', component: CadastroComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroPaciente', component: CadastroPacienteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroMedico', component: CadastroMedicoComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroSecretaria', component: CadastroSecretariaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroAdminOrg', component: CadastroAdminOrgComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'mensageria', component: MensageriaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },

  // ========== ROTAS APENAS MÉDICO ==========
  { path: 'Dados-Medicos', component: DadosPessoaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-medico', component: ProntuarioMedicoComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-dentista', component: ProntuarioDentistaComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'Prontuario', component: ProntuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'Agenda-Medico', component: AgendaMedicoGerenciamentoComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] } },

  // ========== ROTA 404 ==========
  { path: '**', pathMatch: 'full', component: NotFoudComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
