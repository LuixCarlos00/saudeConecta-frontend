/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { GerenciamentoUsuarioComponent } from './gerenciamento-usuario.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('GerenciamentoUsuarioComponent', () => {
  let component: GerenciamentoUsuarioComponent;
  let fixture: ComponentFixture<GerenciamentoUsuarioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [GerenciamentoUsuarioComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GerenciamentoUsuarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('recarregarDados pede recarga uma vez e o loading acompanha carregando$ (sem setTimeout)', async () => {
    const filtro = (component as any).filtroStateService;
    const recargas: boolean[] = [];
    filtro.recarregar$.subscribe((v: boolean) => recargas.push(v));

    component.recarregarDados();
    expect(recargas).toEqual([true]);
    expect(component.isLoading).toBeFalse();

    filtro.setCarregando(true);
    await new Promise((r) => setTimeout(r));
    expect(component.isLoading).toBeTrue();
    filtro.setCarregando(false);
    await new Promise((r) => setTimeout(r));
    expect(component.isLoading).toBeFalse();
  });
});
