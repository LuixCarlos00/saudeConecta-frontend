/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaEditarPacienteConsultasComponent } from './tabela-editar-Paciente-Consultas.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('TabelaEditarPacienteConsultasComponent', () => {
  let component: TabelaEditarPacienteConsultasComponent;
  let fixture: ComponentFixture<TabelaEditarPacienteConsultasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaEditarPacienteConsultasComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelaEditarPacienteConsultasComponent);
    component = fixture.componentInstance;
    component.dadosPaciente = [];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
