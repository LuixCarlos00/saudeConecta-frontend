import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';

describe('AuthService - redefinição de senha por link', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, RouterTestingModule] });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('validarTokenRedefinicao faz POST em /Home/redefinirSenha/validar com o token', () => {
    let resposta: any;
    service.validarTokenRedefinicao('tok').subscribe((r) => (resposta = r));
    const req = http.expectOne((r) => r.url.endsWith('/Home/redefinirSenha/validar'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok' });
    req.flush({ message: 'ok' });
    expect(resposta).toEqual({ message: 'ok' });
  });

  it('redefinirSenha faz POST em /Home/redefinirSenha com token e novaSenha', () => {
    service.redefinirSenha('tok', 'senha1234').subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/Home/redefinirSenha'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'tok', novaSenha: 'senha1234' });
    req.flush({ message: 'ok' });
  });
});

describe('AuthService - primeiro acesso (troca de senha obrigatória)', () => {
  /** Monta um JWT sem assinatura válida: o front só lê o payload. */
  function tokenCom(payload: object): string {
    const base64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '');
    const exp = Math.floor(Date.now() / 1000) + 3600;
    return `${base64({ alg: 'HS256' })}.${base64({ id: 1, sub: 'x', aud: '[ROLE_ADMIN]', exp, ...payload })}.assinatura`;
  }

  function criarServico(): AuthService {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule, RouterTestingModule] });
    return TestBed.inject(AuthService);
  }

  afterEach(() => localStorage.removeItem('authToken'));

  it('token com deveTrocarSenha=true indica primeiro acesso', () => {
    const service = criarServico();
    service.handleLoginSuccess(tokenCom({ deveTrocarSenha: true }));
    expect(service.deveTrocarSenha()).toBeTrue();
  });

  it('token com deveTrocarSenha=false ou sem a claim não indica primeiro acesso', () => {
    const service = criarServico();
    service.handleLoginSuccess(tokenCom({ deveTrocarSenha: false }));
    expect(service.deveTrocarSenha()).toBeFalse();
    service.handleLoginSuccess(tokenCom({}));
    expect(service.deveTrocarSenha()).toBeFalse();
  });

  it('sem login não indica primeiro acesso', () => {
    localStorage.removeItem('authToken');
    expect(criarServico().deveTrocarSenha()).toBeFalse();
  });

  it('recarregar a página mantém o primeiro acesso (token no localStorage)', () => {
    localStorage.setItem('authToken', tokenCom({ deveTrocarSenha: true }));
    expect(criarServico().deveTrocarSenha()).toBeTrue();
  });
});
