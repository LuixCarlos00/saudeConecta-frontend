/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { NovaConsultaComponent } from './nova-consuta.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';


describe('NovaConsultaComponent', () => {
  let component: NovaConsultaComponent;
  let fixture: ComponentFixture<NovaConsultaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NovaConsultaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NovaConsultaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('3.7: usa o tempo de consulta do médico como duração dos horários ocupados', () => {
    // Ocupados 09:00 e 11:00 com consultas de 30 min: 10:00 deve continuar livre.
    component.generateAvailableTimesRespeitandoOcupados(30, ['09:00:00', '11:00:00']);
    const horas = component.Hora.map((h: any) => h.value);
    expect(horas).toContain('10:00');
    expect(horas).not.toContain('09:00');
    expect(horas).not.toContain('11:00');
  });

  it('transformaFormaPagamento deve usar os ids do banco', () => {
    component.FormularioConsulta.patchValue({ Pagamento: 'PIX' });
    expect(component.transformaFormaPagamento()).toBe(5);
    component.FormularioConsulta.patchValue({ Pagamento: 'Dinheiro' });
    expect(component.transformaFormaPagamento()).toBe(6);
  });
});
