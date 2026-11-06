import { CodigosTussCidService } from './codigos-tuss-cid.service';

describe('CodigosTussCidService', () => {
  let service: CodigosTussCidService;
  beforeEach(() => { service = new CodigosTussCidService(); });

  it('carrega TUSS sob demanda e reutiliza o mesmo carregamento (cache)', async () => {
    const a = service.carregarTuss();
    expect(service.carregarTuss()).toBe(a);
    expect((await a).length).toBeGreaterThan(1000);
  });

  it('buscarTuss filtra por código ou descrição e respeita o máximo', async () => {
    const porCodigo = await service.buscarTuss('10101012', 15);
    expect(porCodigo.some(i => i.codigo === '10101012')).toBeTrue();
    const porDescricao = await service.buscarTuss('CONSULTA', 3);
    expect(porDescricao.length).toBe(3);
  });

  it('buscarCid filtra por código ou descrição', async () => {
    const r = await service.buscarCid('a00', 15);
    expect(r.some(i => i.codigo === 'A00')).toBeTrue();
    expect(await service.buscarCid('cólera', 2)).not.toEqual([]);
  });

  it('termo sem correspondência retorna lista vazia', async () => {
    expect(await service.buscarCid('zzzzzzzzqqq', 15)).toEqual([]);
  });
});
