/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelasPesquisasMedicosComponent } from './tabelas-Pesquisas-Medicos.component';

describe('TabelasPesquisasMedicosComponent', () => {
  let component: TabelasPesquisasMedicosComponent;
  let fixture: ComponentFixture<TabelasPesquisasMedicosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TabelasPesquisasMedicosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelasPesquisasMedicosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
