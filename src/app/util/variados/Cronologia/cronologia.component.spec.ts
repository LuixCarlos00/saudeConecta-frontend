/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CronologiaComponent } from './cronologia.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';

describe('CalendarDialogComponent', () => {
  let component: CronologiaComponent;
  let fixture: ComponentFixture<CronologiaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CronologiaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
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
