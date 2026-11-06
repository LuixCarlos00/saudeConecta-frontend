export interface HistoricoDadosPessoais {
  id: number;
  organizacaoId: number;
  entidade: 'PACIENTE' | 'PROFISSIONAL' | 'ADMIN' | 'SECRETARIA' | 'ORGANIZACAO' | 'ENDERECO';
  idEntidade: number;
  campo: string;
  valorAnterior: string | null;
  valorNovo: string | null;
  criadoEm: string;
}
