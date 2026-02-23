/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaEditarPacienteConsultasComponent } from './tabela-editar-Paciente-Consultas.component';

describe('TabelaEditarPacienteConsultasComponent', () => {
  let component: TabelaEditarPacienteConsultasComponent;
  let fixture: ComponentFixture<TabelaEditarPacienteConsultasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabelaEditarPacienteConsultasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelaEditarPacienteConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
