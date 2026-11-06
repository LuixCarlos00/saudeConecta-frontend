/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaEditarMedicosConsultasComponent } from './tabela-editar-Medicos-Consultas.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../../../testing/configuracao-teste';

describe('TabelaEditarMedicosConsultasComponent', () => {
  let component: TabelaEditarMedicosConsultasComponent;
  let fixture: ComponentFixture<TabelaEditarMedicosConsultasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaEditarMedicosConsultasComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelaEditarMedicosConsultasComponent);
    component = fixture.componentInstance;
    component.dadosMedicos = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
