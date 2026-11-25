import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: Router;
  let autenticado: boolean;
  let primeiroAcesso: boolean;
  let logout: jasmine.Spy;

  beforeEach(() => {
    autenticado = true;
    primeiroAcesso = false;
    logout = jasmine.createSpy('logout');
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => autenticado, deveTrocarSenha: () => primeiroAcesso, logout } },
      ],
    });
    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  /** Executa o guard para a URL informada. */
  function abrir(url: string): boolean | UrlTree {
    return guard.canActivate({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot);
  }

  it('logado e sem pendência: libera a rota', () => {
    expect(abrir('/Dashboard')).toBeTrue();
  });

  it('não logado: limpa a sessão e manda para a página inicial', () => {
    autenticado = false;
    const destino = abrir('/Dashboard');
    expect(logout).toHaveBeenCalled();
    expect(router.serializeUrl(destino as UrlTree)).toBe('/');
  });

  it('primeiro acesso: qualquer tela protegida redireciona para /trocaSenha', () => {
    primeiroAcesso = true;
    expect(router.serializeUrl(abrir('/Dashboard') as UrlTree)).toBe('/trocaSenha');
    expect(router.serializeUrl(abrir('/minha-assinatura?x=1') as UrlTree)).toBe('/trocaSenha');
  });

  it('primeiro acesso: a própria tela de troca abre (sem loop de redirect)', () => {
    primeiroAcesso = true;
    expect(abrir('/trocaSenha')).toBeTrue();
    expect(abrir('/trocaSenha?origem=login')).toBeTrue();
  });
});
