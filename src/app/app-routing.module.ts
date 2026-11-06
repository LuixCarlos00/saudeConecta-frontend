import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, RoleGuard } from './core/auth/guards';
import { ProntuarioGuard } from './features/atendimento/guards/prontuario.guard';
import { Role } from './shared/constants/roles.constant';
import { NotFoundComponent } from './core/layout/not-found/not-found.component';

// ========== FEATURES PÚBLICAS ==========
import { LandingPageComponent } from './features/publico/pages/landing-page/landing-page.component';
import { LandingPageGuard } from './features/publico/guards/landing-page.guard';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { GuardaRotasLogin } from './features/auth/guards/GuardaRotasLogin';
import { RecuperaCadastroComponent } from './features/auth/pages/recupera-cadastro/recupera-cadastro.component';
import { CadastroSaasComponent } from './features/publico/pages/cadastro-saas/cadastro-saas.component';
import { AssinaturaRetornoComponent } from './features/publico/pages/assinatura-retorno/assinatura-retorno.component';

// ========== FEATURES ADMINISTRADOR ==========
import { DashboardComponent } from './features/dashboard/pages/dashboard/dashboard.component';
import { GerenciamentoUsuarioComponent } from './features/usuarios/pages/gerenciamento-usuarios/gerenciamento-usuario.component';
import { CadastroPacienteComponent } from './features/agenda/pages/cadastro-paciente/cadastro-paciente.component';
import { CadastroMedicoComponent } from './features/usuarios/pages/cadastro-medico/cadastro-medico.component';
import { CadastroAdmComponent } from './features/usuarios/pages/cadastro-adm/cadastro-adm.component';
import { CadastroAdminOrgComponent } from './features/usuarios/pages/cadastro-admin-org/cadastro-admin-org.component';
import { CadastroSecretariaComponent } from './features/usuarios/pages/cadastro-secretaria/cadastro-secretaria.component';
import { ConfiguracoesSistemaComponent } from './features/administrador/configuracoes/configuracoes-sistema.component';
import { TrocaSenhaComponent } from './features/auth/pages/troca-senha/troca-senha.component';
import { SuporteComponent } from './features/administrador/suporte/suporte.component';
import { GestaoChamadosComponent } from './features/administrador/suporte/gestao-chamados/gestao-chamados.component';
import { MensageriaComponent } from './features/administrador/mensageria/mensageria.component';
import { GerenciarPlanosComponent } from './features/administrador/planos/gerenciar-planos/gerenciar-planos.component';
import { GestaoAssinaturasComponent } from './features/administrador/assinaturas/gestao-assinaturas/gestao-assinaturas.component';
import { PendenciasManuaisComponent } from './features/administrador/assinaturas/pendencias-manuais/pendencias-manuais.component';
import { DetalheAssinaturaComponent } from './features/administrador/planos/detalhe-assinatura/detalhe-assinatura.component';
 
import { HistoricoDadosPessoaisComponent } from './features/administrador/historico-dados-pessoais/historico-dados-pessoais.component';
 

// ========== FEATURES MÉDICO ==========
import { DadosPessoaisComponent } from './features/usuarios/pages/dados-pessoais/DadosPessoais.component';
import { ProntuarioMedicoComponent } from './features/atendimento/pages/prontuario-medico/prontuario-medico.component';
import { ProntuarioComponent } from './features/atendimento/pages/prontuario/prontuario.component';
import { AgendaCalendarioComponent } from './features/agenda/pages/agenda-calendario/agenda-calendario.component';
import { ProntuarioDentistaComponent } from './features/atendimento/pages/prontuario-dentista/prontuario-dentista.component';
import { QuestionarioSaudeComponent } from './features/publico/pages/questionario-saude/questionario-saude.component';
import { AssinaturaPlanejamentoComponent } from './features/publico/pages/assinatura-planejamento/assinatura-planejamento.component';
import { RelatoriosPacientesComponent } from './features/relatorio/relatorios-pacientes/relatorios-pacientes.component';


const routes: Routes = [
  // ========== LANDING PAGE (PÁGINA INICIAL) ==========
  { path: '', component: LandingPageComponent, canActivate: [LandingPageGuard] },

  // ========== ROTAS PÚBLICAS ==========
  { path: 'login', component: LoginComponent, canActivate: [GuardaRotasLogin] },
  { path: 'recuperaCadastro', component: RecuperaCadastroComponent },
  { path: 'cadastro', component: CadastroSaasComponent },
  { path: 'assinatura/sucesso', component: AssinaturaRetornoComponent, data: { situacao: 'sucesso' } },
  { path: 'assinatura/pendente', component: AssinaturaRetornoComponent, data: { situacao: 'pendente' } },
  { path: 'questionario-saude/:token', component: QuestionarioSaudeComponent },
  { path: 'assinatura-planejamento/:token', component: AssinaturaPlanejamentoComponent },

  // ========== ROTAS ADMIN E MÉDICO ==========
  { path: 'Dashboard', component: DashboardComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
  { path: 'sistema', component: ConfiguracoesSistemaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
  { path: 'trocaSenha', component: TrocaSenhaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },
  { path: 'suporte', component: SuporteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },

  // ========== ROTAS APENAS ADMIN ==========
  { path: 'Gerenciamento-Usuarios', component: GerenciamentoUsuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroadmin', component: CadastroAdmComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroPaciente', component: CadastroPacienteComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
  { path: 'cadastroMedico', component: CadastroMedicoComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroSecretaria', component: CadastroSecretariaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN] } },
  { path: 'cadastroAdminOrg', component: CadastroAdminOrgComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'gestao-chamados', component: GestaoChamadosComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'mensageria', component: MensageriaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
  
  // ========== ROTAS DE PLANOS ==========
  { path: 'gerenciar-planos', component: GerenciarPlanosComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'gestao-assinaturas', component: GestaoAssinaturasComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'pendencias-manuais', component: PendenciasManuaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
  { path: 'minha-assinatura', component: DetalheAssinaturaComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.SECRETARY] } },
 

  // ========== ROTAS DE HISTÓRICO ==========
  { path: 'historico-dados-pessoais', component: HistoricoDadosPessoaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.SUPER_ADMIN] } },
 
  // ========== ROTAS APENAS MÉDICO ==========
  { path: 'dadospessoais', component: DadosPessoaisComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR, Role.SECRETARY] } },
  { path: 'startconsulta', component: ProntuarioMedicoComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta/:consultaId', component: ProntuarioMedicoComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-dentista', component: ProntuarioDentistaComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'startconsulta-dentista/:consultaId', component: ProntuarioDentistaComponent, canActivate: [AuthGuard, RoleGuard, ProntuarioGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'Prontuario', component: ProntuarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.DOCTOR] } },
  { path: 'agenda-calendario', component: AgendaCalendarioComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },

  // ========== RELATORIOS ==========
  { path: 'relatorios', component: RelatoriosPacientesComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.DOCTOR, Role.SECRETARY] } },

  // ========== ROTA 404 ==========
  { path: '**', pathMatch: 'full', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
