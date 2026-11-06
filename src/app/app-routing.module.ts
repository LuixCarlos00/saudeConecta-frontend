import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { caminhosDaArea } from './core/rotas/caminhos-da-area';
import { NotFoundComponent } from './core/layout/not-found/not-found.component';

/**
 * Cada area e um modulo carregado sob demanda (lazy). O matcher casa pelo primeiro segmento da URL
 * e nao consome nada: os paths finais, guards e data.roles continuam declarados no
 * `<area>-routing.module.ts` e as URLs (inclusive as dos e-mails) nao mudam.
 */
const routes: Routes = [
  // ========== PAGINA INICIAL E ROTAS PUBLICAS ==========
  {
    matcher: caminhosDaArea('', 'cadastro', 'assinatura', 'questionario-saude', 'assinatura-planejamento'),
    loadChildren: () => import('./features/publico/publico.module').then((m) => m.PublicoModule),
  },
  // ========== LOGIN, RECUPERACAO E TROCA DE SENHA ==========
  {
    matcher: caminhosDaArea('login', 'recuperaCadastro', 'trocaSenha'),
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  // ========== DASHBOARD ==========
  {
    matcher: caminhosDaArea('Dashboard'),
    loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  // ========== CONFIGURACOES ==========
  {
    matcher: caminhosDaArea('sistema'),
    loadChildren: () => import('./features/configuracoes/configuracoes.module').then((m) => m.ConfiguracoesModule),
  },
  // ========== SUPORTE ==========
  {
    matcher: caminhosDaArea('suporte', 'gestao-chamados'),
    loadChildren: () => import('./features/suporte/suporte.module').then((m) => m.SuporteModule),
  },
  // ========== USUARIOS ==========
  {
    matcher: caminhosDaArea('Gerenciamento-Usuarios', 'cadastroadmin', 'cadastroMedico', 'cadastroSecretaria', 'cadastroAdminOrg', 'dadospessoais'),
    loadChildren: () => import('./features/usuarios/usuarios.module').then((m) => m.UsuariosModule),
  },
  // ========== AGENDA ==========
  {
    matcher: caminhosDaArea('cadastroPaciente', 'agenda-calendario'),
    loadChildren: () => import('./features/agenda/agenda.module').then((m) => m.AgendaModule),
  },
  // ========== MENSAGERIA ==========
  {
    matcher: caminhosDaArea('mensageria'),
    loadChildren: () => import('./features/mensageria/mensageria.module').then((m) => m.MensageriaModule),
  },
  // ========== ASSINATURA E PLANOS ==========
  {
    matcher: caminhosDaArea('gerenciar-planos', 'gestao-assinaturas', 'pendencias-manuais', 'minha-assinatura'),
    loadChildren: () => import('./features/assinatura/assinatura.module').then((m) => m.AssinaturaModule),
  },
  // ========== AUDITORIA ==========
  {
    matcher: caminhosDaArea('historico-dados-pessoais'),
    loadChildren: () => import('./features/auditoria/auditoria.module').then((m) => m.AuditoriaModule),
  },
  // ========== ATENDIMENTO (PRONTUARIOS) ==========
  {
    matcher: caminhosDaArea('startconsulta', 'startconsulta-dentista', 'Prontuario'),
    loadChildren: () => import('./features/atendimento/atendimento.module').then((m) => m.AtendimentoModule),
  },
  // ========== RELATORIOS ==========
  {
    matcher: caminhosDaArea('relatorios'),
    loadChildren: () => import('./features/relatorios/relatorios-routing.module').then((m) => m.RelatoriosRoutingModule),
  },

  // ========== ROTA 404 ==========
  { path: '**', pathMatch: 'full', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule { }
