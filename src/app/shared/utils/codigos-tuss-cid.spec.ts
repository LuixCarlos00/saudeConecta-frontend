import { extrairItensCodigo, extrairItensSolicitacaoExame } from './codigos-tuss-cid';

describe('codigos-tuss-cid', () => {
  it('extrairItensCodigo lê as linhas "n. [codigo] descricao" e ignora texto livre', () => {
    const texto = '1. [10101012] Consulta em consultório\n2. [10101039] Consulta de urgência\nobservação solta';
    expect(extrairItensCodigo(texto)).toEqual([
      { codigo: '10101012', descricao: 'Consulta em consultório' },
      { codigo: '10101039', descricao: 'Consulta de urgência' },
    ]);
  });

  it('extrairItensCodigo devolve lista vazia para texto vazio ou nulo', () => {
    expect(extrairItensCodigo('')).toEqual([]);
    expect(extrairItensCodigo(null)).toEqual([]);
    expect(extrairItensCodigo(undefined)).toEqual([]);
  });

  it('extrairItensSolicitacaoExame separa TUSS e CID pelos cabeçalhos', () => {
    const texto = 'TUSS:\n  1. [40304361] Hemograma\n  2. [40301630] Glicose\n\nCID:\n  1. [Z01.4] Exame ginecológico';
    expect(extrairItensSolicitacaoExame(texto)).toEqual({
      tuss: [{ codigo: '40304361', descricao: 'Hemograma' }, { codigo: '40301630', descricao: 'Glicose' }],
      cid: [{ codigo: 'Z01.4', descricao: 'Exame ginecológico' }],
    });
  });

  it('extrairItensSolicitacaoExame sem cabeçalho não inventa itens', () => {
    expect(extrairItensSolicitacaoExame('Colpocitologia; Mamografia')).toEqual({ tuss: [], cid: [] });
  });
});
