import { PaginadorPtBr } from './paginador-pt-br';

describe('PaginadorPtBr', () => {
  const p = new PaginadorPtBr();

  it('traduz o rótulo de itens por página', () => {
    expect(p.itemsPerPageLabel).toBe('Itens por página');
  });

  it('mostra a faixa da página em português', () => {
    expect(p.getRangeLabel(0, 20, 63)).toBe('1 – 20 de 63');
    expect(p.getRangeLabel(3, 20, 63)).toBe('61 – 63 de 63');
  });

  it('lista vazia', () => {
    expect(p.getRangeLabel(0, 20, 0)).toBe('0 de 0');
  });
});
