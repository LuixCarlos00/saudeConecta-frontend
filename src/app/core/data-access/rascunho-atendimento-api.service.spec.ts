import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { RascunhoAtendimentoResponse } from 'src/app/util/variados/interfaces/Prontuario/RascunhoAtendimento';
import { RascunhoAtendimentoApiService } from './rascunho-atendimento-api.service';

describe('RascunhoAtendimentoApiService', () => {
  let service: RascunhoAtendimentoApiService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/atendimentos`;
  const resposta: RascunhoAtendimentoResponse = {
    consultaId: 822, tipo: 'MEDICO', versao: 4, atualizadoEm: '2026-11-05T14:32:10',
    tempoAcumuladoSegundos: 754,
    dados: { identificacao: {}, exame: {}, planejamento: {}, codigos: {} },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RascunhoAtendimentoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('buscar devolve o rascunho em 200', () => {
    let recebido: RascunhoAtendimentoResponse | null | undefined;
    service.buscar(822).subscribe(r => recebido = r);
    const req = http.expectOne(`${base}/822/rascunho`);
    expect(req.request.method).toBe('GET');
    req.flush(resposta);
    expect(recebido).toEqual(resposta);
  });

  it('buscar devolve null em 204', () => {
    let recebido: RascunhoAtendimentoResponse | null | undefined;
    service.buscar(822).subscribe(r => recebido = r);
    http.expectOne(`${base}/822/rascunho`).flush(null, { status: 204, statusText: 'No Content' });
    expect(recebido).toBeNull();
  });

  it('salvar faz PUT com tipo, dados, tempo e versao', () => {
    const request = { tipo: 'MEDICO' as const, dados: resposta.dados, tempoAcumuladoSegundos: 10, versao: null };
    let recebido: RascunhoAtendimentoResponse | undefined;
    service.salvar(822, request).subscribe(r => recebido = r);
    const req = http.expectOne(`${base}/822/rascunho`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(resposta);
    expect(recebido?.versao).toBe(4);
  });

  it('descartar faz DELETE', () => {
    let concluiu = false;
    service.descartar(822).subscribe(() => concluiu = true);
    const req = http.expectOne(`${base}/822/rascunho`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(concluiu).toBeTrue();
  });

  it('listarMeus chama /rascunhos/meus', () => {
    const lista = [{ consultaId: 822, atualizadoEm: '2026-11-05T14:32:10', tempoAcumuladoSegundos: 754 }];
    let recebido: unknown;
    service.listarMeus().subscribe(r => recebido = r);
    const req = http.expectOne(`${base}/rascunhos/meus`);
    expect(req.request.method).toBe('GET');
    req.flush(lista);
    expect(recebido).toEqual(lista);
  });
});
