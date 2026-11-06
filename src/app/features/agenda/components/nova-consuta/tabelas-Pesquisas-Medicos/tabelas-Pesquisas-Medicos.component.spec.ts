/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelasPesquisasMedicosComponent } from './tabelas-Pesquisas-Medicos.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('TabelasPesquisasMedicosComponent', () => {
  let component: TabelasPesquisasMedicosComponent;
  let fixture: ComponentFixture<TabelasPesquisasMedicosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TabelasPesquisasMedicosComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
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
