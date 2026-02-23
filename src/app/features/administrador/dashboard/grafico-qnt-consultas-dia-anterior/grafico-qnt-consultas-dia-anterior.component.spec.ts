/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { GraficoQntConsultasDiaAnteriorComponent } from './grafico-qnt-consultas-dia-anterior.component';

describe('GraficoQntConsultasDiaAnteriorComponent', () => {
  let component: GraficoQntConsultasDiaAnteriorComponent;
  let fixture: ComponentFixture<GraficoQntConsultasDiaAnteriorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraficoQntConsultasDiaAnteriorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficoQntConsultasDiaAnteriorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
