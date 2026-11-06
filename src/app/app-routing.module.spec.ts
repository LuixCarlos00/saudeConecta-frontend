import { TestBed } from '@angular/core/testing';
import { Location, LocationStrategy } from '@angular/common';
import { MockLocationStrategy } from '@angular/common/testing';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard, RoleGuard } from './core/auth/guards';
import { ProntuarioGuard } from './features/atendimento/guards/prontuario.guard';
import { LandingPageGuard } from './features/publico/guards/landing-page.guard';
import { GuardaRotasLogin } from './features/auth/guards/GuardaRotasLogin';

const URLS = [
  '/', '/login', '/recuperaCadastro', '/cadastro', '/assinatura/sucesso', '/assinatura/pendente',
  '/questionario-saude/abc123', '/assinatura-planejamento/abc123',
  '/Dashboard', '/sistema', '/trocaSenha', '/suporte',
  '/Gerenciamento-Usuarios', '/cadastroadmin', '/cadastroPaciente', '/cadastroMedico', '/cadastroSecretaria',
  '/cadastroAdminOrg', '/gestao-chamados', '/mensageria',
  '/gerenciar-planos', '/gestao-assinaturas', '/pendencias-manuais', '/minha-assinatura',
  '/historico-dados-pessoais',
  '/dadospessoais', '/startconsulta', '/startconsulta/12', '/startconsulta-dentista', '/startconsulta-dentista/12',
  '/Prontuario', '/agenda-calendario', '/relatorios',
  '/planos', '/rota-que-nao-existe', '/assinatura/outra',
];

/** Linha "url|componente|guards|data" da rota folha ativada (pai -> filho). */
function descrever(url: string, raiz: ActivatedRouteSnapshot): string {
  const guards: string[] = [];
  let atual: ActivatedRouteSnapshot | null = raiz;
  let folha = raiz;
  let data: unknown = {};
  while (atual) {
    (atual.routeConfig?.canActivate ?? []).forEach((g) => guards.push((g as { name: string }).name));
    if (atual.routeConfig?.data) { data = atual.routeConfig.data; }
    folha = atual;
    atual = atual.firstChild;
  }
  const componente = (folha.routeConfig?.component as { name: string } | undefined)?.name ?? '-';
  return [url, componente, guards.join('+') || '-', JSON.stringify(data)].join('|');
}

/**
 * Tabela de URLs congelada antes da F5 (lazy loading): url|componente|guards|data.
 * Qualquer mudanca de path, componente, guard ou data.roles quebra este teste.
 */
const TABELA_ESPERADA = [
  '/|LandingPageComponent|LandingPageGuard|{}',
  '/login|LoginComponent|GuardaRotasLogin|{}',
  '/recuperaCadastro|RecuperaCadastroComponent|-|{}',
  '/cadastro|CadastroSaasComponent|-|{}',
  '/assinatura/sucesso|AssinaturaRetornoComponent|-|{"situacao":"sucesso"}',
  '/assinatura/pendente|AssinaturaRetornoComponent|-|{"situacao":"pendente"}',
  '/questionario-saude/abc123|QuestionarioSaudeComponent|-|{}',
  '/assinatura-planejamento/abc123|AssinaturaPlanejamentoComponent|-|{}',
  '/Dashboard|DashboardComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/sistema|ConfiguracoesSistemaComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/trocaSenha|TrocaSenhaComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/suporte|SuporteComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/Gerenciamento-Usuarios|GerenciamentoUsuarioComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]"]}',
  '/cadastroadmin|CadastroAdmComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]"]}',
  '/cadastroPaciente|CadastroPacienteComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Secretaria]"]}',
  '/cadastroMedico|CadastroMedicoComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]"]}',
  '/cadastroSecretaria|CadastroSecretariaComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]"]}',
  '/cadastroAdminOrg|CadastroAdminOrgComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/gestao-chamados|GestaoChamadosComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/mensageria|MensageriaComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Secretaria]"]}',
  '/gerenciar-planos|GerenciarPlanosComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/gestao-assinaturas|GestaoAssinaturasComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/pendencias-manuais|PendenciasManuaisComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/minha-assinatura|DetalheAssinaturaComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Secretaria]"]}',
  '/historico-dados-pessoais|HistoricoDadosPessoaisComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_PROFISSIONAL, ROLE_RECEPCIONISTA]"]}',
  '/dadospessoais|DadosPessoaisComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/startconsulta|ProntuarioMedicoComponent|AuthGuard+RoleGuard+ProntuarioGuard|{"roles":["[ROLE_Medico]"]}',
  '/startconsulta/12|ProntuarioMedicoComponent|AuthGuard+RoleGuard+ProntuarioGuard|{"roles":["[ROLE_Medico]"]}',
  '/startconsulta-dentista|ProntuarioDentistaComponent|AuthGuard+RoleGuard+ProntuarioGuard|{"roles":["[ROLE_Medico]"]}',
  '/startconsulta-dentista/12|ProntuarioDentistaComponent|AuthGuard+RoleGuard+ProntuarioGuard|{"roles":["[ROLE_Medico]"]}',
  '/Prontuario|ProntuarioComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_Medico]"]}',
  '/agenda-calendario|AgendaCalendarioComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/relatorios|RelatoriosPacientesComponent|AuthGuard+RoleGuard|{"roles":["[ROLE_ADMIN]","[ROLE_Medico]","[ROLE_Secretaria]"]}',
  '/planos|NotFoundComponent|-|{}',
  '/rota-que-nao-existe|NotFoundComponent|-|{}',
  '/assinatura/outra|NotFoundComponent|-|{}'
];

describe('AppRoutingModule (tabela de URLs)', () => {
  let router: Router;

  beforeEach(() => {
    const liberar = { canActivate: () => true };
    TestBed.configureTestingModule({
      imports: [AppRoutingModule],
      providers: [
        { provide: LocationStrategy, useClass: MockLocationStrategy },
        Location,
        { provide: AuthGuard, useValue: liberar },
        { provide: RoleGuard, useValue: liberar },
        { provide: ProntuarioGuard, useValue: liberar },
        { provide: LandingPageGuard, useValue: liberar },
        { provide: GuardaRotasLogin, useValue: liberar },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('cada URL continua resolvendo o mesmo componente, guards e data (inclusive carregando as areas lazy)', async () => {
    const linhas: string[] = [];
    for (const url of URLS) {
      await router.navigateByUrl(url);
      linhas.push(descrever(url, router.routerState.snapshot.root));
    }
    expect(linhas).toEqual(TABELA_ESPERADA);
  });
});
