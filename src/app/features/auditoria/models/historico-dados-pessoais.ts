/** Tipo de cadastro que teve campo alterado (enum EntidadeTipo do back). */
export type EntidadeHistorico = 'PACIENTE' | 'PROFISSIONAL' | 'ADMIN' | 'SECRETARIA' | 'ORGANIZACAO' | 'ENDERECO';

/** Linha da auditoria (HistoricoAlteracaoResponse do back): um campo alterado. */
export interface HistoricoDadosPessoais {
  id: number;
  criadoEm: string;
  organizacaoId: number;
  organizacaoNome: string | null;
  usuarioId: number | null;
  /** Login (CPF/CNPJ) de quem alterou. */
  usuarioLogin: string | null;
  /** Nome do cadastro de quem alterou; null para quem não tem cadastro de perfil (ex.: ROOT). */
  usuarioNome: string | null;
  /** Administrador, Profissional, Secretária ou Super admin. */
  usuarioPerfil: string | null;
  entidade: EntidadeHistorico;
  idEntidade: number;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
}

/** Filtros da tela; todos opcionais. Datas em yyyy-MM-dd, ambas inclusivas. */
export interface FiltroHistorico {
  organizacaoId?: number | null;
  entidade?: EntidadeHistorico | '';
  de?: string;
  ate?: string;
  campo?: string;
  page?: number;
  size?: number;
}

/** Página do Spring Data (só os campos usados). */
export interface PaginaHistorico {
  content: HistoricoDadosPessoais[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
