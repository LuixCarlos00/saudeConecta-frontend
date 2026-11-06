import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, of, throwError } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { GraficoConsultasComponent } from './grafico-consultas.component';

describe('GraficoConsultasComponent', () => {
  let component: GraficoConsultasComponent;
  let fixture: ComponentFixture<GraficoConsultasComponent>;
  let facade: jasmine.SpyObj<DashboardFacade>;

  beforeEach(async () => {
    facade = jasmine.createSpyObj('DashboardFacade', ['consultasPadronizadas', 'consultasPersonalizadas']);
    facade.consultasPadronizadas.and.returnValue(of([]));
    facade.consultasPersonalizadas.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GraficoConsultasComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [{ provide: DashboardFacade, useValue: facade }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoConsultasComponent);
    component = fixture.componentInstance;
    spyOn(component, 'criarGraficoConsultas' as any);
    spyOn(console, 'error');
  });

  function definirIntervalo(inicio: Date | null, fim: Date | null): void {
    component.IntervaloDeDatasConsultas = new FormGroup({
      start: new FormControl(inicio),
      end: new FormControl(fim),
    });
  }

  it('ao abrir, carrega os últimos 7 dias do médico recebido por @Input', () => {
    component.medicoId = 12;
    fixture.detectChanges();
    expect(facade.consultasPadronizadas).toHaveBeenCalledWith(1, 12);
  });

  it('guarda as consultas, apura as datas e monta o gráfico', () => {
    facade.consultasPadronizadas.and.returnValue(of([{ dataHora: '2026-11-01T09:00:00' }, { conData: '2026-11-02' }, {}]));
    fixture.detectChanges();
    expect(component.TodasConsultas.length).toBe(3);
    expect(component.DatasConsultas).toEqual(['2026-11-01T09:00:00', '2026-11-02']);
    expect(component.criarGraficoConsultas).toHaveBeenCalled();
    expect(component.isLoadingConsultas).toBeFalse();
  });

  it('resposta nula do back vira lista vazia', () => {
    facade.consultasPadronizadas.and.returnValue(of(null as any));
    fixture.detectChanges();
    expect(component.TodasConsultas).toEqual([]);
  });

  it('erro na carga padrão: mensagem de conexão e lista vazia', () => {
    facade.consultasPadronizadas.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.hasErrorConsultas).toBeTrue();
    expect(component.errorMessageConsultas).toBe('Erro ao carregar dados. Verifique sua conexão.');
    expect(component.isLoadingConsultas).toBeFalse();
    expect(component.TodasConsultas).toEqual([]);
  });

  it('o botão de filtro rápido recarrega com a opção escolhida', () => {
    fixture.detectChanges();
    component.diaSelecionadoConsultas = 3;
    component.atualizarGraficoConsultas();
    expect(facade.consultasPadronizadas).toHaveBeenCalledWith(3, null);
  });

  describe('fetchConsultasPersonalizadas', () => {
    beforeEach(() => fixture.detectChanges());

    it('sem as duas datas: não faz nada', () => {
      definirIntervalo(new Date(2026, 10, 1), null);
      component.fetchConsultasPersonalizadas();
      expect(facade.consultasPersonalizadas).not.toHaveBeenCalled();
    });

    it('início > fim: avisa e NÃO chama o back', () => {
      definirIntervalo(new Date(2026, 10, 10), new Date(2026, 10, 1));
      component.fetchConsultasPersonalizadas();
      expect(facade.consultasPersonalizadas).not.toHaveBeenCalled();
      expect(component.hasErrorConsultas).toBeTrue();
      expect(component.errorMessageConsultas).toContain('data inicial');
      expect(component.isLoadingConsultas).toBeFalse();
    });

    it('liga o loading durante a requisição, desmarca o filtro rápido e desliga ao concluir', () => {
      const resposta$ = new Subject<any[]>();
      facade.consultasPersonalizadas.and.returnValue(resposta$);
      const inicio = new Date(2026, 10, 1);
      const fim = new Date(2026, 10, 10);
      definirIntervalo(inicio, fim);

      component.fetchConsultasPersonalizadas();
      expect(component.isLoadingConsultas).toBeTrue();
      expect(component.diaSelecionadoConsultas).toBe(0);
      expect(facade.consultasPersonalizadas).toHaveBeenCalledWith(inicio, fim, null);

      resposta$.next([]);
      resposta$.complete();
      expect(component.isLoadingConsultas).toBeFalse();
    });

    it('desliga o loading em caso de erro', () => {
      facade.consultasPersonalizadas.and.returnValue(throwError(() => ({ status: 500 })));
      definirIntervalo(new Date(2026, 10, 1), new Date(2026, 10, 10));
      component.fetchConsultasPersonalizadas();
      expect(component.isLoadingConsultas).toBeFalse();
      expect(component.hasErrorConsultas).toBeTrue();
      expect(component.errorMessageConsultas).toBe('Erro ao carregar dados personalizados.');
    });
  });
});
