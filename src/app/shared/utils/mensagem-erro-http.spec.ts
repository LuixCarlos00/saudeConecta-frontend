import { extrairMensagemErro } from './mensagem-erro-http';

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
