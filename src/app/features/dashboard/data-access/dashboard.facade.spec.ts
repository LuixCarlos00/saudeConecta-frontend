import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AuthService } from 'src/app/core/auth/auth.service';
import { ConsultaApiService } from 'src/app/core/data-access/consulta-api.service';
import { ControleAcessoApiService } from 'src/app/core/data-access/controle-acesso-api.service';
import { ProfissionalApiService } from 'src/app/core/data-access/profissional-api.service';
import { PeriodoEnumMediaTempo, PeriodoFiltroSaldo } from '../pages/dashboard/graficos-principais-dashboard/dashboard-calculos';
import { DashboardFacade } from './dashboard.facade';

/** Escolha da API por perfil: profissional, admin de organização e super admin. */
describe('DashboardFacade', () => {
  let facade: DashboardFacade;
  let consultaApi: jasmine.SpyObj<ConsultaApiService>;
  let controleAcesso: jasmine.SpyObj<ControleAcessoApiService>;
  let auth: jasmine.SpyObj<AuthService>;
  let profissionalApi: jasmine.SpyObj<ProfissionalApiService>;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 10, 6, 10));

    consultaApi = jasmine.createSpyObj('ConsultaApiService', [
      'BuscandoConsultasPorMedicoEmIntervaloDeDatas',
      'buscarConsultasPorOrganizacaoEIntervalo',
      'buscarPorIntervaloDeDatas',
      'pesquisarClinicasEmIntervaloDeDatas',
      'getSaldoFinanceiro',
      'buscarDuracoesConsultas',
    ]);
    controleAcesso = jasmine.createSpyObj('ControleAcessoApiService', ['isDashboardProfissional', 'AcessoMedico']);
    controleAcesso.isDashboardProfissional.and.returnValue(false);
    controleAcesso.AcessoMedico.and.returnValue(true);
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    auth.getCurrentUser.and.returnValue({ id: 7, organizacaoId: 3 } as any);
    profissionalApi = jasmine.createSpyObj('ProfissionalApiService', ['buscarPorOrganizacao']);
    profissionalApi.buscarPorOrganizacao.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        DashboardFacade,
        { provide: ConsultaApiService, useValue: consultaApi },
        { provide: ControleAcessoApiService, useValue: controleAcesso },
        { provide: AuthService, useValue: auth },
        { provide: ProfissionalApiService, useValue: profissionalApi },
      ],
    });
    facade = TestBed.inject(DashboardFacade);
  });

  afterEach(() => jasmine.clock().uninstall());

  describe('consultas e agendamentos padronizados', () => {
    it('médico: só as consultas dele; agendamentos por pesquisarClinicas', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      facade.consultasPadronizadas(1, null);
      facade.agendamentosPadronizados(1, null);
      expect(consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas).toHaveBeenCalledWith('2026-10-30', '2026-11-06', 7);
      expect(consultaApi.pesquisarClinicasEmIntervaloDeDatas).toHaveBeenCalledWith(7, '2026-10-30', '2026-11-06');
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).not.toHaveBeenCalled();
    });

    it('medicoId recebido tem prioridade sobre o usuário logado', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      facade.consultasPadronizadas(1, 99);
      expect(consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas).toHaveBeenCalledWith('2026-10-30', '2026-11-06', 99);
    });

    it('medicoId recebido filtra mesmo quando o logado não é profissional', () => {
      facade.agendamentosPadronizados(2, 99);
      expect(consultaApi.pesquisarClinicasEmIntervaloDeDatas).toHaveBeenCalledWith(99, '2026-10-07', '2026-11-06');
    });

    it('admin da organização: consultas e agendamentos da organização', () => {
      facade.consultasPadronizadas(1, null);
      facade.agendamentosPadronizados(3, null);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo.calls.allArgs()).toEqual([
        [3, '2026-10-30', '2026-11-06'],
        [3, '2026-09-07', '2026-11-06'],
      ]);
    });

    it('super admin (sem organização): todas as consultas', () => {
      auth.getCurrentUser.and.returnValue({ id: 1 } as any);
      facade.consultasPadronizadas(2, null);
      facade.agendamentosPadronizados(2, null);
      expect(consultaApi.buscarPorIntervaloDeDatas).toHaveBeenCalledTimes(2);
      expect(consultaApi.buscarPorIntervaloDeDatas).toHaveBeenCalledWith('2026-10-07', '2026-11-06');
    });
  });

  describe('intervalo personalizado', () => {
    const inicio = new Date(2026, 9, 1);
    const fim = new Date(2026, 9, 31);

    it('ignora a organização: usa a API geral', () => {
      facade.consultasPersonalizadas(inicio, fim, null);
      facade.agendamentosPersonalizados(inicio, fim, null);
      expect(consultaApi.buscarPorIntervaloDeDatas.calls.allArgs()).toEqual([
        ['2026-10-01', '2026-10-31'],
        ['2026-10-01', '2026-10-31'],
      ]);
      expect(consultaApi.buscarConsultasPorOrganizacaoEIntervalo).not.toHaveBeenCalled();
    });

    it('médico usa as rotas do profissional', () => {
      controleAcesso.isDashboardProfissional.and.returnValue(true);
      facade.consultasPersonalizadas(inicio, fim, null);
      facade.agendamentosPersonalizados(inicio, fim, null);
      expect(consultaApi.BuscandoConsultasPorMedicoEmIntervaloDeDatas).toHaveBeenCalledWith('2026-10-01', '2026-10-31', 7);
      expect(consultaApi.pesquisarClinicasEmIntervaloDeDatas).toHaveBeenCalledWith(7, '2026-10-01', '2026-10-31');
    });
  });

  describe('saldo', () => {
    it('3 meses agrupa por mês; este mês agrupa por semana', () => {
      facade.saldo(PeriodoFiltroSaldo.ULTIMOS_3_MESES);
      facade.saldo(PeriodoFiltroSaldo.ESTE_MES);
      expect(consultaApi.getSaldoFinanceiro.calls.allArgs()).toEqual([
        ['2026-09-01', '2026-11-06', 'mes'],
        ['2026-11-01', '2026-11-06', 'semana'],
      ]);
    });
  });

  describe('profissionais da organização', () => {
    it('busca pela organização do usuário', () => {
      facade.profissionaisDaOrganizacao()!.subscribe();
      expect(profissionalApi.buscarPorOrganizacao).toHaveBeenCalledWith(3);
    });

    it('sem organização devolve null e não chama a API', () => {
      auth.getCurrentUser.and.returnValue({ id: 1 } as any);
      expect(facade.profissionaisDaOrganizacao()).toBeNull();
      expect(facade.temOrganizacao()).toBeFalse();
      expect(profissionalApi.buscarPorOrganizacao).not.toHaveBeenCalled();
    });
  });

  describe('durações das consultas', () => {
    it('busca as do usuário logado no período', () => {
      facade.duracoesDasConsultas(PeriodoEnumMediaTempo.SETE_DIAS);
      expect(consultaApi.buscarDuracoesConsultas).toHaveBeenCalledWith(7, '2026-10-30', '2026-11-06');
    });

    it('intervalo livre usa as datas recebidas', () => {
      facade.duracoesNoIntervalo('2026-10-01', '2026-10-31');
      expect(consultaApi.buscarDuracoesConsultas).toHaveBeenCalledWith(7, '2026-10-01', '2026-10-31');
    });

    it('sem usuário logado devolve null', () => {
      auth.getCurrentUser.and.returnValue(null as any);
      expect(facade.duracoesDasConsultas(PeriodoEnumMediaTempo.SETE_DIAS)).toBeNull();
      expect(facade.usuarioId()).toBeNull();
      expect(consultaApi.buscarDuracoesConsultas).not.toHaveBeenCalled();
    });
  });

  it('acesso de médico vem do ControleAcesso', () => {
    controleAcesso.AcessoMedico.and.returnValue(false);
    expect(facade.temAcessoMedico()).toBeFalse();
  });
});
