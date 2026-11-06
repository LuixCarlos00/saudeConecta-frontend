import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthService } from 'src/app/core/auth/auth.service';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { AgendaCalendarioComponent } from './agenda-calendario.component';

/**
 * Testes de caracterização da agenda: fixam o comportamento ATUAL (filtros, grade do mês,
 * semana e dia, título, navegação, helpers de status e ações do drawer) antes de a tela ser
 * quebrada em drawer e visões. Datas sempre locais, com "hoje" congelado.
 */
describe('AgendaCalendarioComponent - caracterização', () => {
  let component: AgendaCalendarioComponent;
  let notificacao: jasmine.SpyObj<any>;
  let consultaService: jasmine.SpyObj<any>;
  let acoesConsulta: jasmine.SpyObj<any>;
  let controleAcesso: jasmine.SpyObj<any>;
  let prontuarioDentista: jasmine.SpyObj<any>;
  let planejamentoApi: jasmine.SpyObj<any>;
  let relatorioService: jasmine.SpyObj<any>;
  let prontuarioState: jasmine.SpyObj<any>;
  let router: jasmine.SpyObj<any>;

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
        { provide: AuthService, useValue: { currentUser$: of(null), getCurrentUser: () => null } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    }).compileComponents();

    component = TestBed.createComponent(AgendaCalendarioComponent).componentInstance;

    notificacao = jasmine.createSpyObj('NotificacaoService', ['fire', 'mostrarCarregando']);
    notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: true }));
    consultaService = jasmine.createSpyObj('ConsultaApiService', ['alterarStatusConsulta', 'deletarConsulta', 'buscarDoDiaAtual', 'buscarDaSemanaAtual', 'buscarDoMesAtual']);
    consultaService.buscarDoDiaAtual.and.returnValue(of([]));
    consultaService.buscarDaSemanaAtual.and.returnValue(of([]));
    consultaService.buscarDoMesAtual.and.returnValue(of([]));
    acoesConsulta = jasmine.createSpyObj('AcoesConsultaService', [
      'gerarLinkWhatsApp', 'buscarProntuarioMaisRecente', 'extrairCodigoProntuario',
      'verificarPlanejamentosAssinados', 'verificarQuestionariosRespondidos',
    ]);
    controleAcesso = jasmine.createSpyObj('ControleAcessoApiService', ['isAdmin', 'isRecepcionista', 'isProfissional']);
    controleAcesso.isAdmin.and.returnValue(false);
    controleAcesso.isRecepcionista.and.returnValue(false);
    controleAcesso.isProfissional.and.returnValue(false);
    prontuarioDentista = jasmine.createSpyObj('ProntuarioDentistaApiService', ['buscarQuestionarioSaude', 'gerarLinkQuestionario']);
    planejamentoApi = jasmine.createSpyObj('PlanejamentoTerapeuticoApiService', ['gerarLinkAssinatura']);
    relatorioService = jasmine.createSpyObj('RelatorioService', ['detectarTipoProfissional', 'abrirRelatorioAdmin']);
    relatorioService.detectarTipoProfissional.and.returnValue('MEDICO');
    prontuarioState = jasmine.createSpyObj('ProntuarioStateService', ['changeConsulta']);
    router = jasmine.createSpyObj('Router', ['navigate']);

    const c = component as any;
    c.notificacao = notificacao;
    c.consultaService = consultaService;
    c.acoesConsulta = acoesConsulta;
    c.controleAcesso = controleAcesso;
    c.prontuarioDentistaApiService = prontuarioDentista;
    c.planejamentoApi = planejamentoApi;
    c.relatorioService = relatorioService;
    c.prontuarioState = prontuarioState;
    c.router = router;
  });

  afterEach(() => jasmine.clock().uninstall());

  describe('título e navegação', () => {
    it('mês: "Mês Ano"', () => {
      component.dataAtual = new Date(2026, 10, 6);
      (component as any).atualizarTitulo();
      expect(component.tituloAtual).toBe('Novembro 2026');
    });

    it('semana: do domingo ao sábado, atravessando o mês', () => {
      component.tipoVisualizacao = 'semana';
      component.dataAtual = new Date(2026, 10, 6); // sexta
      (component as any).atualizarTitulo();
      expect(component.tituloAtual).toBe('1/11 – 7/11/2026');
    });

    it('semana na virada do ano', () => {
      component.tipoVisualizacao = 'semana';
      component.dataAtual = new Date(2026, 0, 1); // quinta
      (component as any).atualizarTitulo();
      expect(component.tituloAtual).toBe('28/12 – 3/1/2026');
    });

    it('dia: "D de Mês de Ano"', () => {
      component.tipoVisualizacao = 'dia';
      component.dataAtual = new Date(2026, 2, 5);
      (component as any).atualizarTitulo();
      expect(component.tituloAtual).toBe('5 de Março de 2026');
    });

    it('mês anterior/próximo vai para o dia 1 (de 31/03 volta a fevereiro, não a março)', () => {
      component.dataAtual = new Date(2026, 2, 31);
      component.irParaAnterior();
      expect(component.dataAtual).toEqual(new Date(2026, 1, 1));
      component.irParaProximo();
      component.irParaProximo();
      expect(component.dataAtual).toEqual(new Date(2026, 3, 1));
    });

    it('semana anda 7 dias e dia anda 1, atravessando mês e ano', () => {
      component.tipoVisualizacao = 'semana';
      component.dataAtual = new Date(2026, 0, 3);
      component.irParaAnterior();
      expect(component.dataAtual).toEqual(new Date(2025, 11, 27));
      component.tipoVisualizacao = 'dia';
      component.dataAtual = new Date(2026, 0, 1);
      component.irParaAnterior();
      expect(component.dataAtual).toEqual(new Date(2025, 11, 31));
      component.irParaProximo();
      component.irParaProximo();
      expect(component.dataAtual).toEqual(new Date(2026, 0, 2));
    });

    it('navegar recarrega as consultas com a data local de referência', () => {
      component.dataAtual = new Date(2026, 10, 6);
      component.irParaProximo();
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
  });

  describe('grade do mês', () => {
    function gerarMes(ano: number, mes: number, consultas: any[] = []): void {
      component.tipoVisualizacao = 'mes';
      component.dataAtual = new Date(ano, mes, 1);
      component.consultasFiltradas = consultas;
      component.gerarCalendario();
    }

    it('sempre 42 células; novembro de 2026 (começa no domingo) não tem dias do mês anterior', () => {
      gerarMes(2026, 10);
      expect(component.diasCalendario.length).toBe(42);
      expect(component.diasCalendario[0].data).toEqual(new Date(2026, 10, 1));
      expect(component.diasCalendario[0].mesAtual).toBeTrue();
      expect(component.diasCalendario[30].data).toEqual(new Date(2026, 11, 1));
      expect(component.diasCalendario[30].mesAtual).toBeFalse();
    });

    it('janeiro de 2026 (começa na quinta) completa com 4 dias de dezembro', () => {
      gerarMes(2026, 0);
      expect(component.diasCalendario.slice(0, 4).map(d => d.data.getDate())).toEqual([28, 29, 30, 31]);
      expect(component.diasCalendario.slice(0, 4).every(d => !d.mesAtual)).toBeTrue();
      expect(component.diasCalendario[4].data).toEqual(new Date(2026, 0, 1));
      expect(component.diasCalendario.filter(d => d.mesAtual).length).toBe(31);
    });

    it('fevereiro bissexto de 2028 tem 29 dias no mês', () => {
      gerarMes(2028, 1);
      expect(component.diasCalendario.filter(d => d.mesAtual).length).toBe(29);
    });

    it('só o dia de hoje (dentro do mês) é marcado como hoje', () => {
      gerarMes(2026, 10);
      const hojes = component.diasCalendario.filter(d => d.hoje);
      expect(hojes.length).toBe(1);
      expect(hojes[0].data).toEqual(new Date(2026, 10, 6));
    });

    it('as consultas caem no dia local, inclusive nos dias de fora do mês', () => {
      gerarMes(2026, 10, [
        consulta(1, '2026-11-06T09:00:00'),
        consulta(2, '2026-11-06T23:30:00'),
        consulta(3, '2026-12-01T08:00:00'),
      ]);
      const dia6 = component.diasCalendario.find(d => d.mesAtual && d.data.getDate() === 6)!;
      expect(dia6.consultas.map(c => c.id)).toEqual([1, 2]);
      const dezembro1 = component.diasCalendario.find(d => !d.mesAtual && d.data.getDate() === 1)!;
      expect(dezembro1.consultas.map(c => c.id)).toEqual([3]);
    });

    it('mês vazio: nenhuma consulta em nenhuma célula', () => {
      gerarMes(2026, 10);
      expect(component.diasCalendario.every(d => d.consultas.length === 0)).toBeTrue();
    });
  });

  describe('grade da semana', () => {
    it('7 dias de domingo a sábado, atravessando a virada de ano', () => {
      component.tipoVisualizacao = 'semana';
      component.dataAtual = new Date(2026, 0, 1);
      component.consultasFiltradas = [consulta(1, '2025-12-29T09:00:00'), consulta(2, '2026-01-03T09:00:00')];
      component.gerarCalendario();
      expect(component.diasSemana.map(d => formatar(d.data))).toEqual([
        '2025-12-28', '2025-12-29', '2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02', '2026-01-03',
      ]);
      expect(component.diasSemana[1].consultas.map(c => c.id)).toEqual([1]);
      expect(component.diasSemana[6].consultas.map(c => c.id)).toEqual([2]);
    });

    it('marca o dia de hoje', () => {
      component.tipoVisualizacao = 'semana';
      component.dataAtual = new Date(2026, 10, 6);
      component.gerarCalendario();
      expect(component.diasSemana.filter(d => d.hoje).map(d => formatar(d.data))).toEqual(['2026-11-06']);
    });

    function formatar(d: Date): string {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  });

  describe('grade do dia', () => {
    it('13 horas, de 07:00 a 19:00, com as consultas na hora certa', () => {
      component.tipoVisualizacao = 'dia';
      component.dataAtual = new Date(2026, 10, 6);
      component.consultasFiltradas = [
        consulta(1, '2026-11-06T07:15:00'),
        consulta(2, '2026-11-06T07:45:00'),
        consulta(3, '2026-11-06T19:00:00'),
        consulta(4, '2026-11-06T20:00:00'),
        consulta(5, '2026-11-07T07:00:00'),
      ];
      component.gerarCalendario();
      expect(component.horasDia.length).toBe(13);
      expect(component.horasDia[0].label).toBe('07:00');
      expect(component.horasDia[12].label).toBe('19:00');
      expect(component.horasDia[0].consultas.map(c => c.id)).toEqual([1, 2]);
      expect(component.horasDia[12].consultas.map(c => c.id)).toEqual([3]);
      expect(component.horasDia.reduce((s, h) => s + h.consultas.length, 0)).toBe(3);
    });
  });

  describe('filtros', () => {
    const todas = [
      consulta(1, '2026-11-06T09:00:00', { status: 'AGENDADA', profissionalId: 1, especialidadeNome: 'Cardiologia', pacienteNome: 'Maria Souza' }),
      consulta(2, '2026-11-06T10:00:00', { status: 'CONFIRMADA', profissionalId: 2, profissionalNome: 'Dr. Bruno', especialidadeNome: 'Dermatologia', pacienteNome: 'João Lima' }),
      consulta(3, '2026-11-06T11:00:00', { status: 'REALIZADA', profissionalId: 1, pacienteNome: 'Ana MARIA' }),
      consulta(4, '2026-11-06T12:00:00', { status: 'CANCELADA', profissionalId: 2, profissionalNome: 'Dr. Bruno', pacienteNome: 'Carlos' }),
      consulta(5, '2026-11-06T13:00:00', { status: 'PAGO', pacienteNome: 'Carlos' }),
      consulta(6, '2026-11-06T14:00:00', { status: 'FALTOU', pacienteNome: 'Carlos' }),
    ];

    beforeEach(() => { component.todasConsultas = todas; });

    const ids = () => component.consultasFiltradas.map(c => c.id);

    it('por padrão mostra só agendadas e confirmadas', () => {
      component.aplicarFiltros();
      expect(ids()).toEqual([1, 2]);
    });

    it('"finalizadas" mostra realizada, paga e cancelada (faltou nunca aparece)', () => {
      component.definirTipoConsulta(true);
      expect(ids()).toEqual([3, 4, 5]);
    });

    it('trocar o tipo limpa os status selecionados', () => {
      component.filtroStatusSelecionados = ['AGENDADA'];
      component.definirTipoConsulta(true);
      expect(component.filtroStatusSelecionados).toEqual([]);
    });

    it('status selecionado restringe dentro do tipo', () => {
      component.toggleStatus('CONFIRMADA');
      expect(ids()).toEqual([2]);
      component.toggleStatus('CONFIRMADA');
      expect(component.filtroStatusSelecionados).toEqual([]);
      expect(ids()).toEqual([1, 2]);
    });

    it('profissional (id vindo do select como texto)', () => {
      component.filtroProfissional = '2';
      component.aplicarFiltros();
      expect(ids()).toEqual([2]);
    });

    it('especialidade', () => {
      component.filtroEspecialidade = 'Dermatologia';
      component.aplicarFiltros();
      expect(ids()).toEqual([2]);
    });

    it('busca por paciente ignora maiúsculas e minúsculas', () => {
      component.filtroFinalizadas = true;
      component.filtroBusca = 'maria';
      component.aplicarFiltros();
      expect(ids()).toEqual([3]);
      component.filtroFinalizadas = false;
      component.aplicarFiltros();
      expect(ids()).toEqual([1]);
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

    it('a legenda segue o tipo: agendadas ou finalizadas', () => {
      expect(component.legendaAtual.map(s => s.value)).toEqual(['AGENDADA', 'CONFIRMADA']);
      component.filtroFinalizadas = true;
      expect(component.legendaAtual.map(s => s.value)).toEqual(['REALIZADA', 'CANCELADA', 'PAGO']);
    });

    it('as opções de profissional e especialidade vêm das consultas carregadas', () => {
      consultaService.buscarDoMesAtual.and.returnValue(of(todas));
      component.carregarConsultas();
      expect(component.profissionaisDisponiveis).toEqual([{ id: 1, nome: 'Dra. Ana' }, { id: 2, nome: 'Dr. Bruno' }]);
      expect(component.especialidadesDisponiveis).toEqual(['Cardiologia', 'Dermatologia']);
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
  });

  describe('helpers', () => {
    it('classe de status; desconhecido vira vazio', () => {
      expect(component.getStatusClass('AGENDADA')).toBe('status-agendada');
      expect(component.getStatusClass('REMARCADA')).toBe('status-remarcada');
      expect(component.getStatusClass('XPTO')).toBe('');
    });

    it('horário local HH:mm; vazio devolve vazio', () => {
      expect(component.getHorario('2026-11-06T09:05:00')).toBe('09:05');
      expect(component.getHorario('')).toBe('');
    });

    it('etapa concluída segue a ordem agendada, confirmada, realizada, paga', () => {
      expect(component.isStatusDone('AGENDADA', 'CONFIRMADA')).toBeTrue();
      expect(component.isStatusDone('AGENDADA', 'AGENDADA')).toBeFalse();
      expect(component.isStatusDone('REALIZADA', 'PAGO')).toBeTrue();
      expect(component.isStatusDone('CONFIRMADA', 'AGENDADA')).toBeFalse();
      expect(component.isStatusDone('AGENDADA', 'CANCELADA')).toBeFalse();
    });

    it('só admin e recepção veem todos os profissionais', () => {
      expect(component.podeVerTodosProfissionais()).toBeFalse();
      controleAcesso.isRecepcionista.and.returnValue(true);
      expect(component.podeVerTodosProfissionais()).toBeTrue();
    });

    it('editar: só admin edita agendada/confirmada; confirmada é bloqueada para admin e profissional', () => {
      controleAcesso.isAdmin.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeTrue();
      expect(component.podeEditarConsulta('CONFIRMADA')).toBeFalse();
      expect(component.podeEditarConsulta('REALIZADA')).toBeFalse();
      controleAcesso.isAdmin.and.returnValue(false);
      controleAcesso.isProfissional.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeFalse();
      expect(component.podeEditarConsulta('CONFIRMADA')).toBeFalse();
      controleAcesso.isProfissional.and.returnValue(false);
      controleAcesso.isRecepcionista.and.returnValue(true);
      expect(component.podeEditarConsulta('AGENDADA')).toBeFalse();
    });

    it('podeEditar (consulta): só AGENDADA', () => {
      expect(component.podeEditar({ status: 'AGENDADA' } as any)).toBeTrue();
      expect(component.podeEditar({ status: 'CONFIRMADA' } as any)).toBeFalse();
    });
  });

  describe('ações do drawer', () => {
    beforeEach(() => {
      component.consultaSelecionada = consulta(10, '2026-11-06T09:00:00', { status: 'AGENDADA', pacienteNome: 'Maria' });
      component.popoverAberto = true;
    });

    it('fechar: fecha na hora e solta a consulta só depois da animação (300 ms)', () => {
      component.fecharPopover();
      expect(component.popoverAberto).toBeFalse();
      expect(component.consultaSelecionada).not.toBeNull();
      jasmine.clock().tick(300);
      expect(component.consultaSelecionada).toBeNull();
    });

    it('alterar status para o mesmo status não chama o back', () => {
      component.alterarStatusDrawer('AGENDADA');
      expect(consultaService.alterarStatusConsulta).not.toHaveBeenCalled();
    });

    it('alterar status: avisa, fecha o drawer, recarrega e limpa o aviso em 3 s', () => {
      consultaService.alterarStatusConsulta.and.returnValue(of({}));
      component.alterarStatusDrawer('CONFIRMADA');
      expect(consultaService.alterarStatusConsulta).toHaveBeenCalledWith(10, 'CONFIRMADA');
      expect(component.mensagemTooltipStatus).toBe('Status alterado para Confirmada');
      expect(component.popoverAberto).toBeFalse();
      expect(consultaService.buscarDoMesAtual).toHaveBeenCalled();
      jasmine.clock().tick(3000);
      expect(component.mensagemTooltipStatus).toBe('');
    });

    it('alterar status com erro mostra a mensagem do back (ou a padrão)', () => {
      consultaService.alterarStatusConsulta.and.returnValue(throwError(() => ({ error: { message: 'Sem permissão' } })));
      component.alterarStatusDrawer('CONFIRMADA');
      expect(component.mensagemTooltipStatus).toBeTruthy();
      jasmine.clock().tick(3000);
      expect(component.mensagemTooltipStatus).toBe('');
    });

    it('excluir: pede confirmação e só chama o back se confirmar', async () => {
      notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: false }));
      component.deletarConsultaDrawer();
      await Promise.resolve();
      expect(consultaService.deletarConsulta).not.toHaveBeenCalled();
    });

    it('excluir confirmado: deleta, avisa, fecha e recarrega', async () => {
      consultaService.deletarConsulta.and.returnValue(of({}));
      component.deletarConsultaDrawer();
      await Promise.resolve();
      await Promise.resolve();
      expect(consultaService.deletarConsulta).toHaveBeenCalledWith(10);
      expect(notificacao.fire).toHaveBeenCalledWith('Deletado', 'Consulta deletada com sucesso.', 'success');
      expect(component.popoverAberto).toBeFalse();
    });

    it('excluir com prontuário (409) é bloqueado com aviso informativo', async () => {
      consultaService.deletarConsulta.and.returnValue(throwError(() => ({ status: 409 })));
      component.deletarConsultaDrawer();
      await Promise.resolve();
      await Promise.resolve();
      expect(notificacao.fire).toHaveBeenCalledWith('Exclusão bloqueada', jasmine.stringMatching('prontuário clínico'), 'info');
    });

    it('imprimir fecha o drawer e abre o relatório depois de 100 ms', () => {
      const c = component.consultaSelecionada!;
      component.abrirImpressaoDrawer();
      expect(relatorioService.abrirRelatorioAdmin).not.toHaveBeenCalled();
      jasmine.clock().tick(100);
      expect(relatorioService.abrirRelatorioAdmin).toHaveBeenCalledWith(c);
    });

    it('WhatsApp vem do AcoesConsultaService', () => {
      acoesConsulta.gerarLinkWhatsApp.and.returnValue('https://wa.me/55');
      expect(component.gerarWhatsAppDrawer()).toBe('https://wa.me/55');
      expect(acoesConsulta.gerarLinkWhatsApp).toHaveBeenCalledWith(component.consultaSelecionada);
    });

    describe('iniciar atendimento', () => {
      beforeEach(() => {
        component.consultaSelecionada = consulta(10, '2026-11-06T09:00:00', { status: 'CONFIRMADA' });
        component.UsuarioLogado = { id: 1, perfil: 'CLINICO', tipoProfissional: 'MEDICO' } as any;
      });

      it('sem rascunho: "Iniciar Atendimento"', () => {
        component.iniciarConsultaDrawer();
        jasmine.clock().tick(300);
        const args = notificacao.fire.calls.argsFor(0)[0];
        expect(args.title).toBe('Iniciar Atendimento');
        expect(args.confirmButtonText).toContain('Iniciar Atendimento');
        expect(args.html).toContain('iniciar o atendimento');
      });

      it('com rascunho: "Retomar Atendimento"', () => {
        component.consultasComRascunho = new Set([10]);
        component.iniciarConsultaDrawer();
        jasmine.clock().tick(300);
        const args = notificacao.fire.calls.argsFor(0)[0];
        expect(args.title).toBe('Retomar Atendimento');
        expect(args.confirmButtonText).toContain('Retomar Atendimento');
        expect(args.html).toContain('retomar o atendimento');
      });

      it('médico confirmado vai para startconsulta e guarda a consulta no estado', async () => {
        const selecionada = component.consultaSelecionada;
        component.iniciarConsultaDrawer();
        jasmine.clock().tick(300);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(prontuarioState.changeConsulta).toHaveBeenCalledWith(selecionada as any);
        expect(router.navigate).toHaveBeenCalledWith(['startconsulta', 10]);
      });

      it('dentista vai para startconsulta-dentista', async () => {
        component.UsuarioLogado = { id: 1, perfil: 'CLINICO', tipoProfissional: 'DENTISTA' } as any;
        component.iniciarConsultaDrawer();
        jasmine.clock().tick(300);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        expect(router.navigate).toHaveBeenCalledWith(['startconsulta-dentista', 10]);
      });

      it('cancelar não navega', async () => {
        notificacao.fire.and.returnValue(Promise.resolve({ isConfirmed: false }));
        component.iniciarConsultaDrawer();
        jasmine.clock().tick(300);
        await Promise.resolve();
        await Promise.resolve();
        expect(router.navigate).not.toHaveBeenCalled();
      });
    });

    describe('questionário de saúde', () => {
      it('já respondido: marca como respondido e não gera link', () => {
        prontuarioDentista.buscarQuestionarioSaude.and.returnValue(of({ respondido: true }));
        component.gerarLinkQuestionarioDrawer();
        expect(component.questionariosRespondidos.has(10)).toBeTrue();
        expect(prontuarioDentista.gerarLinkQuestionario).not.toHaveBeenCalled();
      });

      it('não respondido: gera o link, copia e mostra o aviso por 3 s', async () => {
        const copiar = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
        spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: copiar } as any);
        prontuarioDentista.buscarQuestionarioSaude.and.returnValue(of({ respondido: false }));
        prontuarioDentista.gerarLinkQuestionario.and.returnValue(of({ token: 'abc' }));
        component.gerarLinkQuestionarioDrawer();
        await Promise.resolve();
        expect(copiar).toHaveBeenCalledWith(`${window.location.origin}/#/questionario-saude/abc`);
        expect(component.mensagemTooltipQuestionario).toBe('Link copiado para a área de transferência!');
        jasmine.clock().tick(3000);
        expect(component.mensagemTooltipQuestionario).toBe('');
      });

      it('falha ao consultar o questionário ainda tenta gerar o link; falha ao gerar mostra erro', () => {
        prontuarioDentista.buscarQuestionarioSaude.and.returnValue(throwError(() => ({})));
        prontuarioDentista.gerarLinkQuestionario.and.returnValue(throwError(() => ({})));
        component.gerarLinkQuestionarioDrawer();
        expect(prontuarioDentista.gerarLinkQuestionario).toHaveBeenCalledWith(10);
        expect(component.mensagemTooltipQuestionario).toBe('Erro ao gerar link');
      });
    });

    describe('planejamento terapêutico', () => {
      beforeEach(() => {
        component.consultaSelecionada = consulta(10, '2026-11-06T09:00:00', { status: 'REALIZADA' });
      });

      it('sem prontuário: aviso', () => {
        acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({}));
        acoesConsulta.extrairCodigoProntuario.and.returnValue(null);
        component.gerarLinkPlanejamentoDrawer();
        expect(notificacao.fire).toHaveBeenCalledWith('Aviso', 'Nenhum prontuário encontrado para esta consulta.', 'warning');
        expect(planejamentoApi.gerarLinkAssinatura).not.toHaveBeenCalled();
      });

      it('tudo assinado: marca como assinado e avisa, sem gerar link', () => {
        acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({ planejamentosTerapeuticos: [{ statusAssinatura: 'ASSINADO' }] }));
        acoesConsulta.extrairCodigoProntuario.and.returnValue(55);
        component.gerarLinkPlanejamentoDrawer();
        expect(component.planejamentosAssinados.has(10)).toBeTrue();
        expect(planejamentoApi.gerarLinkAssinatura).not.toHaveBeenCalled();
      });

      it('pendente: gera o link com o tipo do profissional e mostra o link', () => {
        spyOnProperty(navigator, 'clipboard', 'get').and.returnValue({ writeText: () => Promise.resolve() } as any);
        acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(of({ planejamentos: [{ statusAssinatura: 'PENDENTE' }] }));
        acoesConsulta.extrairCodigoProntuario.and.returnValue(55);
        planejamentoApi.gerarLinkAssinatura.and.returnValue(of({ token: 'tok' }));
        component.gerarLinkPlanejamentoDrawer();
        expect(planejamentoApi.gerarLinkAssinatura).toHaveBeenCalledWith(55, 'MEDICO');
        const args = notificacao.fire.calls.mostRecent().args[0];
        expect(args.title).toBe('Link Gerado!');
        expect(args.html).toContain(`${window.location.origin}/#/assinatura-planejamento/tok`);
      });

      it('erro ao buscar o prontuário avisa', () => {
        acoesConsulta.buscarProntuarioMaisRecente.and.returnValue(throwError(() => ({})));
        component.gerarLinkPlanejamentoDrawer();
        expect(notificacao.fire).toHaveBeenCalledWith('Erro', 'Não foi possível buscar o prontuário desta consulta.', 'error');
      });
    });
  });

  describe('retomar atendimento', () => {
    it('temRascunho só é verdadeiro para consulta com rascunho salvo', () => {
      component.consultasComRascunho = new Set([822]);
      expect(component.temRascunho({ id: 822 } as any)).toBeTrue();
      expect(component.temRascunho({ id: 1 } as any)).toBeFalse();
      expect(component.temRascunho(null)).toBeFalse();
      expect(component.temRascunho(undefined)).toBeFalse();
    });
  });
});
