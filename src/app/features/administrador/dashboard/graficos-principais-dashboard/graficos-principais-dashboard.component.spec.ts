import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { Subject, throwError } from 'rxjs';

import { GraficosPrincipaisDashboardComponent } from './graficos-principais-dashboard.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('GraficosPrincipaisDashboardComponent - fetchConsultasPersonalizadas', () => {
  let component: GraficosPrincipaisDashboardComponent;
  let fixture: ComponentFixture<GraficosPrincipaisDashboardComponent>;
  let buscar: jasmine.Spy;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GraficosPrincipaisDashboardComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficosPrincipaisDashboardComponent);
    component = fixture.componentInstance;
    buscar = jasmine.createSpy('buscarPorIntervaloDeDatas');
    (component as any).consultaApiService = { buscarPorIntervaloDeDatas: buscar };
    spyOn(component, 'criarGraficoConsultas' as any);
    spyOn(console, 'error');
  });

  function definirIntervalo(inicio: Date | null, fim: Date | null): void {
    component.IntervaloDeDatasConsultas = new FormGroup({
      start: new FormControl(inicio),
      end: new FormControl(fim),
    });
  }

  it('início > fim: avisa e NÃO chama o back', () => {
    definirIntervalo(new Date(2026, 10, 10), new Date(2026, 10, 1));
    component.fetchConsultasPersonalizadas();
    expect(buscar).not.toHaveBeenCalled();
    expect(component.hasErrorConsultas).toBeTrue();
    expect(component.errorMessageConsultas).toContain('data inicial');
    expect(component.isLoadingConsultas).toBeFalse();
  });

  it('liga o loading durante a requisição e desliga ao concluir (sucesso)', () => {
    const resposta$ = new Subject<any[]>();
    buscar.and.returnValue(resposta$);
    definirIntervalo(new Date(2026, 10, 1), new Date(2026, 10, 10));

    component.fetchConsultasPersonalizadas();
    expect(component.isLoadingConsultas).toBeTrue();
    expect(buscar).toHaveBeenCalledWith('2026-11-01', '2026-11-10');

    resposta$.next([]);
    resposta$.complete();
    expect(component.isLoadingConsultas).toBeFalse();
  });

  it('desliga o loading em caso de erro', () => {
    buscar.and.returnValue(throwError(() => ({ status: 500 })));
    definirIntervalo(new Date(2026, 10, 1), new Date(2026, 10, 10));
    component.fetchConsultasPersonalizadas();
    expect(component.isLoadingConsultas).toBeFalse();
    expect(component.hasErrorConsultas).toBeTrue();
  });
});
