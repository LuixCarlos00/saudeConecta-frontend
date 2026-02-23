/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaEditarMedicosConsultasComponent } from './tabela-editar-Medicos-Consultas.component';

describe('TabelaEditarMedicosConsultasComponent', () => {
  let component: TabelaEditarMedicosConsultasComponent;
  let fixture: ComponentFixture<TabelaEditarMedicosConsultasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabelaEditarMedicosConsultasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelaEditarMedicosConsultasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
