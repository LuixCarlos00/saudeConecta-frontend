/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { GraficoAgendamentosDiasSemanasMesComponent } from './grafico-agendamentos-dias-semanas-mes.component';

describe('GraficoAgendamentosDiasSemanasMesComponent', () => {
  let component: GraficoAgendamentosDiasSemanasMesComponent;
  let fixture: ComponentFixture<GraficoAgendamentosDiasSemanasMesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GraficoAgendamentosDiasSemanasMesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GraficoAgendamentosDiasSemanasMesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
