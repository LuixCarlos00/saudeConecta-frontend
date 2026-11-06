import Swal from 'sweetalert2';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroMedicoComponent } from './cadastro-medico.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('CadastroMedicoComponent', () => {
  let component: CadastroMedicoComponent;
  let fixture: ComponentFixture<CadastroMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CadastroMedicoComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CadastroMedicoComponent);
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

    it('422 mostra aviso de plano com a mensagem do back', () => {
      (component as any).handleHttpError({ status: 422, error: { message: 'Plano excedido' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'warning', text: 'Plano excedido' }));
    });

    it('409 com mensagem do back (objeto) mostra a mensagem', () => {
      (component as any).handleHttpError({ status: 409, error: { message: 'CRM já cadastrado' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'CRM já cadastrado' }));
    });

    it('409 com string do back mostra a string', () => {
      (component as any).handleHttpError({ status: 409, error: 'Email já cadastrado no sistema' });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Email já cadastrado no sistema' }));
    });

    it('Duplicate entry de CRM é traduzido', () => {
      (component as any).handleHttpError({ status: 500, error: 'Duplicate entry x for key medico.MedCrm_UNIQUE' });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Já existe um Médico registrado com esse CRM.' }));
    });

    it('sem corpo e status 0 mostra sem conexão', () => {
      (component as any).handleHttpError({ status: 0, error: null });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Sem conexão com o servidor.' }));
    });

    it('sem corpo e 500 mostra erro de servidor', () => {
      (component as any).handleHttpError({ status: 500, error: null });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Erro no servidor, tente novamente.' }));
    });
  });
});
