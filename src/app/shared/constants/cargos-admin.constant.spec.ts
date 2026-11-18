import { CARGOS_ADMIN, CARGOS_ADMIN_OPCOES, cargoDaLista } from './cargos-admin.constant';

describe('cargos-admin.constant', () => {
  it('tem os cinco cargos aceitos pelo back, na ordem das telas', () => {
    expect([...CARGOS_ADMIN]).toEqual(['Responsável', 'Diretor(a)', 'Gerente', 'Administrador(a)', 'Coordenador(a)']);
  });

  it('opções usam o rótulo como valor', () => {
    expect(CARGOS_ADMIN_OPCOES.every(o => o.value === o.label)).toBeTrue();
  });

  it('cargo fora da lista volta vazio', () => {
    expect(cargoDaLista('GERENTE')).toBe('');
    expect(cargoDaLista('Gestor')).toBe('');
    expect(cargoDaLista(null)).toBe('');
    expect(cargoDaLista('Gerente')).toBe('Gerente');
  });
});
