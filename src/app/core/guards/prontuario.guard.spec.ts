import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import Swal from 'sweetalert2';
import { ProntuarioGuard } from './prontuario.guard';

describe('ProntuarioGuard', () => {
  let guard: ProntuarioGuard;
  let router: Router;
  const consulta$ = new BehaviorSubject<any>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: ProntuarioStateService, useValue: { consulta$ } }],
    });
    guard = TestBed.inject(ProntuarioGuard);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
  });

  it('sem consulta redireciona para agenda-calendario', fakeAsync(() => {
    consulta$.next(null);
    expect(guard.canActivate({} as any, {} as any)).toBeFalse();
    flushMicrotasks();
    expect(router.navigate).toHaveBeenCalledWith(['/agenda-calendario']);
  }));

  it('consulta incompleta redireciona para agenda-calendario', fakeAsync(() => {
    consulta$.next({ id: 1 });
    expect(guard.canActivate({} as any, {} as any)).toBeFalse();
    flushMicrotasks();
    expect(router.navigate).toHaveBeenCalledWith(['/agenda-calendario']);
  }));

  it('consulta completa libera acesso', () => {
    consulta$.next({ id: 1, pacienteNome: 'A', profissionalId: 2 });
    expect(guard.canActivate({} as any, {} as any)).toBeTrue();
  });
});
