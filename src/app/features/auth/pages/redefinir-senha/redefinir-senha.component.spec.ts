import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';
import { RedefinirSenhaComponent } from './redefinir-senha.component';

describe('RedefinirSenhaComponent', () => {
  let component: RedefinirSenhaComponent;
  let fixture: ComponentFixture<RedefinirSenhaComponent>;
  let auth: AuthService;

  function criar(token: string | null) {
    TestBed.configureTestingModule({
      declarations: [RedefinirSenhaComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: [
        ...PROVIDERS_TESTE_PADRAO,
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => token } } } },
      ],
      schemas: SCHEMAS_TESTE_PADRAO,
    });
    auth = TestBed.inject(AuthService);
  }

  function iniciar() {
    fixture = TestBed.createComponent(RedefinirSenhaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const erro400 = (message: string, code?: string) =>
    new HttpErrorResponse({ status: 400, error: { message, code } });

  it('sem token mostra link inválido e não chama o back', () => {
    criar(null);
    const espiao = spyOn(auth, 'validarTokenRedefinicao');
    iniciar();
    expect(espiao).not.toHaveBeenCalled();
    expect(component.estado).toBe('invalido');
    expect(fixture.nativeElement.textContent).toContain('Link inválido ou expirado');
  });

  it('token válido mostra o formulário', () => {
    criar('abc');
    spyOn(auth, 'validarTokenRedefinicao').and.returnValue(of({ message: 'ok' }));
    iniciar();
    expect(auth.validarTokenRedefinicao).toHaveBeenCalledWith('abc');
    expect(component.estado).toBe('valido');
    expect(fixture.nativeElement.querySelector('form')).toBeTruthy();
  });

  it('token inválido (400) mostra o estado de link inválido com a mensagem do back', () => {
    criar('abc');
    spyOn(auth, 'validarTokenRedefinicao').and.returnValue(
      throwError(() => erro400('Link expirado.', 'TOKEN_RECUPERACAO_INVALIDO')));
    iniciar();
    expect(component.estado).toBe('invalido');
    expect(fixture.nativeElement.textContent).toContain('Link expirado.');
  });

  describe('formulário', () => {
    beforeEach(() => {
      criar('abc');
      spyOn(auth, 'validarTokenRedefinicao').and.returnValue(of({ message: 'ok' }));
      iniciar();
    });

    it('rejeita senha com menos de 8 caracteres', () => {
      component.FormularioSenha.setValue({ novaSenha: '1234567', confirmacaoSenha: '1234567' });
      expect(component.FormularioSenha.get('novaSenha')?.errors?.['minlength']).toBeTruthy();
      expect(component.FormularioSenha.invalid).toBeTrue();
    });

    it('rejeita senha com mais de 100 caracteres', () => {
      const longa = 'a'.repeat(101);
      component.FormularioSenha.setValue({ novaSenha: longa, confirmacaoSenha: longa });
      expect(component.FormularioSenha.invalid).toBeTrue();
    });

    it('rejeita confirmação diferente e desabilita o botão', () => {
      component.FormularioSenha.setValue({ novaSenha: 'senha1234', confirmacaoSenha: 'outra1234' });
      fixture.detectChanges();
      expect(component.FormularioSenha.errors?.['senhasDiferentes']).toBeTrue();
      expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    });

    it('envio com sucesso notifica e navega para /login', () => {
      const router = TestBed.inject(Router);
      const navegar = spyOn(router, 'navigate').and.resolveTo(true);
      const fire = spyOn(TestBed.inject(NotificacaoService), 'fire').and.resolveTo({} as any);
      const redefinir = spyOn(auth, 'redefinirSenha').and.returnValue(of({ message: 'Senha redefinida.' }));
      component.FormularioSenha.setValue({ novaSenha: 'senha1234', confirmacaoSenha: 'senha1234' });
      component.redefinirSenha();
      expect(redefinir).toHaveBeenCalledWith('abc', 'senha1234');
      expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success' }));
      expect(navegar).toHaveBeenCalledWith(['/login']);
    });

    it('erro de token no envio troca para o estado de link inválido', () => {
      spyOn(auth, 'redefinirSenha').and.returnValue(throwError(() =>
        erro400('Link inválido ou expirado. Solicite uma nova recuperação de senha.', 'TOKEN_RECUPERACAO_INVALIDO')));
      component.FormularioSenha.setValue({ novaSenha: 'senha1234', confirmacaoSenha: 'senha1234' });
      component.redefinirSenha();
      expect(component.estado).toBe('invalido');
    });

    it('erro de validação de senha mantém o formulário e mostra o aviso', () => {
      const fire = spyOn(TestBed.inject(NotificacaoService), 'fire').and.resolveTo({} as any);
      spyOn(auth, 'redefinirSenha').and.returnValue(throwError(() =>
        erro400('A senha deve ter no mínimo 8 caracteres.', 'VALIDACAO')));
      component.FormularioSenha.setValue({ novaSenha: 'senha1234', confirmacaoSenha: 'senha1234' });
      component.redefinirSenha();
      expect(component.estado).toBe('valido');
      expect(fire).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'error', text: 'A senha deve ter no mínimo 8 caracteres.' }));
    });
  });
});
