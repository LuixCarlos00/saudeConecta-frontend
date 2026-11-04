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
  it('sem corpo ou vazio retorna null', () => {
    expect(extrairMensagemErro({ error: null })).toBeNull();
    expect(extrairMensagemErro({ error: {} })).toBeNull();
    expect(extrairMensagemErro(undefined)).toBeNull();
    expect(extrairMensagemErro({ error: '  ' })).toBeNull();
  });
});
