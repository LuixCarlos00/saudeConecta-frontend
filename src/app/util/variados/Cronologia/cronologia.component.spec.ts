/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CronologiaComponent } from './cronologia.component';

describe('CalendarDialogComponent', () => {
  let component: CronologiaComponent;
  let fixture: ComponentFixture<CronologiaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CronologiaComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CronologiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
