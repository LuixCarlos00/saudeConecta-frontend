import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Role } from 'src/app/shared/constants/roles.constant';
import { AuthService } from '../auth.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let roleAtual = '';

  const rota = (roles: Role[]) => ({ data: { roles } } as unknown as ActivatedRouteSnapshot);
  const estado = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useValue: { getUserRole: () => roleAtual } }],
    });
    guard = TestBed.inject(RoleGuard);
  });

  it('SUPER_ADMIN passa mesmo com roles em ordem diferente', () => {
    roleAtual = '[ROLE_RECEPCIONISTA, ROLE_SUPER_ADMIN, ROLE_ADMIN]';
    expect(guard.canActivate(rota([Role.SUPER_ADMIN]), estado)).toBeTrue();
  });

  it('SUPER_ADMIN passa com a string exata', () => {
    roleAtual = Role.SUPER_ADMIN;
    expect(guard.canActivate(rota([Role.SUPER_ADMIN]), estado)).toBeTrue();
  });

  it('nega SUPER_ADMIN quando o usuário só é admin de organização', () => {
    roleAtual = '[ROLE_ADMIN, ROLE_PROFISSIONAL]';
    const r = guard.canActivate(rota([Role.SUPER_ADMIN]), estado);
    expect(r instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/login');
  });

  it('permite rota sem roles definidas', () => {
    roleAtual = '';
    expect(guard.canActivate(rota([]), estado)).toBeTrue();
  });
});
