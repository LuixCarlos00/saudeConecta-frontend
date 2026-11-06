import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { VisualizarEditarUsuarioComponent } from './visualizar-editar-usuario.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('VisualizarEditarUsuarioComponent', () => {
  let component: VisualizarEditarUsuarioComponent;
  let fixture: ComponentFixture<VisualizarEditarUsuarioComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [VisualizarEditarUsuarioComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [...PROVIDERS_TESTE_PADRAO, { provide: MAT_DIALOG_DATA, useValue: { usuario: { categoria: 'Secretaria' } } }],
      schemas: SCHEMAS_TESTE_PADRAO
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VisualizarEditarUsuarioComponent);
    component = fixture.componentInstance;
  });

  describe('handleErroAtualizacao', () => {
    beforeEach(() => {
      spyOn(Swal, 'fire');
      spyOn(console, 'error');
    });

    it('409 com texto puro (e-mail em uso) mostra a mensagem do back', () => {
      (component as any).handleErroAtualizacao({ status: 409, error: 'Email ja esta em uso' });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Email ja esta em uso' }));
    });

    it('sem corpo usa mensagem padrão', () => {
      (component as any).handleErroAtualizacao({ status: 500 });
      expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({ text: 'Não foi possível atualizar os dados. Tente novamente.' }));
    });
  });
});
