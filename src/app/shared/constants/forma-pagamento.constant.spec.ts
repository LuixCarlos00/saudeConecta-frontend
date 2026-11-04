import {
  FORMAS_PAGAMENTO,
  FORMA_PAGAMENTO_ROTULOS,
  idFormaPagamentoPorRotulo,
  rotuloFormaPagamento,
} from './forma-pagamento.constant';

describe('forma-pagamento.constant', () => {
  // Espelha o changelog 012-dados-iniciais-multi-tenant.xml da API (ids gerados na ordem de inserção).
  it('deve espelhar os ids da tabela forma_pagamento do banco', () => {
    expect(FORMA_PAGAMENTO_ROTULOS).toEqual({
      1: 'Particular',
      2: 'Convênio',
      3: 'Cartão de Crédito',
      4: 'Cartão de Débito',
      5: 'PIX',
      6: 'Dinheiro',
    });
  });

  it('deve listar as formas em ordem de id', () => {
    expect(FORMAS_PAGAMENTO.map((f) => f.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('rotuloFormaPagamento deve devolver o rótulo ou "Não informado"', () => {
    expect(rotuloFormaPagamento(5)).toBe('PIX');
    expect(rotuloFormaPagamento(6)).toBe('Dinheiro');
    expect(rotuloFormaPagamento(99)).toBe('Não informado');
    expect(rotuloFormaPagamento(null)).toBe('Não informado');
  });

  it('idFormaPagamentoPorRotulo deve devolver o id ou 0', () => {
    expect(idFormaPagamentoPorRotulo('Cartão de Débito')).toBe(4);
    expect(idFormaPagamentoPorRotulo('Dinheiro')).toBe(6);
    expect(idFormaPagamentoPorRotulo('xyz')).toBe(0);
    expect(idFormaPagamentoPorRotulo(undefined)).toBe(0);
  });
});
