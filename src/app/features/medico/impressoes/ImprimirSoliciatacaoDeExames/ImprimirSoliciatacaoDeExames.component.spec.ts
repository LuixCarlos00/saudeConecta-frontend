/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { ImprimirSoliciatacaoDeExamesComponent } from './ImprimirSoliciatacaoDeExames.component';

describe('ImprimirSoliciatacaoDeExamesComponent', () => {
  let component: ImprimirSoliciatacaoDeExamesComponent;
  let fixture: ComponentFixture<ImprimirSoliciatacaoDeExamesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImprimirSoliciatacaoDeExamesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImprimirSoliciatacaoDeExamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
