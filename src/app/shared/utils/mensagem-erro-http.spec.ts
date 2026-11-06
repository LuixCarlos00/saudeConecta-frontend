import { extrairCodigoErro, extrairMensagemErro, MENSAGEM_MP_VALOR_NAO_ATUALIZADO, mensagemErroAssinaturaAdmin, mensagemErroTrocaPlano } from './mensagem-erro-http';

describe('extrairMensagemErro', () => {
  it('corpo string', () => expect(extrairMensagemErro({ error: ' CPF inválido ' })).toBe('CPF inválido'));
  it('objeto com message', () => expect(extrairMensagemErro({ error: { message: 'Plano excedido' } })).toBe('Plano excedido'));
  it('lista errors (strings e defaultMessage)', () => {
    expect(extrairMensagemErro({ error: { errors: ['a', { defaultMessage: 'b' }] } })).toBe('a\nb');
  });
  it('mapa campo->mensagem do @Valid', () => {
    expect(extrairMensagemErro({ error: { nome: 'obrigatório', cpf: 'inválido' } })).toBe('obrigatório\ninválido');
  });
  it('ErrorResponse 400: errors (mapa) vence message, uma por linha', () => {
    const error = { status: 400, message: 'nome: obrigatório; cpf: inválido', errors: { nome: 'obrigatório', cpf: 'inválido' } };
    expect(extrairMensagemErro({ error })).toBe('obrigatório\ninválido');
  });
  it('ErrorResponse sem errors: usa message', () => {
    expect(extrairMensagemErro({ error: { status: 409, error: 'x', message: 'Conflito' } })).toBe('Conflito');
  });
  it('apenas { error } (401 login)', () => {
    expect(extrairMensagemErro({ error: { error: 'Credenciais invalidas' } })).toBe('Credenciais invalidas');
  });
  it('sem corpo ou vazio retorna null', () => {
    expect(extrairMensagemErro({ error: null })).toBeNull();
    expect(extrairMensagemErro({ error: {} })).toBeNull();
    expect(extrairMensagemErro(undefined)).toBeNull();
    expect(extrairMensagemErro({ error: '  ' })).toBeNull();
  });
});

describe('extrairCodigoErro e mensagemErroTrocaPlano', () => {
  it('extrai o code do corpo; sem code devolve null', () => {
    expect(extrairCodigoErro({ error: { code: 'PLANO_SEM_ACESSO' } })).toBe('PLANO_SEM_ACESSO');
    expect(extrairCodigoErro({ error: { message: 'x' } })).toBeNull();
    expect(extrairCodigoErro({ error: 'texto' })).toBeNull();
    expect(extrairCodigoErro(null)).toBeNull();
  });

  it('502 MP_VALOR_NAO_ATUALIZADO usa o texto próprio; outros usam o back ou o padrão', () => {
    expect(mensagemErroTrocaPlano({ error: { code: 'MP_VALOR_NAO_ATUALIZADO', message: 'interno' } }, 'padrão'))
      .toBe(MENSAGEM_MP_VALOR_NAO_ATUALIZADO);
    expect(mensagemErroTrocaPlano({ error: { message: 'Limite excedido' } }, 'padrão')).toBe('Limite excedido');
    expect(mensagemErroTrocaPlano({}, 'padrão')).toBe('padrão');
  });
});

describe('mensagemErroAssinaturaAdmin', () => {
  const erro = (status: number, code?: string, message = 'msg do back') => ({ status, error: { code, message } });

  it('traduz os códigos do contrato', () => {
    expect(mensagemErroAssinaturaAdmin(erro(409, 'ASSINATURA_CANCELADA'), 'p')).toContain('cancelada');
    expect(mensagemErroAssinaturaAdmin(erro(409, 'ASSINATURA_SUSPENSA'), 'p')).toContain('Clínica suspensa');
    expect(mensagemErroAssinaturaAdmin(erro(409, 'PREAPPROVAL_SUBSTITUIDO_EM_ANALISE'), 'p')).toContain('pagamento anterior em análise');
    expect(mensagemErroAssinaturaAdmin(erro(502, 'MP_VALOR_NAO_ATUALIZADO'), 'p')).toContain('não aceitou o novo valor');
    expect(mensagemErroAssinaturaAdmin(erro(409, 'PENDENCIA_JA_RESOLVIDA'), 'p')).toContain('já foi resolvida');
    expect(mensagemErroAssinaturaAdmin(erro(403, 'ACESSO_NEGADO'), 'p')).toContain('permissão');
  });

  it('503 sem código fala da integração; código desconhecido usa a mensagem do back; sem nada usa o padrão', () => {
    expect(mensagemErroAssinaturaAdmin({ status: 503, error: {} }, 'p')).toContain('Mercado Pago indisponível');
    expect(mensagemErroAssinaturaAdmin(erro(502, 'BUSINESS_ERROR', 'MP fora do ar'), 'p')).toBe('MP fora do ar');
    expect(mensagemErroAssinaturaAdmin({ status: 0 }, 'padrão')).toBe('padrão');
  });
});
