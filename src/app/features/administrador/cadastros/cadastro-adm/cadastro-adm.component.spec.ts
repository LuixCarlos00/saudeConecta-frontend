import Swal from 'sweetalert2';
/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { CadastroAdmComponent } from './cadastro-adm.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('CadastroAdmComponent', () => {
  let component: CadastroAdmComponent;
  let fixture: ComponentFixture<CadastroAdmComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CadastroAdmComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CadastroAdmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleHttpError', () => {
    beforeEach(() => {
      spyOn(Swal, 'fire');
      spyOn(console, 'error');
    });

    it('409 mostra a mensagem do back (sem forçar CPF)', () => {
      (component as any).handleHttpError({ status: 409, error: { message: 'Email já cadastrado' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Email já cadastrado' }));
    });

    it('409 sem corpo mostra mensagem genérica de duplicidade', () => {
      (component as any).handleHttpError({ status: 409, error: null });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Já existe um cadastro com esses dados. Por favor, verifique as informações.' }));
    });

    it('422 mostra aviso de plano', () => {
      (component as any).handleHttpError({ status: 422, error: { message: 'Plano excedido' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'warning', text: 'Plano excedido' }));
    });

    it('Duplicate entry de email é traduzido', () => {
      (component as any).handleHttpError({ status: 500, error: 'Duplicate entry for key administrador.AdmEmail_UNIQUE' });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Já existe um(a) administrador(a) registrado com esse email.' }));
    });
  });
});
