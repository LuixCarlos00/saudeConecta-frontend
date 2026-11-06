import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { PeriodoFiltroSaldo } from '../dashboard-calculos';
import { GraficoSaldoComponent } from './grafico-saldo.component';

describe('GraficoSaldoComponent', () => {
  let component: GraficoSaldoComponent;
  let fixture: ComponentFixture<GraficoSaldoComponent>;
  let facade: jasmine.SpyObj<DashboardFacade>;
  const resposta: any = { totalConsultas: 100, totalProcedimentos: 50, totalGeral: 150, quantidadeConsultas: 2, quantidadeProcedimentos: 1, detalhamento: [] };

  beforeEach(async () => {
    facade = jasmine.createSpyObj('DashboardFacade', ['saldo']);
    facade.saldo.and.returnValue(of(resposta));

    await TestBed.configureTestingModule({
      declarations: [GraficoSaldoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [{ provide: DashboardFacade, useValue: facade }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoSaldoComponent);
    component = fixture.componentInstance;
  });

  it('abre em "3 meses" e guarda a resposta', () => {
    fixture.detectChanges();
    expect(facade.saldo).toHaveBeenCalledWith(PeriodoFiltroSaldo.ULTIMOS_3_MESES);
    expect(component.dadosSaldo).toBe(resposta);
    expect(component.isLoadingSaldo).toBeFalse();
    expect(component.hasErrorSaldo).toBeFalse();
  });

  it('trocar o período recarrega com o novo período', () => {
    fixture.detectChanges();
    component.onPeriodoChangeSaldo(PeriodoFiltroSaldo.ESTE_ANO);
    expect(component.periodoSelecionadoSaldo).toBe(PeriodoFiltroSaldo.ESTE_ANO);
    expect(facade.saldo).toHaveBeenCalledWith(PeriodoFiltroSaldo.ESTE_ANO);
  });

  it('erro da API liga o aviso e desliga o loading', () => {
    facade.saldo.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.hasErrorSaldo).toBeTrue();
    expect(component.isLoadingSaldo).toBeFalse();
  });

  it('mostra o resumo com os totais em reais', () => {
    fixture.detectChanges();
    const textos = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.saldo-resumo-valor'))
      .map(el => el.textContent!.replace(/ /g, ' ').trim());
    expect(textos).toEqual(['R$ 100,00', 'R$ 50,00', 'R$ 150,00']);
  });
});
