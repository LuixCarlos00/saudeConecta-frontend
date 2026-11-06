import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PlataformaDashboardApiService } from './plataforma-dashboard-api.service';
import { environment } from 'src/environments/environment';

describe('PlataformaDashboardApiService', () => {
  let service: PlataformaDashboardApiService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/plataforma/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PlataformaDashboardApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envia meses como query param', () => {
    service.buscar(6).subscribe();
    const req = http.expectOne(r => r.url === url);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('meses')).toBe('6');
    req.flush({});
  });

  it('não envia meses quando omitido (back assume 12)', () => {
    service.buscar().subscribe();
    const req = http.expectOne(r => r.url === url);
    expect(req.request.params.has('meses')).toBeFalse();
    req.flush({});
  });

  it('devolve o corpo da resposta', () => {
    let geradoEm = '';
    service.buscar(12).subscribe(d => (geradoEm = d.geradoEm));
    http.expectOne(r => r.url === url).flush({ geradoEm: '2026-11-05T15:20:00' });
    expect(geradoEm).toBe('2026-11-05T15:20:00');
  });

  it('propaga erro HTTP (ex.: 403)', () => {
    let status = 0;
    service.buscar(12).subscribe({ error: e => (status = e.status) });
    http.expectOne(r => r.url === url).flush('x', { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
  });
});
