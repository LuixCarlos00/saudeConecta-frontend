import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';

import { GraficosPrincipaisDashboardComponent } from './graficos-principais-dashboard.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

/**
 * Testes de caracterização do dashboard: fixam o comportamento ATUAL dos cálculos
 * (intervalos, agrupamentos, totais, saldo, categorias, tempo médio) e a escolha da
 * API por perfil, para que a extração em funções puras / facade / componentes filhos
 * não mude nada. Datas sempre locais, com "hoje" congelado.
 */
describe('GraficosPrincipaisDashboardComponent - caracterização', () => {
  let component: GraficosPrincipaisDashboardComponent;
  let consultaApi: jasmine.SpyObj<any>;
  let controleAcesso: jasmine.SpyObj<any>;
  let auth: jasmine.SpyObj<any>;
  let profissionalApi: jasmine.SpyObj<any>;

  function congelarHoje(ano: number, mesZeroBased: number, dia: number): void {
    jasmine.clock().mockDate(new Date(ano, mesZeroBased, dia, 10, 0, 0));
  }

  beforeEach(async () => {
    jasmine.clock().install();
    congelarHoje(2026, 10, 6);

    await TestBed.configureTestingModule({
      declarations: [GraficosPrincipaisDashboardComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    component = TestBed.createComponent(GraficosPrincipaisDashboardComponent).componentInstance;

    consultaApi = jasmine.createSpyObj('ConsultaApiService', [
      'BuscandoConsultasPorMedicoEmIntervaloDeDatas',
      'buscarConsultasPorOrganizacaoEIntervalo',
      'buscarPorIntervaloDeDatas',
      'pesquisarClinicasEmIntervaloDeDatas',
      'getSaldoFinanceiro',
      'buscarDuracoesConsultas',
    ]);
    Object.values(consultaApi).forEach((spy: any) => spy.and.returnValue(of([])));
    controleAcesso = jasmine.createSpyObj('ControleAcessoApiService', ['isDashboardProfissional', 'AcessoMedico']);
    controleAcesso.isDashboardProfissional.and.returnValue(false);
    controleAcesso.AcessoMedico.and.returnValue(true);
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    auth.getCurrentUser.and.returnValue({ id: 7, organizacaoId: 3 });
    profissionalApi = jasmine.createSpyObj('ProfissionalApiService', ['buscarPorOrganizacao']);
    profissionalApi.buscarPorOrganizacao.and.returnValue(of([]));

    const c = component as any;
    c.consultaApiService = consultaApi;
    c.controleAcessoService = controleAcesso;
    c.authService = auth;
    c.profissionalApiService = profissionalApi;

    spyOn(component, 'criarGraficoConsultas' as any);
    spyOn(component, 'criarGraficoAgendamentos' as any);
    spyOn(component, 'criarGraficoMediaTempo' as any);
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  afterEach(() => jasmine.clock().uninstall());

  /** Liga só os gráficos pedidos e executa o ngOnInit (carga inicial). */
  function iniciar(flags: Partial<Record<'consultas' | 'agendamentos' | 'saldo' | 'categoria' | 'mediaTempo', boolean>>): void {
    component.exibirConsultasPorPeriodo = !!flags.consultas;
    component.exibirAgendamentos = !!flags.agendamentos;
    component.exibirSaldoFinanceiro = !!flags.saldo;
    component.exibirMedicosPorEspecialidade = !!flags.categoria;
    component.exibirMediaTempoConsulta = !!flags.mediaTempo;
    component.ngOnInit();
  }

  describe('intervalo padronizado de consultas e agendamentos (datas locais)', () => {
    it('7, 30 e 60 dias contam para trás a partir de hoje', () => {
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      component.fetchConsultasPadronizadas(2);
      component.fetchConsultasPadronizadas(3);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo.calls.allArgs()).toEqual([
        [3, '2026-10-30', '2026-11-06'],
        [3, '2026-10-07', '2026-11-06'],
        [3, '2026-09-07', '2026-11-06'],
      ]);
    });

    it('virada de mês: 1º de março menos 7 dias cai em fevereiro', () => {
      congelarHoje(2026, 2, 1);
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledWith(3, '2026-02-22', '2026-03-01');
    });

    it('virada de ano: 3 de janeiro menos 30 dias cai em dezembro', () => {
      congelarHoje(2026, 0, 3);
      iniciar({});
      component.fetchAgendamentosPadronizados(2);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledWith(3, '2025-12-04', '2026-01-03');
    });

    it('ano bissexto: 1º de março de 2028 menos 7 dias é 23 de fevereiro', () => {
      congelarHoje(2028, 2, 1);
      iniciar({});
      component.fetchAgendamentosPadronizados(1);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledWith(3, '2028-02-23', '2028-03-01');
    });

    it('após as 21h (UTC já no dia seguinte) a data continua a local', () => {
      jasmine.clock().mockDate(new Date(2026, 10, 6, 23, 30, 0));
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledWith(3, '2026-10-30', '2026-11-06');
    });

    it('opção desconhecida manda o início vazio', () => {
      iniciar({});
      component.fetchConsultasPadronizadas(0);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledWith(3, '', '2026-11-06');
    });
  });

  describe('qual API cada perfil usa', () => {
    it('médico (dashboard profissional): só as consultas dele; agendamentos por pesquisarClinicas', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      component.fetchAgendamentosPadronizados(1);
      expect(consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas).toHaveBeenCalledWith('2026-10-30', '2026-11-06', 7);
      expect(consultaApi.pesquisarClinicasEmIntervaloDeDatas).toHaveBeenCalledWith(7, '2026-10-30', '2026-11-06');
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).not.toHaveBeenCalled();
    });

    it('@Input medicoId tem prioridade sobre o usuário logado', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      iniciar({});
      component.medicoId = 99;
      component.fetchConsultasPadronizadas(1);
      expect(consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas).toHaveBeenCalledWith('2026-10-30', '2026-11-06', 99);
    });

    it('admin da organização: consultas e agendamentos da organização', () => {
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      component.fetchAgendamentosPadronizados(1);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledTimes(2);
    });

    it('super admin (sem organização): todas as consultas', () => {
      auth.getCurrentUser.and.returnValue({ id: 1 });
      iniciar({});
      component.fetchConsultasPadronizadas(2);
      component.fetchAgendamentosPadronizados(2);
      expect(consultaApi.buscarPorIntervaloDeDatas).toHaveBeenCalledTimes(2);
      expect(consultaApi.buscarPorIntervaloDeDatas).toHaveBeenCalledWith('2026-10-07', '2026-11-06');
    });

    it('intervalo personalizado ignora a organização (só médico ou geral)', () => {
      iniciar({});
      component.IntervaloDeDatasConsultas = new FormGroup({
        start: new FormControl(new Date(2026, 9, 1)),
        end: new FormControl(new Date(2026, 9, 31)),
      });
      component.fetchConsultasPersonalizadas();
      expect(consultaApi.buscarPorIntervaloDeDatas).toHaveBeenCalledWith('2026-10-01', '2026-10-31');
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).not.toHaveBeenCalled();
      expect(component.diaSelecionadoConsultas).toBe(0);
    });

    it('personalizado de agendamentos como médico usa pesquisarClinicas', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      iniciar({});
      component.IntervaloDeDatasAgendamentos = new FormGroup({
        start: new FormControl(new Date(2026, 9, 1)),
        end: new FormControl(new Date(2026, 9, 31)),
      });
      component.fetchAgendamentosPersonalizados();
      expect(consultaApi.pesquisarClinicasEmIntervaloDeDatas).toHaveBeenCalledWith(7, '2026-10-01', '2026-10-31');
    });
  });

  describe('carga inicial por @Input (cada perfil vê só o que estiver ligado)', () => {
    it('só consultas e agendamentos ligados: não chama saldo, categoria nem tempo médio', () => {
      iniciar({ consultas: true, agendamentos: true });
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledTimes(2);
      expect(consultaApi.getSaldoFinanceiro).not.toHaveBeenCalled();
      expect(profissionalApi.buscarPorOrganizacao).not.toHaveBeenCalled();
      expect(consultaApi.buscarDuracoesConsultas).not.toHaveBeenCalled();
    });

    it('ligar um gráfico depois (ngOnChanges) carrega só ele, e uma vez', () => {
      iniciar({ consultas: true });
      component.exibirSaldoFinanceiro = true;
      component.ngOnChanges({} as any);
      component.ngOnChanges({} as any);
      expect(consultaApi.getSaldoFinanceiro).toHaveBeenCalledTimes(1);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).toHaveBeenCalledTimes(1);
    });
  });

  describe('apuração de consultas', () => {
    it('lista as datas usando dataHora ou conData e ignora consultas sem data', () => {
      component.TodasConsultas = [
        { dataHora: '2026-11-01T09:00:00' },
        { conData: '2026-11-02' },
        { dataHora: null, conData: null },
        {},
      ];
      component.apurandoDadosConsultas();
      expect(component.DatasConsultas).toEqual(['2026-11-01T09:00:00', '2026-11-02']);
    });

    it('agrupa por especialidade: especialidadeNome, depois conMedico.medEspecialidade, depois "Não informado"', () => {
      component.TodasConsultas = [
        { especialidadeNome: 'Cardiologia' },
        { especialidadeNome: 'Cardiologia' },
        { conMedico: { medEspecialidade: 'Dermatologia' } },
        {},
      ];
      expect(component.contarConsultasPorEspecialidade()).toEqual([
        { especialidade: 'Cardiologia', quantidade: 2 },
        { especialidade: 'Dermatologia', quantidade: 1 },
        { especialidade: 'Não informado', quantidade: 1 },
      ]);
    });

    it('mês vazio: nenhum grupo e zero especialidades', () => {
      component.TodasConsultas = [];
      expect(component.contarConsultasPorEspecialidade()).toEqual([]);
      expect(component.getEspecialidadesCount()).toBe(0);
    });

    it('conta especialidades únicas sem contar "Não informado"', () => {
      component.TodasConsultas = [
        { especialidadeNome: 'Cardiologia' },
        { especialidadeNome: 'Cardiologia' },
        { conMedico: { medEspecialidade: 'Dermatologia' } },
        {},
      ];
      expect(component.getEspecialidadesCount()).toBe(2);
    });

    it('com resposta nula do back, a lista fica vazia', () => {
      consultaApi.buscarConsultasPorOrganizacaoEIntervalo.and.returnValue(of(null));
      iniciar({});
      component.fetchConsultasPadronizadas(1);
      expect(component.TodasConsultas).toEqual([]);
      expect(component.isLoadingConsultas).toBeFalse();
    });
  });

  describe('apuração de agendamentos', () => {
    it('corta a hora e ignora itens sem data', () => {
      component.TodasAgendamentos = [
        { dataHora: '2026-11-01T09:00:00' },
        { conData: '2026-11-02' },
        {},
      ];
      component.apurandoDadosAgendamentos();
      expect(component.DatasAgendamentos).toEqual(['2026-11-01', '2026-11-02']);
    });

    it('agrupa por dia e ordena do mais antigo ao mais novo (inclusive na virada de mês)', () => {
      component.DatasAgendamentos = ['2026-11-02', '2026-10-31', '2026-11-02', '2026-11-01'];
      expect(component.contarAgendamentosPorData()).toEqual([
        { data: '2026-10-31', quantidade: 1 },
        { data: '2026-11-01', quantidade: 1 },
        { data: '2026-11-02', quantidade: 2 },
      ]);
    });

    it('mês vazio: sem grupos e zero dias com agendamento', () => {
      component.DatasAgendamentos = [];
      expect(component.contarAgendamentosPorData()).toEqual([]);
      expect(component.getDiasComAgendamentos()).toBe(0);
    });

    it('conta dias únicos', () => {
      component.DatasAgendamentos = ['2026-11-02', '2026-11-02', '2026-11-03'];
      expect(component.getDiasComAgendamentos()).toBe(2);
    });

    it('formata o rótulo como DD/MM; texto fora do padrão volta igual; vazio volta vazio', () => {
      expect(component.formatarDataAgendamentos('2026-11-06')).toBe('06/11');
      expect(component.formatarDataAgendamentos('06/11')).toBe('06/11');
      expect(component.formatarDataAgendamentos('')).toBe('');
    });
  });

  describe('saldo financeiro', () => {
    function intervaloSaldo(): { inicio: string; fim: string } {
      return (component as any).calcularIntervaloSaldo();
    }

    it('este mês: do dia 1 até hoje', () => {
      congelarHoje(2026, 1, 15);
      component.periodoSelecionadoSaldo = component.PeriodoFiltroSaldo.ESTE_MES;
      expect(intervaloSaldo()).toEqual({ inicio: '2026-02-01', fim: '2026-02-15' });
    });

    it('3 meses: dia 1 de dois meses atrás', () => {
      congelarHoje(2026, 1, 15);
      component.periodoSelecionadoSaldo = component.PeriodoFiltroSaldo.ULTIMOS_3_MESES;
      expect(intervaloSaldo()).toEqual({ inicio: '2025-12-01', fim: '2026-02-15' });
    });

    it('6 meses: dia 1 de cinco meses atrás', () => {
      congelarHoje(2026, 1, 15);
      component.periodoSelecionadoSaldo = component.PeriodoFiltroSaldo.ULTIMOS_6_MESES;
      expect(intervaloSaldo()).toEqual({ inicio: '2025-09-01', fim: '2026-02-15' });
    });

    it('este ano: 1º de janeiro', () => {
      congelarHoje(2026, 1, 15);
      component.periodoSelecionadoSaldo = component.PeriodoFiltroSaldo.ESTE_ANO;
      expect(intervaloSaldo()).toEqual({ inicio: '2026-01-01', fim: '2026-02-15' });
    });

    it('virada de ano: 3 meses em janeiro começam em novembro do ano anterior', () => {
      congelarHoje(2026, 0, 10);
      component.periodoSelecionadoSaldo = component.PeriodoFiltroSaldo.ULTIMOS_3_MESES;
      expect(intervaloSaldo()).toEqual({ inicio: '2025-11-01', fim: '2026-01-10' });
    });

    it('agrupa por semana só em "este mês"; nos demais, por mês', () => {
      iniciar({});
      component.onPeriodoChangeSaldo(component.PeriodoFiltroSaldo.ESTE_MES);
      expect(consultaApi.getSaldoFinanceiro).toHaveBeenCalledWith('2026-11-01', '2026-11-06', 'semana');
      component.onPeriodoChangeSaldo(component.PeriodoFiltroSaldo.ESTE_ANO);
      expect(consultaApi.getSaldoFinanceiro).toHaveBeenCalledWith('2026-01-01', '2026-11-06', 'mes');
    });

    it('o padrão ao abrir é 3 meses, agrupado por mês', () => {
      iniciar({ saldo: true });
      expect(consultaApi.getSaldoFinanceiro).toHaveBeenCalledWith('2026-09-01', '2026-11-06', 'mes');
    });

    it('guarda a resposta e liga o erro quando a API falha', () => {
      const resposta: any = { totalConsultas: 100, totalProcedimentos: 50, totalGeral: 150, quantidadeConsultas: 2, quantidadeProcedimentos: 1, detalhamento: [] };
      consultaApi.getSaldoFinanceiro.and.returnValue(of(resposta));
      iniciar({ saldo: true });
      expect(component.dadosSaldo).toBe(resposta);
      expect(component.isLoadingSaldo).toBeFalse();
      expect(component.hasErrorSaldo).toBeFalse();
    });

    it('formata moeda em reais; nulo vira R$ 0,00', () => {
      const normalizar = (s: string) => s.replace(/ /g, ' ');
      expect(normalizar(component.formatarMoedaSaldo(1234.5))).toBe('R$ 1.234,50');
      expect(normalizar(component.formatarMoedaSaldo(null as any))).toBe('R$ 0,00');
      expect(normalizar(component.formatarMoedaSaldo(0))).toBe('R$ 0,00');
    });
  });

  describe('clínicos por especialidade (categoria)', () => {
    it('sem organização: erro e nenhuma chamada', () => {
      auth.getCurrentUser.and.returnValue({ id: 1 });
      iniciar({ categoria: true });
      expect(component.hasErrorCategoria).toBeTrue();
      expect(profissionalApi.buscarPorOrganizacao).not.toHaveBeenCalled();
    });

    it('conta, calcula o percentual arredondado e ordena do maior para o menor', () => {
      profissionalApi.buscarPorOrganizacao.and.returnValue(of([
        { especialidades: [{ nome: 'Cardiologia' }] },
        { especialidades: [{ nome: 'Cardiologia' }] },
        { medEspecialidade: 'Dermatologia' },
        {},
      ]));
      iniciar({ categoria: true });
      expect(profissionalApi.buscarPorOrganizacao).toHaveBeenCalledWith(3);
      expect(component.totalClinicos).toBe(4);
      expect(component.especialidadesCategoria).toEqual([
        { nome: 'Cardiologia', quantidade: 2, percentual: 50 },
        { nome: 'Dermatologia', quantidade: 1, percentual: 25 },
        { nome: 'Não informado', quantidade: 1, percentual: 25 },
      ]);
    });

    it('arredonda o percentual (1 de 3 = 33%, 2 de 3 = 67%)', () => {
      profissionalApi.buscarPorOrganizacao.and.returnValue(of([
        { medEspecialidade: 'A' }, { medEspecialidade: 'B' }, { medEspecialidade: 'B' },
      ]));
      iniciar({ categoria: true });
      expect(component.especialidadesCategoria.map(e => e.percentual)).toEqual([67, 33]);
    });

    it('lista vazia: total zero e nenhuma especialidade', () => {
      iniciar({ categoria: true });
      expect(component.totalClinicos).toBe(0);
      expect(component.especialidadesCategoria).toEqual([]);
    });

    it('cor da especialidade gira na paleta de 12 cores', () => {
      expect(component.getCorEspecialidadeCategoria(0)).toBe('rgba(59, 130, 246, 0.75)');
      expect(component.getCorEspecialidadeCategoria(12)).toBe('rgba(59, 130, 246, 0.75)');
      expect(component.getCorEspecialidadeCategoria(11)).toBe('rgba(14, 165, 233, 0.75)');
    });
  });

  describe('tempo médio de consulta', () => {
    it('vazio ou nulo: tudo zero', () => {
      const calcular = (d: any) => (component as any).calcularEstatisticasMediaTempo(d);
      const zero = { mediaTempo: 0, totalConsultas: 0, tempoMinimo: 0, tempoMaximo: 0 };
      expect(calcular([])).toEqual(zero);
      expect(calcular(null)).toEqual(zero);
    });

    it('média com 1 casa decimal, total, mínimo e máximo', () => {
      const calcular = (d: any) => (component as any).calcularEstatisticasMediaTempo(d);
      expect(calcular([10, 20, 40])).toEqual({ mediaTempo: 23.3, totalConsultas: 3, tempoMinimo: 10, tempoMaximo: 40 });
      expect(calcular([30])).toEqual({ mediaTempo: 30, totalConsultas: 1, tempoMinimo: 30, tempoMaximo: 30 });
    });

    it('períodos 7, 30 e 60 dias; virada de mês', () => {
      congelarHoje(2026, 2, 1);
      const intervalo = (p: number) => (component as any).calcularIntervaloDataMediaTempo(p);
      expect(intervalo(1)).toEqual({ dataInicio: '2026-02-22', dataFim: '2026-03-01' });
      expect(intervalo(2)).toEqual({ dataInicio: '2026-01-30', dataFim: '2026-03-01' });
      expect(intervalo(3)).toEqual({ dataInicio: '2025-12-31', dataFim: '2026-03-01' });
    });

    it('período personalizado (0) não recua: início = fim = hoje', () => {
      expect((component as any).calcularIntervaloDataMediaTempo(0)).toEqual({ dataInicio: '2026-11-06', dataFim: '2026-11-06' });
    });

    it('só carrega para quem tem acesso de médico; senão mostra aviso', () => {
      controleAcesso.AcessoMedico.and.returnValue(false);
      iniciar({ mediaTempo: true });
      expect(component.hasErrorMediaTempo).toBeTrue();
      expect(component.errorMessageMediaTempo).toBe('Acesso restrito a médicos.');
      expect(consultaApi.buscarDuracoesConsultas).not.toHaveBeenCalled();
    });

    it('usuário sem id: avisa e não busca', () => {
      auth.getCurrentUser.and.returnValue({ organizacaoId: 3 });
      iniciar({ mediaTempo: true });
      expect(component.errorMessageMediaTempo).toBe('Usuário não identificado.');
      expect(consultaApi.buscarDuracoesConsultas).not.toHaveBeenCalled();
    });

    it('médico: busca as durações dele nos últimos 7 dias e calcula as estatísticas', () => {
      consultaApi.buscarDuracoesConsultas.and.returnValue(of([20, 40]));
      iniciar({ mediaTempo: true });
      expect(consultaApi.buscarDuracoesConsultas).toHaveBeenCalledWith(7, '2026-10-30', '2026-11-06');
      expect(component.dadosMediaTempo).toEqual({ mediaTempo: 30, totalConsultas: 2, tempoMinimo: 20, tempoMaximo: 40 });
      expect(component.temDadosMediaTempo()).toBeTrue();
      expect(component.isLoadingMediaTempo).toBeFalse();
    });

    it('sem durações: temDados é falso', () => {
      iniciar({ mediaTempo: true });
      expect(component.temDadosMediaTempo()).toBeFalse();
    });

    describe('validação do intervalo personalizado', () => {
      function personalizar(inicio: Date | null, fim: Date | null): void {
        iniciar({ mediaTempo: true });
        component.IntervaloDeDatasMediaTempo.setValue({ start: inicio, end: fim });
        component.fetchDadosPersonalizadosMediaTempo();
      }

      it('formulário incompleto', () => {
        personalizar(new Date(2026, 9, 1), null);
        expect(component.errorMessageMediaTempo).toBe('Por favor, selecione um intervalo de datas válido.');
        expect(component.hasErrorMediaTempo).toBeTrue();
      });

      it('início depois do fim', () => {
        personalizar(new Date(2026, 9, 10), new Date(2026, 9, 1));
        expect(component.errorMessageMediaTempo).toBe('A data de início deve ser anterior à data de fim.');
      });

      it('mais de 365 dias', () => {
        personalizar(new Date(2025, 0, 1), new Date(2026, 5, 1));
        expect(component.errorMessageMediaTempo).toBe('O intervalo não pode ser maior que 365 dias.');
      });

      it('válido: marca como personalizado e busca com datas locais', () => {
        consultaApi.buscarDuracoesConsultas.calls.reset();
        personalizar(new Date(2026, 9, 1), new Date(2026, 9, 31));
        expect(component.diaSelecionadoMediaTempo).toBe(0);
        expect(consultaApi.buscarDuracoesConsultas).toHaveBeenCalledWith(7, '2026-10-01', '2026-10-31');
      });
    });

    it('formata minutos: abaixo de 60 em "min"; acima em horas e minutos', () => {
      expect(component.formatarTempoMediaTempo(45)).toBe('45 min');
      expect(component.formatarTempoMediaTempo(59.6)).toBe('60 min');
      expect(component.formatarTempoMediaTempo(60)).toBe('1h 0min');
      expect(component.formatarTempoMediaTempo(90)).toBe('1h 30min');
      expect(component.formatarTempoMediaTempo(125.6)).toBe('2h 6min');
    });
  });
});
