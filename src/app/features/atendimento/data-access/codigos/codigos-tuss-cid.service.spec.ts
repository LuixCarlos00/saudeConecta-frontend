import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CodigosTussCidService } from './codigos-tuss-cid.service';

describe('CodigosTussCidService', () => {
  let service: CodigosTussCidService;
  let http: HttpTestingController;

  const TUSS = [
    { codigo: '10101012', descricao: 'Consulta em consultório (no horário normal ou preestabelecido)', fabricante: 'Sem Dados', tabela: 22 },
    { codigo: '10101020', descricao: 'Consulta em domicílio', fabricante: 'Sem Dados', tabela: 22 },
    { codigo: '10101039', descricao: 'Consulta em pronto socorro', fabricante: 'Sem Dados', tabela: 22 },
    { codigo: '40301630', descricao: 'Hemograma', fabricante: 'Sem Dados', tabela: 22 },
  ];
  const CID = [
    { codigo: 'A00', label: 'Cólera' },
    { codigo: 'A00.0', label: 'Cólera Devida a Vibrio Cholerae 01, Biótipo Cholerae' },
    { codigo: 'A01', label: 'Febres Tifóide e Paratifóide' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CodigosTussCidService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('não baixa nada até a primeira busca; carrega TUSS sob demanda e reutiliza o mesmo carregamento (cache)', async () => {
    http.expectNone('assets/codigos/tuss.json');
    const a = service.carregarTuss();
    expect(service.carregarTuss()).toBe(a);
    http.expectOne('assets/codigos/tuss.json').flush(TUSS);
    expect(await a).toEqual(TUSS);
    expect(await service.carregarTuss()).toEqual(TUSS);
    http.expectNone('assets/codigos/tuss.json');
  });

  it('CID e TUSS vêm de arquivos separados, cada um baixado só quando usado', async () => {
    const r = service.buscarCid('a00', 15);
    http.expectOne('assets/codigos/cid.json').flush(CID);
    expect((await r).map(i => i.codigo)).toEqual(['A00', 'A00.0']);
    http.expectNone('assets/codigos/tuss.json');
  });

  it('buscarTuss filtra por código ou descrição (sem diferenciar maiúsculas) e respeita o máximo', async () => {
    const porCodigo = service.buscarTuss('10101012', 15);
    http.expectOne('assets/codigos/tuss.json').flush(TUSS);
    expect((await porCodigo).map(i => i.codigo)).toEqual(['10101012']);
    const porDescricao = await service.buscarTuss('CONSULTA', 2);
    expect(porDescricao.map(i => i.codigo)).toEqual(['10101012', '10101020']);
  });

  it('buscarCid filtra por código ou descrição', async () => {
    const r = service.buscarCid('a00', 15);
    http.expectOne('assets/codigos/cid.json').flush(CID);
    expect((await r).map(i => i.codigo)).toEqual(['A00', 'A00.0']);
    expect((await service.buscarCid('cólera', 2)).length).toBe(2);
  });

  it('termo sem correspondência retorna lista vazia', async () => {
    const r = service.buscarCid('zzzzzzzzqqq', 15);
    http.expectOne('assets/codigos/cid.json').flush(CID);
    expect(await r).toEqual([]);
  });

  it('se o download falhar, a busca rejeita e a próxima tenta baixar de novo', async () => {
    const falha = service.buscarTuss('consulta', 5);
    http.expectOne('assets/codigos/tuss.json').flush('erro', { status: 500, statusText: 'Server Error' });
    await expectAsync(falha).toBeRejected();

    const nova = service.buscarTuss('consulta', 5);
    http.expectOne('assets/codigos/tuss.json').flush(TUSS);
    expect((await nova).length).toBe(3);
  });
});
