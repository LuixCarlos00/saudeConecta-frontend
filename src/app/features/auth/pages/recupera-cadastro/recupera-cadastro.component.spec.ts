/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from 'src/app/core/auth/auth.service';
import { RecuperaCadastroComponent } from './recupera-cadastro.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('RecuperaCadastroComponent', () => {
  let component: RecuperaCadastroComponent;
  let fixture: ComponentFixture<RecuperaCadastroComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RecuperaCadastroComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecuperaCadastroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('enviarEmail', () => {
    beforeEach(() => {
      spyOn(Swal, 'fire');
      component.FormularioEmail.setValue({ email: 'a@b.com' });
    });

    it('mostra a mensagem neutra do back sem afirmar que o e-mail existe', () => {
      const msg = 'Se o e-mail estiver cadastrado, voce recebera as instrucoes para recuperar a senha.';
      spyOn(TestBed.inject(AuthService), 'esqueciMinhaSenha').and.returnValue(of({ message: msg }));
      component.enviarEmail();
      expect(component.emailEnviado).toBeTrue();
      expect(component.mensagemSucesso).toBe(msg);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain('nova senha foi enviada');
    });

    it('usa texto neutro quando a resposta não traz message', () => {
      spyOn(TestBed.inject(AuthService), 'esqueciMinhaSenha').and.returnValue(of({}));
      component.enviarEmail();
      expect(component.mensagemSucesso).toContain('Se o e-mail estiver cadastrado');
    });
  });
});
