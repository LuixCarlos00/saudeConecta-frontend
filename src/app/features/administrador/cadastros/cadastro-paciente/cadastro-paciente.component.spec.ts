import Swal from 'sweetalert2';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CadastroPacienteComponent } from './cadastro-paciente.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from '../../../../testing/configuracao-teste';

describe('CadastroPacienteComponent', () => {
  let component: CadastroPacienteComponent;
  let fixture: ComponentFixture<CadastroPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CadastroPacienteComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CadastroPacienteComponent);
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

    it('erro de validação (objeto @Valid) não quebra e mostra mensagens', () => {
      (component as any).handleHttpError({ status: 400, error: { nome: 'obrigatório' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'obrigatório' }));
    });

    it('corpo string com Duplicate entry de CPF é traduzido', () => {
      (component as any).handleHttpError({ status: 409, error: 'Duplicate entry paciente.PaciCpf_UNIQUE' });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Já existe um paciente registrado com esse CPF.' }));
    });

    it('corpo objeto com message', () => {
      (component as any).handleHttpError({ status: 400, error: { message: 'Dados inválidos' } });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Dados inválidos' }));
    });

    it('sem corpo e status 0', () => {
      (component as any).handleHttpError({ status: 0, error: null });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'Sem conexão com o servidor.' }));
    });
  });
});
