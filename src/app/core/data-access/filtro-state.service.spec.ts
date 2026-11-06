import { FiltroStateService } from './filtro-state.service';

describe('FiltroStateService - recarregar/carregando', () => {
  let service: FiltroStateService;

  beforeEach(() => { service = new FiltroStateService(); });

  it('recarregar$ NÃO reemite valor antigo para quem assina depois (evita carga dupla)', () => {
    service.setRecarregar(true);
    const recebidos: boolean[] = [];
    service.recarregar$.subscribe((v) => recebidos.push(v));
    expect(recebidos).toEqual([]);
  });

  it('recarregar$ emite a cada pedido de recarga', () => {
    const recebidos: boolean[] = [];
    service.recarregar$.subscribe((v) => recebidos.push(v));
    service.setRecarregar(true);
    service.setRecarregar(true);
    expect(recebidos).toEqual([true, true]);
  });

  it('carregando$ começa false e reflete setCarregando', () => {
    const recebidos: boolean[] = [];
    service.carregando$.subscribe((v) => recebidos.push(v));
    service.setCarregando(true);
    service.setCarregando(false);
    expect(recebidos).toEqual([false, true, false]);
  });
});
