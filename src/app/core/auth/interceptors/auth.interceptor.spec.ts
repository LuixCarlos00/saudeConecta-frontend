import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../auth.service';
import { AuthInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: { getToken: () => 'token-velho' } },
        { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  it('envia Bearer em chamadas privadas', () => {
    http.get('/api/paciente').subscribe();
    expect(ctrl.expectOne('/api/paciente').request.headers.get('Authorization')).toBe('Bearer token-velho');
  });

  it('não envia Bearer para /publico/**', () => {
    http.get('/api/publico/questionario/abc').subscribe();
    expect(ctrl.expectOne('/api/publico/questionario/abc').request.headers.has('Authorization')).toBeFalse();
  });

  it('não envia Bearer para arquivos estáticos de assets/', () => {
    http.get('assets/codigos/cid.json').subscribe();
    expect(ctrl.expectOne('assets/codigos/cid.json').request.headers.has('Authorization')).toBeFalse();
  });
});
