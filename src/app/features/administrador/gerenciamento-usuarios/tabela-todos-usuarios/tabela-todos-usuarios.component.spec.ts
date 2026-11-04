/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaTodosUsuariosComponent } from './tabela-todos-usuarios.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('TabelaTodosUsuariosComponent', () => {
  let component: TabelaTodosUsuariosComponent;
  let fixture: ComponentFixture<TabelaTodosUsuariosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TabelaTodosUsuariosComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabelaTodosUsuariosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('podeExcluir', () => {
    const admin: any = { categoria: 'Administrador' };
    const paciente: any = { categoria: 'Paciente' };

    it('bloqueia exclusão de Administrador sem ROLE_ADMIN', () => {
      spyOn(component.controleAcessoService, 'podeGerenciarAdministrador').and.returnValue(false);
      expect(component.podeExcluir(admin)).toBeFalse();
      expect(component.podeExcluir(paciente)).toBeTrue();
    });

    it('permite exclusão de Administrador com ROLE_ADMIN', () => {
      spyOn(component.controleAcessoService, 'podeGerenciarAdministrador').and.returnValue(true);
      expect(component.podeExcluir(admin)).toBeTrue();
    });
  });
});
