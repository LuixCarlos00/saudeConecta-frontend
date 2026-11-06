/**
 * Linha da tabela "todos os usuários": reúne administradores, profissionais, secretárias e
 * pacientes num formato único para listar, filtrar e abrir a visualização/edição.
 * Fica em models/ (e não no componente da tabela) para a tabela e o diálogo de
 * visualização/edição não dependerem um do outro.
 */
export interface UsuarioUnificado {
  codigo: number;
  nome: string;
  email: string;
  categoria: string;
  categoriaIcon: string;
  status: boolean;
  dadosOriginais: any;
  nomeOrganizacao?: string;
  nomePlano?: string;
}
