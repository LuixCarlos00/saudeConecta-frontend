/**
 * Fonte única das formas de pagamento. Os ids precisam espelhar a tabela forma_pagamento
 * (changelog 012-dados-iniciais-multi-tenant.xml da API), que gera os ids na ordem de inserção.
 */
export const FORMA_PAGAMENTO_ROTULOS: Readonly<Record<number, string>> = {
  1: 'Particular',
  2: 'Convênio',
  3: 'Cartão de Crédito',
  4: 'Cartão de Débito',
  5: 'PIX',
  6: 'Dinheiro',
};

/** Formas de pagamento em ordem de id, prontas para iterar em templates. */
export const FORMAS_PAGAMENTO: ReadonlyArray<{ id: number; rotulo: string }> = Object.entries(
  FORMA_PAGAMENTO_ROTULOS
).map(([id, rotulo]) => ({ id: Number(id), rotulo }));

/**
 * Rótulo da forma de pagamento.
 * @param id id da forma de pagamento
 * @returns rótulo, ou 'Não informado' quando o id é desconhecido
 */
export function rotuloFormaPagamento(id: number | null | undefined): string {
  return (id != null && FORMA_PAGAMENTO_ROTULOS[id]) || 'Não informado';
}

/**
 * Id da forma de pagamento a partir do rótulo exibido nos selects.
 * @param rotulo texto da opção selecionada
 * @returns id correspondente, ou 0 quando não houver correspondência
 */
export function idFormaPagamentoPorRotulo(rotulo: string | null | undefined): number {
  return FORMAS_PAGAMENTO.find((f) => f.rotulo === rotulo)?.id ?? 0;
}
