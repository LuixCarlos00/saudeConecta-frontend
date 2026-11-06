/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Router } from '@angular/router';
import { ControleAcessoApiService } from 'src/app/services/api/controle-acesso-api.service';
import { BarraLateraComponent } from './barra-Latera.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../testing/configuracao-teste';

describe('BarraLateraComponent', () => {
  let component: BarraLateraComponent;
  let fixture: ComponentFixture<BarraLateraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BarraLateraComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
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

describe('BarraLateraComponent - itens do SUPER_ADMIN', () => {
  let fixture: ComponentFixture<BarraLateraComponent>;

  function montar(superAdmin: boolean): void {
    TestBed.configureTestingModule({
      declarations: [BarraLateraComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    });
    spyOn(TestBed.inject(ControleAcessoApiService), 'isSuperAdmin').and.returnValue(superAdmin);
    fixture = TestBed.createComponent(BarraLateraComponent);
    fixture.detectChanges();
  }

  const textos = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.nav-text')).map(e => e.textContent?.trim());

  it('SUPER_ADMIN vê Gestão de Assinaturas e Pendências Manuais', () => {
    montar(true);
    expect(textos()).toContain('Gestão de Assinaturas');
    expect(textos()).toContain('Pendências Manuais');
  });

  it('quem não é SUPER_ADMIN não vê os dois itens', () => {
    montar(false);
    expect(textos()).not.toContain('Gestão de Assinaturas');
    expect(textos()).not.toContain('Pendências Manuais');
  });

  it('os itens navegam para as rotas novas', () => {
    montar(true);
    const router = TestBed.inject(Router);
    const navegar = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.navigateTo('GestaoAssinaturas');
    fixture.componentInstance.navigateTo('PendenciasManuais');
    expect(navegar.calls.allArgs()).toEqual([[['gestao-assinaturas']], [['pendencias-manuais']]]);
  });
});
