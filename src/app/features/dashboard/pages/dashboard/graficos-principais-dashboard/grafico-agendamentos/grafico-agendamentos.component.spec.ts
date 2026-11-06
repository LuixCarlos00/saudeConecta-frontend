import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { GraficoAgendamentosComponent } from './grafico-agendamentos.component';

describe('GraficoAgendamentosComponent', () => {
  let component: GraficoAgendamentosComponent;
  let fixture: ComponentFixture<GraficoAgendamentosComponent>;
  let facade: jasmine.SpyObj<DashboardFacade>;

  beforeEach(async () => {
    facade = jasmine.createSpyObj('DashboardFacade', ['agendamentosPadronizados', 'agendamentosPersonalizados']);
    facade.agendamentosPadronizados.and.returnValue(of([]));
    facade.agendamentosPersonalizados.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GraficoAgendamentosComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [{ provide: DashboardFacade, useValue: facade }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoAgendamentosComponent);
    component = fixture.componentInstance;
    spyOn(component, 'criarGraficoAgendamentos' as any);
    spyOn(console, 'error');
  });

  function definirIntervalo(inicio: Date | null, fim: Date | null): void {
    component.IntervaloDeDatasAgendamentos = new FormGroup({
      start: new FormControl(inicio),
      end: new FormControl(fim),
    });
  }

  it('ao abrir, carrega os últimos 7 dias do médico recebido por @Input', () => {
    component.medicoId = 12;
    fixture.detectChanges();
    expect(facade.agendamentosPadronizados).toHaveBeenCalledWith(1, 12);
  });

  it('guarda os agendamentos, apura os dias (sem a hora) e monta o gráfico', () => {
    facade.agendamentosPadronizados.and.returnValue(of([{ dataHora: '2026-11-01T09:00:00' }, { conData: '2026-11-02' }, {}]));
    fixture.detectChanges();
    expect(component.TodasAgendamentos.length).toBe(3);
    expect(component.DatasAgendamentos).toEqual(['2026-11-01', '2026-11-02']);
    expect(component.criarGraficoAgendamentos).toHaveBeenCalled();
    expect(component.isLoadingAgendamentos).toBeFalse();
  });

  it('erro na carga padrão: mensagem de conexão e lista vazia', () => {
    facade.agendamentosPadronizados.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.hasErrorAgendamentos).toBeTrue();
    expect(component.errorMessageAgendamentos).toBe('Erro ao carregar dados. Verifique sua conexão.');
    expect(component.TodasAgendamentos).toEqual([]);
  });

  describe('fetchAgendamentosPersonalizados', () => {
    beforeEach(() => fixture.detectChanges());

    it('início > fim: avisa e NÃO chama o back', () => {
      definirIntervalo(new Date(2026, 10, 10), new Date(2026, 10, 1));
      component.fetchAgendamentosPersonalizados();
      expect(facade.agendamentosPersonalizados).not.toHaveBeenCalled();
      expect(component.hasErrorAgendamentos).toBeTrue();
      expect(component.errorMessageAgendamentos).toContain('data inicial');
      expect(component.isLoadingAgendamentos).toBeFalse();
    });

    it('liga o loading durante a requisição, desmarca o filtro rápido e desliga ao concluir', () => {
      const resposta$ = new Subject<any[]>();
      facade.agendamentosPersonalizados.and.returnValue(resposta$);
      const inicio = new Date(2026, 10, 1);
      const fim = new Date(2026, 10, 10);
      definirIntervalo(inicio, fim);

      component.fetchAgendamentosPersonalizados();
      expect(component.isLoadingAgendamentos).toBeTrue();
      expect(component.diaSelecionadoAgendamentos).toBe(0);
      expect(facade.agendamentosPersonalizados).toHaveBeenCalledWith(inicio, fim, null);

      resposta$.next([]);
      resposta$.complete();
      expect(component.isLoadingAgendamentos).toBeFalse();
    });

    it('desliga o loading em caso de erro', () => {
      facade.agendamentosPersonalizados.and.returnValue(throwError(() => ({ status: 500 })));
      definirIntervalo(new Date(2026, 10, 1), new Date(2026, 10, 10));
      component.fetchAgendamentosPersonalizados();
      expect(component.isLoadingAgendamentos).toBeFalse();
      expect(component.hasErrorAgendamentos).toBeTrue();
    });
  });
});
