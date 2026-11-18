/**
 * Lista única de cargos do administrador da clínica.
 * Espelha `CargoAdmin.VALORES` do back: o valor salvo é o próprio rótulo, e o back recusa
 * qualquer outro (400). Antes cada tela tinha a sua lista e o cargo salvo numa não aparecia na outra.
 */
export const CARGOS_ADMIN = ['Responsável', 'Diretor(a)', 'Gerente', 'Administrador(a)', 'Coordenador(a)'] as const;

/** Um cargo válido. */
export type CargoAdmin = typeof CARGOS_ADMIN[number];

/** Opções no formato { value, label } usado pelos selects das telas. */
export const CARGOS_ADMIN_OPCOES: ReadonlyArray<{ value: CargoAdmin; label: CargoAdmin }> =
  CARGOS_ADMIN.map(c => ({ value: c, label: c }));

/** Cargo de quem cria a conta pela página pública (o dono da clínica). */
export const CARGO_PADRAO_DONO: CargoAdmin = 'Responsável';

/**
 * Cargo salvo, ou vazio se ele não estiver na lista (registro antigo ainda não convertido).
 * Vazio força o usuário a escolher de novo em vez de mandar um valor que o back recusa.
 *
 * @param valor cargo vindo do back
 * @returns cargo da lista ou ''
 */
export function cargoDaLista(valor: string | null | undefined): CargoAdmin | '' {
  return (CARGOS_ADMIN as readonly string[]).includes(valor ?? '') ? valor as CargoAdmin : '';
}
