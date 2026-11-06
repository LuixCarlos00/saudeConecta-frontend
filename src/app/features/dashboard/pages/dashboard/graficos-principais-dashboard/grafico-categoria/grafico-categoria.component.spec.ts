import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { DashboardFacade } from 'src/app/features/dashboard/data-access/dashboard.facade';
import { IMPORTS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { GraficoCategoriaComponent } from './grafico-categoria.component';

describe('GraficoCategoriaComponent', () => {
  let component: GraficoCategoriaComponent;
  let fixture: ComponentFixture<GraficoCategoriaComponent>;
  let facade: jasmine.SpyObj<DashboardFacade>;

  beforeEach(async () => {
    facade = jasmine.createSpyObj('DashboardFacade', ['profissionaisDaOrganizacao']);
    facade.profissionaisDaOrganizacao.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [GraficoCategoriaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [{ provide: DashboardFacade, useValue: facade }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();

    fixture = TestBed.createComponent(GraficoCategoriaComponent);
    component = fixture.componentInstance;
  });

  it('sem organização: mostra erro e não carrega', () => {
    facade.profissionaisDaOrganizacao.and.returnValue(null);
    fixture.detectChanges();
    expect(component.hasErrorCategoria).toBeTrue();
    expect(component.isLoadingCategoria).toBeFalse();
  });

  it('conta os clínicos e monta o resumo por especialidade', () => {
    facade.profissionaisDaOrganizacao.and.returnValue(of([
      { especialidades: [{ nome: 'Cardiologia' }] },
      { especialidades: [{ nome: 'Cardiologia' }] },
      { medEspecialidade: 'Dermatologia' },
      {},
    ]));
    fixture.detectChanges();
    expect(component.totalClinicos).toBe(4);
    expect(component.especialidadesCategoria).toEqual([
      { nome: 'Cardiologia', quantidade: 2, percentual: 50 },
      { nome: 'Dermatologia', quantidade: 1, percentual: 25 },
      { nome: 'Não informado', quantidade: 1, percentual: 25 },
    ]);
    expect(fixture.nativeElement.querySelector('.especialidade-resumo-total').textContent.trim()).toBe('4');
  });

  it('lista vazia: total zero e aviso "Nenhum clínico cadastrado"', () => {
    fixture.detectChanges();
    expect(component.totalClinicos).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Nenhum clínico cadastrado');
  });

  it('erro da API liga o aviso e desliga o loading', () => {
    facade.profissionaisDaOrganizacao.and.returnValue(throwError(() => ({ status: 500 })));
    fixture.detectChanges();
    expect(component.hasErrorCategoria).toBeTrue();
    expect(component.isLoadingCategoria).toBeFalse();
  });
});
