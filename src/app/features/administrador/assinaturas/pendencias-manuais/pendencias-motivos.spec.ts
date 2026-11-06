import { descreverMotivoPendencia, MOTIVOS_PENDENCIA } from './pendencias-motivos';

describe('pendencias-motivos', () => {
  it('cobre os cinco códigos do contrato, cada um com o que é e o que fazer', () => {
    expect(Object.keys(MOTIVOS_PENDENCIA).sort()).toEqual([
      'EVENTO_EXPIRADO', 'PAGAMENTO_EM_CANCELADA', 'PAGAMENTO_EM_CORTESIA',
      'PAGAMENTO_SEM_ASSINATURA', 'PREAPPROVAL_SUBSTITUIDO_AUTORIZADO'
    ]);
    for (const d of Object.values(MOTIVOS_PENDENCIA)) {
      expect(d.titulo && d.oQueE && d.oQueFazer).toBeTruthy();
    }
  });

  it('código desconhecido, vazio ou nulo devolve null (a tela cai no texto do back)', () => {
    expect(descreverMotivoPendencia('MOTIVO_NOVO')).toBeNull();
    expect(descreverMotivoPendencia('')).toBeNull();
    expect(descreverMotivoPendencia(null)).toBeNull();
    expect(descreverMotivoPendencia(undefined)).toBeNull();
  });

  it('código conhecido devolve a descrição', () => {
    expect(descreverMotivoPendencia('PAGAMENTO_EM_CORTESIA')?.oQueFazer).toBe('Estornar.');
  });
});
