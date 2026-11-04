import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { ErrorInterceptor } from './error.interceptor';

describe('ErrorInterceptor (401)', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let logout: jasmine.Spy;
  let urlAtual = '/Dashboard';

  beforeEach(() => {
    logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { logout } },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    spyOnProperty(TestBed.inject(Router), 'url', 'get').and.callFake(() => urlAtual);
  });

  const dispara401 = (url: string) => {
    http.get(url).subscribe({ error: () => {} });
    ctrl.expectOne(url).flush({}, { status: 401, statusText: 'Unauthorized' });
  };

  it('faz logout em 401 de rota privada', () => {
    urlAtual = '/Dashboard';
    dispara401('/api/paciente');
    expect(logout).toHaveBeenCalled();
  });

  it('não faz logout em 401 de chamada /publico/', () => {
    urlAtual = '/Dashboard';
    dispara401('/api/publico/questionario/abc');
    expect(logout).not.toHaveBeenCalled();
  });

  it('não faz logout em 401 quando a rota atual é pública', () => {
    urlAtual = '/questionario-saude/abc123?x=1';
    dispara401('/api/qualquer');
    expect(logout).not.toHaveBeenCalled();
    urlAtual = '/cadastro';
    dispara401('/api/qualquer');
    expect(logout).not.toHaveBeenCalled();
  });

  it('rota que só começa com o nome de uma pública (cadastroadmin) continua com logout', () => {
    urlAtual = '/cadastroadmin';
    dispara401('/api/qualquer');
    expect(logout).toHaveBeenCalled();
  });
});

describe('ErrorInterceptor (403 plano suspenso)', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let logout: jasmine.Spy;
  let navigate: jasmine.Spy;
  let papel = '[ROLE_ADMIN]';
  const MSG = 'O plano da sua organizacao esta suspenso. Regularize o pagamento.';

  beforeEach(() => {
    logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { logout, getUserRole: () => papel } },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    spyOnProperty(router, 'url', 'get').and.returnValue('/Dashboard');
    navigate = spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
  });

  const dispara403 = (corpo: any) => {
    http.get('/api/qualquer').subscribe({ error: () => {} });
    ctrl.expectOne('/api/qualquer').flush(corpo, { status: 403, statusText: 'Forbidden' });
  };

  it('admin: mostra aviso, vai para minha-assinatura e não faz logout', () => {
    papel = '[ROLE_ADMIN]';
    dispara403({ message: MSG });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/minha-assinatura']);
    expect(logout).not.toHaveBeenCalled();
  });

  it('não repete o aviso em vários 403 seguidos', () => {
    papel = '[ROLE_ADMIN]';
    dispara403({ message: MSG });
    dispara403({ message: MSG });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
  });

  it('médico: só o aviso, sem redirecionar', () => {
    papel = '[ROLE_Medico]';
    dispara403({ message: MSG });
    expect(Swal.fire).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('403 comum (sem mensagem de plano) não mostra aviso', () => {
    papel = '[ROLE_ADMIN]';
    dispara403({ message: 'Acesso negado' });
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
