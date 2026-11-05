import { nomeComTitulo, prefixoTitulo } from './titulo-profissional';

describe('titulo-profissional', () => {
  it('prefixoTitulo: só adiciona título quando o nome não tem', () => {
    expect(prefixoTitulo('Bruna Costa')).toBe('Dr(a). ');
    expect(prefixoTitulo('Dr. Carlos')).toBe('');
    expect(prefixoTitulo('Dra. Bruna')).toBe('');
    expect(prefixoTitulo('dra Ana')).toBe('');
    expect(prefixoTitulo('  Dr Paulo')).toBe('');
    expect(prefixoTitulo('Draco Lima')).toBe('Dr(a). ');
    expect(prefixoTitulo(null)).toBe('');
    expect(prefixoTitulo('   ')).toBe('');
  });

  it('nomeComTitulo: título uma única vez e padrão sem nome', () => {
    expect(nomeComTitulo('Bruna Costa')).toBe('Dr(a). Bruna Costa');
    expect(nomeComTitulo(' Dra. Bruna Costa ')).toBe('Dra. Bruna Costa');
    expect(nomeComTitulo(undefined)).toBe('-');
    expect(nomeComTitulo('', '')).toBe('');
  });
});
