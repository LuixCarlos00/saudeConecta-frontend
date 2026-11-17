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
