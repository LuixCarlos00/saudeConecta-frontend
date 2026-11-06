import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/core/auth/auth.service';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AgendaCalendarioComponent } from './agenda-calendario.component';

describe('AgendaCalendarioComponent: Retomar atendimento', () => {
  let component: AgendaCalendarioComponent;
  let fixture: ComponentFixture<AgendaCalendarioComponent>;
  let http: HttpTestingController;
  const urlRascunhos = `${environment.apiUrl}/atendimentos/rascunhos/meus`;

  function montar(perfil: string): void {
    TestBed.configureTestingModule({
      declarations: [AgendaCalendarioComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO,
        {
          provide: AuthService,
          useValue: {
            currentUser$: of({ id: 1, perfil }),
            getCurrentUser: () => ({ id: 1, perfil }),
            getUserRole: () => 'ROLE_DOCTOR',
            isSuperAdmin: () => false,
            isOrgAdmin: () => false,
            isProfissional: () => false,
            isRecepcionista: () => false,
            getOrganizacaoId: () => 1,
          },
        },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(AgendaCalendarioComponent);
    component = fixture.componentInstance;
  }

  it('profissional clinico: busca os rascunhos uma vez e marca as consultas com rascunho', () => {
    montar('CLINICO');
    fixture.detectChanges();
    http.expectOne(urlRascunhos).flush([
      { consultaId: 822, atualizadoEm: '2026-11-05T14:32:10', tempoAcumuladoSegundos: 754 },
    ]);
    http.match(() => true);
    expect(component.consultasComRascunho.has(822)).toBeTrue();
    expect(component.consultasComRascunho.has(823)).toBeFalse();
    http.expectNone(urlRascunhos);
  });

  it('outros perfis nao fazem a chamada', () => {
    montar('SECRETARIA');
    fixture.detectChanges();
    http.expectNone(urlRascunhos);
    http.match(() => true);
    expect(component.consultasComRascunho.size).toBe(0);
  });

  it('falha na lista nao quebra a agenda: ninguem aparece como "Retomar"', () => {
    montar('CLINICO');
    fixture.detectChanges();
    http.expectOne(urlRascunhos).flush('erro', { status: 500, statusText: 'Server Error' });
    http.match(() => true);
    expect(component.consultasComRascunho.has(822)).toBeFalse();
  });
});


/** Navegação, filtros, carga das consultas e abertura do drawer (a lógica pura está em agenda-calendario.calculos.spec.ts). */
describe('AgendaCalendarioComponent: tela', () => {
  let component: AgendaCalendarioComponent;
  let fixture: ComponentFixture<AgendaCalendarioComponent>;
  let notificacao: jasmine.SpyObj<any>;
  let consultaService: jasmine.SpyObj<any>;
  let acoesConsulta: jasmine.SpyObj<any>;

  const consulta = (id: number, dataHora: string, extra: any = {}): any => ({
    id, dataHora, status: 'AGENDADA', profissionalId: 1, profissionalNome: 'Dra. Ana',
    especialidadeNome: 'Cardiologia', pacienteNome: 'Maria', ...extra,
  });

  beforeEach(async () => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 6, 10));

    await TestBed.configureTestingModule({
      declarations: [AgendaCalendarioComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO,
        {
          provide: AuthService,
          useValue: {
            currentUser$: of(null),
            getCurrentUser: () => null,
            getUserRole: () => 'ROLE_DOCTOR',
            isSuperAdmin: () => false,
            isOrgAdmin: () => false,
            isProfissional: () => false,
            isRecepcionista: () => false,
            getOrganizacaoId: () => 1,
          },
        },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    fixture = TestBed.createComponent(AgendaCalendarioComponent);
    component = fixture.componentInstance;

    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire']);
    consultaService = jasmine.createSpyObj('ConsultaApiService', ['buscarDoDiaAtual', 'buscarDaSemanaAtual', 'buscarDoMesAtual']);
    consultaService.buscarDoDiaAtual.and.returnValue(of([]));
    consultaService.buscarDaSemanaAtual.and.returnValue(of([]));
    consultaService.buscarDoMesAtual.and.returnValue(of([]));
    acoesConsulta = jasmine.createSpyObj('AcoesConsultaService', ['verificarPlanejamentosAssinados', 'verificarQuestionariosRespondidos']);

    const c = component as any;
    c.notificacao = notificacao;
    c.consultaService = consultaService;
    c.acoesConsulta = acoesConsulta;
  });

  afterEach(() => jasmine.clock().uninstall());

  it('navegar recarrega as consultas com a data local de referência', () => {
    component.dataAtual = new Date(2026, 10, 6);
    component.irParaProximo();
    expect(component.tituloAtual).toBe('Dezembro 2026');
    expect(consultaService.buscarDoMesAtual).toHaveBeenCalledWith('2026-12-01');
  });

  it('a visão escolhida define a rota: dia, semana ou mês', () => {
    component.dataAtual = new Date(2026, 10, 6);
    component.mudarVisualizacao('dia');
    expect(consultaService.buscarDoDiaAtual).toHaveBeenCalledWith('2026-11-06');
    component.mudarVisualizacao('semana');
    expect(consultaService.buscarDaSemanaAtual).toHaveBeenCalledWith('2026-11-06');
    component.mudarVisualizacao('mes');
    expect(consultaService.buscarDoMesAtual).toHaveBeenCalledWith('2026-11-06');
  });

  it('irParaHoje volta para hoje e recarrega', () => {
    component.dataAtual = new Date(2020, 0, 1);
    component.irParaHoje();
    expect(component.dataAtual).toEqual(new Date(2026, 10, 6, 10));
    expect(consultaService.buscarDoMesAtual).toHaveBeenCalledWith('2026-11-06');
  });

  it('selecionar um dia do mesmo mês abre a visão dia sem chamar o back', () => {
    component.dataAtual = new Date(2026, 10, 1);
    component.selecionarDia({ data: new Date(2026, 10, 15) });
    expect(component.tipoVisualizacao).toBe('dia');
    expect(component.dataAtual).toEqual(new Date(2026, 10, 15));
    // O título é atualizado antes de a visão trocar para "dia": segue como "Mês Ano" (comportamento atual).
    expect(component.tituloAtual).toBe('Novembro 2026');
    expect(consultaService.buscarDoMesAtual).not.toHaveBeenCalled();
    expect(component.horasDia.length).toBe(13);
  });

  it('visão semana também preenche os rótulos de hora (sem nunca ter aberto a visão dia)', () => {
    component.tipoVisualizacao = 'semana';
    component.gerarCalendario();
    expect(component.horasDia.map(h => h.label)).toEqual(
      ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']);
  });

  it('selecionar um dia de outro mês recarrega e mantém a visão', () => {
    component.dataAtual = new Date(2026, 10, 1);
    component.selecionarDia({ data: new Date(2026, 11, 2) });
    expect(component.tipoVisualizacao).toBe('mes');
    expect(consultaService.buscarDoMesAtual).toHaveBeenCalledWith('2026-12-02');
  });

  it('erro ao carregar avisa o usuário e libera o loading', () => {
    consultaService.buscarDoMesAtual.and.returnValue(throwError(() => ({ status: 500 })));
    component.carregarConsultas();
    expect(component.carregando).toBeFalse();
    expect(notificacao.fire).toHaveBeenCalledWith('Erro', 'Não foi possível carregar as consultas.', 'error');
  });

  it('não dispara uma segunda carga enquanto carrega', () => {
    component.carregando = true;
    component.carregarConsultas();
    expect(consultaService.buscarDoMesAtual).not.toHaveBeenCalled();
  });

  describe('filtros e opções', () => {
    const todas = [
      consulta(1, '2026-11-06T09:00:00', { status: 'AGENDADA', pacienteNome: 'Maria Souza' }),
      consulta(2, '2026-11-06T10:00:00', { status: 'CONFIRMADA', profissionalId: 2, profissionalNome: 'Dr. Bruno', especialidadeNome: 'Dermatologia', pacienteNome: 'João' }),
      consulta(3, '2026-11-06T11:00:00', { status: 'REALIZADA', pacienteNome: 'Ana Maria' }),
    ];
    const ids = () => component.consultasFiltradas.map(c => c.id);

    beforeEach(() => { component.todasConsultas = todas; });

    it('por padrão mostra agendadas e confirmadas; "finalizadas" troca o grupo e limpa os status', () => {
      component.aplicarFiltros();
      expect(ids()).toEqual([1, 2]);
      component.filtroStatusSelecionados = ['AGENDADA'];
      component.definirTipoConsulta(true);
      expect(component.filtroStatusSelecionados).toEqual([]);
      expect(ids()).toEqual([3]);
    });

    it('marcar e desmarcar um status', () => {
      component.toggleStatus('CONFIRMADA');
      expect(ids()).toEqual([2]);
      component.toggleStatus('CONFIRMADA');
      expect(component.filtroStatusSelecionados).toEqual([]);
      expect(ids()).toEqual([1, 2]);
    });

    it('limpar volta ao estado inicial', () => {
      component.filtroFinalizadas = true;
      component.filtroBusca = 'x';
      component.filtroEspecialidade = 'y';
      component.filtroProfissional = '9';
      component.filtroStatusSelecionados = ['PAGO'];
      component.limparFiltros();
      expect(component.filtroFinalizadas).toBeFalse();
      expect(component.filtroBusca).toBe('');
      expect(component.filtroEspecialidade).toBe('');
      expect(component.filtroProfissional).toBe('');
      expect(component.filtroStatusSelecionados).toEqual([]);
      expect(ids()).toEqual([1, 2]);
    });

    it('carregar guarda as opções de profissional e especialidade e gera a grade', () => {
      consultaService.buscarDoMesAtual.and.returnValue(of(todas));
      component.carregarConsultas();
      expect(component.profissionaisDisponiveis).toEqual([{ id: 1, nome: 'Dra. Ana' }, { id: 2, nome: 'Dr. Bruno' }]);
      expect(component.especialidadesDisponiveis).toEqual(['Cardiologia', 'Dermatologia']);
      expect(component.diasCalendario.length).toBe(42);
    });

    it('carregar verifica questionários nas agendadas e planejamentos nas finalizadas', () => {
      consultaService.buscarDoMesAtual.and.returnValue(of(todas));
      component.carregarConsultas();
      expect(acoesConsulta.verificarQuestionariosRespondidos).toHaveBeenCalledTimes(1);
      expect(acoesConsulta.verificarPlanejamentosAssinados).not.toHaveBeenCalled();
      component.filtroFinalizadas = true;
      component.carregarConsultas();
      expect(acoesConsulta.verificarPlanejamentosAssinados).toHaveBeenCalledTimes(1);
    });

    it('quando o serviço marca IDs, a tela troca o Set por um novo (drawer OnPush percebe)', () => {
      consultaService.buscarDoMesAtual.and.returnValue(of(todas));
      const antes = component.questionariosRespondidos;
      acoesConsulta.verificarQuestionariosRespondidos.and.callFake((_c: any, _s: any, _d: any, aoMarcar: (n: Set<number>) => void) => aoMarcar(new Set([1])));
      component.carregarConsultas();
      expect(component.questionariosRespondidos).not.toBe(antes);
      expect(component.questionariosRespondidos.has(1)).toBeTrue();
    });

    it('a legenda segue o tipo', () => {
      expect(component.legendaAtual.map(s => s.value)).toEqual(['AGENDADA', 'CONFIRMADA']);
      component.filtroFinalizadas = true;
      expect(component.legendaAtual.map(s => s.value)).toEqual(['REALIZADA', 'CANCELADA', 'PAGO']);
    });
  });

  describe('drawer', () => {
    it('abrir seleciona a consulta e abre o drawer', () => {
      const c = consulta(10, '2026-11-06T09:00:00');
      component.abrirPopover(c);
      expect(component.consultaSelecionada).toBe(c);
      expect(component.popoverAberto).toBeTrue();
    });

    it('fechar: fecha na hora e solta a consulta só depois da animação (300 ms)', () => {
      component.abrirPopover(consulta(10, '2026-11-06T09:00:00'));
      component.fecharPopover();
      expect(component.popoverAberto).toBeFalse();
      expect(component.consultaSelecionada).not.toBeNull();
      jasmine.clock().tick(300);
      expect(component.consultaSelecionada).toBeNull();
    });
  });

  describe('o que a tela monta', () => {
    it('mostra o componente da visão escolhida e o drawer só com consulta selecionada', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('app-agenda-visao-mes')).not.toBeNull();
      expect(el.querySelector('app-agenda-visao-semana')).toBeNull();
      expect(el.querySelector('app-agenda-visao-dia')).toBeNull();
      expect(el.querySelector('app-agenda-drawer')).toBeNull();

      component.tipoVisualizacao = 'semana';
      component.abrirPopover(consulta(10, '2026-11-06T09:00:00'));
      fixture.componentRef.injector.get(ChangeDetectorRef).markForCheck();
      fixture.detectChanges();
      expect(el.querySelector('app-agenda-visao-semana')).not.toBeNull();
      expect(el.querySelector('app-agenda-visao-mes')).toBeNull();
      expect(el.querySelector('app-agenda-drawer')).not.toBeNull();
    });
  });
});
