/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AvisosLembretesComponent } from './Avisos-Lembretes.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../../testing/configuracao-teste';

describe('AvisosLembretesComponent', () => {
  let component: AvisosLembretesComponent;
  let fixture: ComponentFixture<AvisosLembretesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AvisosLembretesComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO.filter((p) => p.provide !== MAT_DIALOG_DATA),
        { provide: MAT_DIALOG_DATA, useValue: { Consulta: {}, Medico: {}, Paciente: {} } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AvisosLembretesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
