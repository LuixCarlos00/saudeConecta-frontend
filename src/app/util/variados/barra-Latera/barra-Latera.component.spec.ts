/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { BarraLateraComponent } from './barra-Latera.component';

describe('BarraLateraComponent', () => {
  let component: BarraLateraComponent;
  let fixture: ComponentFixture<BarraLateraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BarraLateraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BarraLateraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
