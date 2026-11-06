import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { PeriodoEnumMediaTempo } from '../dashboard-calculos';
import { GraficoMediaTempoComponent } from './grafico-media-tempo.component';

describe('GraficoMediaTempoComponent', () => {
  let component: GraficoMediaTempoComponent;
  let fixture: ComponentFixture<GraficoMediaTempoComponent>;
  let facade: jasmine.SpyObj<DashboardFacade>;

  beforeEach(async () => {
    facade = jasmine.createSpyObj('DashboardFacade', ['temAcessoMedico', 'usuarioId', 'duracoesDasConsultas', 'duracoesNoIntervalo']);
    facade.temAcessoMedico.and.returnValue(true);
    facade.usuarioId.and.returnValue(7);
    facade.duracoesDasConsultas.and.returnValue(of([]));
    facade.duracoesNoIntervalo.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GraficoMediaTempoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [{ provide: DashboardFacade, useValue: facade }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoMediaTempoComponent);
    component = fixture.componentInstance;
    spyOn(component, 'criarGraficoMediaTempo' as any);
    spyOn(console, 'error');
    spyOn(console, 'warn');
  });

  it('só carrega para quem tem acesso de médico; senão mostra aviso', () => {
    facade.temAcessoMedico.and.returnValue(false);
    fixture.detectChanges();
    expect(component.hasErrorMediaTempo).toBeTrue();
    expect(component.errorMessageMediaTempo).toBe('Acesso restrito a médicos.');
    expect(facade.duracoesDasConsultas).not.toHaveBeenCalled();
  });

  it('usuário sem id: avisa e não busca', () => {
    facade.usuarioId.and.returnValue(null);
    fixture.detectChanges();
    expect(component.errorMessageMediaTempo).toBe('Usuário não identificado.');
    expect(facade.duracoesDasConsultas).not.toHaveBeenCalled();
  });

  it('médico: busca os últimos 7 dias e calcula as estatísticas', () => {
    facade.duracoesDasConsultas.and.returnValue(of([20, 40]));
    fixture.detectChanges();
    expect(facade.duracoesDasConsultas).toHaveBeenCalledWith(PeriodoEnumMediaTempo.SETE_DIAS);
    expect(component.dadosMediaTempo).toEqual({ mediaTempo: 30, totalConsultas: 2, tempoMinimo: 20, tempoMaximo: 40 });
    expect(component.temDadosMediaTempo()).toBeTrue();
    expect(component.isLoadingMediaTempo).toBeFalse();
  });

  it('sem durações: temDados é falso', () => {
    fixture.detectChanges();
    expect(component.temDadosMediaTempo()).toBeFalse();
  });

  it('erro da API: mensagem de conexão e loading desligado', () => {
    facade.duracoesDasConsultas.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.hasErrorMediaTempo).toBeTrue();
    expect(component.errorMessageMediaTempo).toBe('Erro ao carregar dados. Verifique sua conexão.');
    expect(component.isLoadingMediaTempo).toBeFalse();
  });

  describe('intervalo personalizado', () => {
    beforeEach(() => fixture.detectChanges());

    function personalizar(inicio: Date | null, fim: Date | null): void {
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
      personalizar(new Date(2026, 9, 1), new Date(2026, 9, 31));
      expect(component.diaSelecionadoMediaTempo).toBe(PeriodoEnumMediaTempo.PERSONALIZADO);
      expect(facade.duracoesNoIntervalo).toHaveBeenCalledWith('2026-10-01', '2026-10-31');
    });
  });
});
