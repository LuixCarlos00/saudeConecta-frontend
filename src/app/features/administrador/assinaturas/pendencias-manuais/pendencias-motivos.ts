/** Significado de um `motivoCodigo` de pendência manual e o que o SUPER_ADMIN faz no painel do Mercado Pago. */
export interface DescricaoMotivoPendencia {
  titulo: string;
  oQueE: string;
  oQueFazer: string;
}

/** Tabela do contrato admin-assinaturas, seção 3.1. */
export const MOTIVOS_PENDENCIA: Readonly<Record<string, DescricaoMotivoPendencia>> = {
  PAGAMENTO_EM_CANCELADA: {
    titulo: 'Pagamento em assinatura cancelada',
    oQueE: 'Fatura aprovada de uma assinatura que já estava CANCELADA.',
    oQueFazer: 'Estornar ou reativar manualmente.'
  },
  PAGAMENTO_EM_CORTESIA: {
    titulo: 'Pagamento em cortesia',
    oQueE: 'Fatura aprovada de uma assinatura em cortesia (que não renova).',
    oQueFazer: 'Estornar.'
  },
  PAGAMENTO_SEM_ASSINATURA: {
    titulo: 'Pagamento sem assinatura',
    oQueE: 'Fatura aprovada de um preapproval que não tem assinatura vinculada.',
    oQueFazer: 'Conferir e registrar manualmente.'
  },
  PREAPPROVAL_SUBSTITUIDO_AUTORIZADO: {
    titulo: 'Pagamento antigo autorizado',
    oQueE: 'Um preapproval que saiu da assinatura (link novo, troca ou cortesia) foi autorizado ou tem fatura aprovada sem registro.',
    oQueFazer: 'Estornar e cancelar no Mercado Pago, ou religar.'
  },
  EVENTO_EXPIRADO: {
    titulo: 'Notificação expirada',
    oQueE: 'Webhook com erro que esgotou as tentativas de reprocessamento.',
    oQueFazer: 'Conferir o recurso no Mercado Pago.'
  }
};

/**
 * Descrição de um código de motivo; código novo que o front ainda não conhece cai no texto original do back.
 *
 * @param codigo `motivoCodigo` da pendência
 * @returns descrição conhecida ou null
 */
export function descreverMotivoPendencia(codigo: string | null | undefined): DescricaoMotivoPendencia | null {
  return (codigo && MOTIVOS_PENDENCIA[codigo]) || null;
}
