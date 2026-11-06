import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultaApiService } from './consulta-api.service';

describe('ConsultaApiService.buscarHorariosOcupadosComDuracao', () => {
  let service: ConsultaApiService;
  let ctrl: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ConsultaApiService);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => ctrl.verify());

  it('usa o endpoint detalhado e devolve a duração real', () => {
    let res: any;
    service.buscarHorariosOcupadosComDuracao(1, '2026-11-10', 30).subscribe(r => (res = r));
    const req = ctrl.expectOne(r => r.url.endsWith('/consultas/horarios-ocupados-detalhado'));
    expect(req.request.params.get('medicoId')).toBe('1');
    req.flush([{ inicio: '09:00:00', duracaoMinutos: 60 }]);
    expect(res).toEqual([{ inicio: '09:00:00', duracaoMinutos: 60 }]);
  });

  it('se o detalhado falhar, cai no endpoint antigo com a duração de fallback', () => {
    let res: any;
    service.buscarHorariosOcupadosComDuracao(1, '2026-11-10', 20).subscribe(r => (res = r));
    ctrl.expectOne(r => r.url.endsWith('/horarios-ocupados-detalhado')).flush('x', { status: 500, statusText: 'err' });
    ctrl.expectOne(r => r.url.endsWith('/consultas/horarios-ocupados')).flush(['09:00:00']);
    expect(res).toEqual([{ inicio: '09:00:00', duracaoMinutos: 20 }]);
  });
});
