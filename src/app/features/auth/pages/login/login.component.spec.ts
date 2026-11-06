import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from 'src/app/core/auth/auth.service';
import { AssinaturaApiService } from 'src/app/core/data-access/assinatura-api.service';
import { LoginComponent } from './login.component';
import { IMPORTS_TESTE_PADRAO, PROVIDERS_TESTE_PADRAO, SCHEMAS_TESTE_PADRAO } from 'src/app/testing/configuracao-teste';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: IMPORTS_TESTE_PADRAO,
      providers: PROVIDERS_TESTE_PADRAO,
      schemas: SCHEMAS_TESTE_PADRAO
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('handleLoginError', () => {
    let handler: any;
    beforeEach(() => {
      handler = (component as any).notificacao;
      spyOn(handler, 'showError');
      spyOn(handler, 'showWarning');
      spyOn(console, 'error');
    });

    it('401 mostra "Email ou senha inválidos"', () => {
      (component as any).handleLoginError({ status: 401 });
      expect(handler.showError).toHaveBeenCalledWith('Email ou senha inválidos');
    });

    it('401 com {error} do back mostra a mensagem do back', () => {
      (component as any).handleLoginError({ status: 401, error: { error: 'Usuario bloqueado' } });
      expect(handler.showError).toHaveBeenCalledWith('Usuario bloqueado');
    });

    it('403 com mensagem do back mostra aviso de acesso bloqueado', () => {
      (component as any).handleLoginError({ status: 403, error: { message: 'Conta bloqueada' } });
      expect(handler.showWarning).toHaveBeenCalledWith('Conta bloqueada', 'Acesso bloqueado');
    });

    it('403 sem mensagem mostra "Email ou senha inválidos"', () => {
      (component as any).handleLoginError({ status: 403 });
      expect(handler.showError).toHaveBeenCalledWith('Email ou senha inválidos');
    });

    it('status 0 mostra "Sem conexão com o servidor"', () => {
      (component as any).handleLoginError({ status: 0 });
      expect(handler.showError).toHaveBeenCalledWith('Sem conexão com o servidor');
    });

    it('5xx mostra "Erro no servidor, tente novamente"', () => {
      (component as any).handleLoginError({ status: 503 });
      expect(handler.showError).toHaveBeenCalledWith('Erro no servidor, tente novamente');
    });

    it('outro status (ex.: 400) mostra mensagem do back se houver', () => {
      (component as any).handleLoginError({ status: 400, error: { message: 'Perfil inválido' } });
      expect(handler.showError).toHaveBeenCalledWith('Perfil inválido');
    });
  });

  describe('destino após o login', () => {
    let navigate: jasmine.Spy;
    let auth: AuthService;
    let api: AssinaturaApiService;

    beforeEach(() => {
      navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      auth = TestBed.inject(AuthService);
      api = TestBed.inject(AssinaturaApiService);
    });

    it('ADMIN com assinatura SUSPENSA vai direto para /minha-assinatura (uma única navegação, sem passar pelo Dashboard)', () => {
      spyOn(auth, 'isOrgAdmin').and.returnValue(true);
      spyOn(api, 'minhaAssinatura').and.returnValue(of({ status: 'SUSPENSA' } as any));
      (component as any).navegarAposLogin();
      expect(navigate).toHaveBeenCalledOnceWith(['/minha-assinatura']);
    });

    it('ADMIN com assinatura ATIVA vai para o Dashboard', () => {
      spyOn(auth, 'isOrgAdmin').and.returnValue(true);
      spyOn(api, 'minhaAssinatura').and.returnValue(of({ status: 'ATIVA' } as any));
      (component as any).navegarAposLogin();
      expect(navigate).toHaveBeenCalledOnceWith(['/Dashboard']);
    });

    it('falha ao consultar a assinatura cai no Dashboard', () => {
      spyOn(auth, 'isOrgAdmin').and.returnValue(true);
      spyOn(api, 'minhaAssinatura').and.returnValue(throwError(() => ({ status: 500 })));
      (component as any).navegarAposLogin();
      expect(navigate).toHaveBeenCalledOnceWith(['/Dashboard']);
    });

    it('perfil sem acesso à tela de assinatura (profissional/super admin) nem consulta e vai ao Dashboard', () => {
      spyOn(auth, 'isOrgAdmin').and.returnValue(false);
      spyOn(auth, 'isRecepcionista').and.returnValue(false);
      const consulta = spyOn(api, 'minhaAssinatura');
      (component as any).navegarAposLogin();
      expect(consulta).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledOnceWith(['/Dashboard']);
    });
  });
});
