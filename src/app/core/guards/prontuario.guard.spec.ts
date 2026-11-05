import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, convertToParamMap, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { ConsultaApiService } from 'src/app/services/api/consulta-api.service';
import { ProntuarioStateService } from 'src/app/services/state/prontuario-state.service';
import { tokenService } from 'src/app/util/Token/Token.service';
import Swal from 'sweetalert2';
import { ProntuarioGuard } from './prontuario.guard';

describe('ProntuarioGuard', () => {
  let guard: ProntuarioGuard;
  let router: Router;
  let consulta$: BehaviorSubject<any>;
  let setConsulta: jasmine.Spy;
  let consultaApi: jasmine.SpyObj<ConsultaApiService>;

  const completa = { id: 1, pacienteNome: 'A', profissionalId: 2, status: 'CONFIRMADA' };

  function rota(path: string, consultaId?: string): ActivatedRouteSnapshot {
    return {
      routeConfig: { path },
      paramMap: convertToParamMap(consultaId ? { consultaId } : {}),
    } as unknown as ActivatedRouteSnapshot;
  }

  beforeEach(() => {
    consulta$ = new BehaviorSubject<any>(null);
    setConsulta = jasmine.createSpy('setConsulta');
    consultaApi = jasmine.createSpyObj('ConsultaApiService', ['buscarPorId', 'buscarAgendaMedico']);
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: ProntuarioStateService, useValue: { consulta$, setConsulta } },
        { provide: ConsultaApiService, useValue: consultaApi },
        { provide: tokenService, useValue: { obterUsuarioId: () => 99 } },
      ],
    });
    guard = TestBed.inject(ProntuarioGuard);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
  });

  it('sem consulta e sem id redireciona para agenda-calendario', fakeAsync(() => {
    expect(guard.canActivate(rota('startconsulta'), {} as any)).toBeFalse();
    flushMicrotasks();
    expect(router.navigate).toHaveBeenCalledWith(['/agenda-calendario']);
  }));

  it('consulta incompleta redireciona para agenda-calendario', fakeAsync(() => {
    consulta$.next({ id: 1 });
    expect(guard.canActivate(rota('startconsulta', '1'), {} as any)).toBeFalse();
    flushMicrotasks();
    expect(router.navigate).toHaveBeenCalledWith(['/agenda-calendario']);
  }));

  it('com estado em memoria e id igual na URL libera acesso sem chamar a API', () => {
    consulta$.next(completa);
    expect(guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any)).toBeTrue();
    expect(consultaApi.buscarPorId).not.toHaveBeenCalled();
  });

  it('com estado em memoria e rota sem id redireciona para a rota com id (medico)', () => {
    consulta$.next(completa);
    const resultado = guard.canActivate(rota('startconsulta'), {} as any) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/startconsulta/1');
  });

  it('com estado em memoria e rota sem id redireciona para a rota com id (dentista)', () => {
    consulta$.next(completa);
    const resultado = guard.canActivate(rota('startconsulta-dentista'), {} as any) as UrlTree;
    expect(router.serializeUrl(resultado)).toBe('/startconsulta-dentista/1');
  });

  describe('com id na URL e sem estado em memoria', () => {
    it('carrega pela API, confere o dono, poe no state e libera', (done) => {
      consultaApi.buscarPorId.and.returnValue(of(completa as any));
      consultaApi.buscarAgendaMedico.and.returnValue(of([{ id: 1 }]));
      (guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any) as Observable<boolean>)
        .subscribe(ok => {
          expect(ok).toBeTrue();
          expect(consultaApi.buscarPorId).toHaveBeenCalledWith(1);
          expect(setConsulta).toHaveBeenCalledWith(completa);
          done();
        });
    });

    it('bloqueia quando a consulta nao e do profissional logado', (done) => {
      consultaApi.buscarPorId.and.returnValue(of(completa as any));
      consultaApi.buscarAgendaMedico.and.returnValue(of([{ id: 77 }]));
      (guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any) as Observable<boolean>)
        .subscribe(ok => {
          expect(ok).toBeFalse();
          expect(setConsulta).not.toHaveBeenCalled();
          expect(Swal.fire).toHaveBeenCalled();
          done();
        });
    });

    for (const status of ['REALIZADA', 'PAGO', 'CANCELADA']) {
      it(`bloqueia consulta ${status}`, (done) => {
        consultaApi.buscarPorId.and.returnValue(of({ ...completa, status } as any));
        (guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any) as Observable<boolean>)
          .subscribe(ok => {
            expect(ok).toBeFalse();
            expect(consultaApi.buscarAgendaMedico).not.toHaveBeenCalled();
            expect(setConsulta).not.toHaveBeenCalled();
            done();
          });
      });
    }

    it('bloqueia quando a API falha (404 etc.)', (done) => {
      consultaApi.buscarPorId.and.returnValue(throwError(() => ({ status: 404 })));
      (guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any) as Observable<boolean>)
        .subscribe(ok => {
          expect(ok).toBeFalse();
          done();
        });
    });

    it('estado em memoria de outra consulta e ignorado e a URL manda', (done) => {
      consulta$.next({ ...completa, id: 5 });
      consultaApi.buscarPorId.and.returnValue(of(completa as any));
      consultaApi.buscarAgendaMedico.and.returnValue(of([{ id: 1 }]));
      (guard.canActivate(rota('startconsulta/:consultaId', '1'), {} as any) as Observable<boolean>)
        .subscribe(ok => {
          expect(ok).toBeTrue();
          expect(consultaApi.buscarPorId).toHaveBeenCalledWith(1);
          done();
        });
    });
  });
});
