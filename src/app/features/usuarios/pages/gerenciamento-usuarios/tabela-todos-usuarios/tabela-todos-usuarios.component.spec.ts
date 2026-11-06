/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { convertToParamMap } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ModalAssociarPlanoComponent } from 'src/app/features/administrador/gerenciamento-usuarios/tabela-todos-usuarios/modal-associar-plano/modal-associar-plano.component';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TabelaTodosUsuariosComponent } from './tabela-todos-usuarios.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

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

  describe('atalho do dashboard da plataforma (?organizacaoId)', () => {
    let abrir: jasmine.Spy;

    function iniciarComUrl(superAdmin: boolean, query: Record<string, string>): void {
      spyOn(component.controleAcessoService, 'isSuperAdmin').and.returnValue(superAdmin);
      abrir = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({ afterClosed: () => of(false) } as any);
      (component as any).route = { snapshot: { queryParamMap: convertToParamMap(query) } };
      (component as any).abrirPlanoDaOrganizacaoDaUrl();
    }

    it('SUPER_ADMIN com organizacaoId abre o modal de plano da clínica', () => {
      iniciarComUrl(true, { organizacaoId: '12', nome: 'Clínica X' });
      expect(abrir).toHaveBeenCalledWith(ModalAssociarPlanoComponent, jasmine.objectContaining({
        data: { organizacaoId: 12, nomeOrganizacao: 'Clínica X' }
      }));
    });

    it('não abre para quem não é SUPER_ADMIN', () => {
      iniciarComUrl(false, { organizacaoId: '12' });
      expect(abrir).not.toHaveBeenCalled();
    });

    it('não abre sem organizacaoId ou com valor inválido', () => {
      iniciarComUrl(true, { organizacaoId: 'abc' });
      expect(abrir).not.toHaveBeenCalled();
    });
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

  describe('executarAlteracaoStatus', () => {
    const usuario: any = { categoria: 'Administrador', dadosOriginais: { id: 1, usuarioId: 7 } };

    beforeEach(() => {
      spyOn(console, 'error');
      spyOn(component as any, 'mostrarErro');
      spyOn(component as any, 'obterCodigoUsuario').and.returnValue(7);
    });

    it('422 (limite do plano) mostra a mensagem do back ao reativar', () => {
      spyOn((component as any).usuarioApiService, 'bloquearUsuariobyOrg')
        .and.returnValue(throwError(() => ({ status: 422, error: { message: 'Limite do plano atingido' } })));
      (component as any).executarAlteracaoStatus(usuario, 1);
      expect((component as any).mostrarErro).toHaveBeenCalledWith('Limite do plano atingido');
    });

    it('erro sem corpo usa mensagem padrão', () => {
      spyOn((component as any).usuarioApiService, 'bloquearUsuariobyOrg')
        .and.returnValue(throwError(() => ({ status: 500 })));
      (component as any).executarAlteracaoStatus(usuario, 1);
      expect((component as any).mostrarErro).toHaveBeenCalledWith('Erro ao alterar status do usuário.');
    });
  });
});
