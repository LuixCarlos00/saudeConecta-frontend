/** Tipos de documento derivados dos atendimentos, espelham o enum TipoDocumentoRelatorio do backend. */
export type TipoDocumento =
  | 'REGISTRO_CONSULTA'
  | 'PRESCRICAO'
  | 'EXAMES'
  | 'PLANEJAMENTO'
  | 'QUESTIONARIO_SAUDE'
  | 'COMPROVANTE_PAGAMENTO'
  | 'ATESTADO'
  | 'HISTORICO_COMPLETO';

/** Documento disponivel para visualizacao ou impressao. */
export interface DocumentoRelatorio {
  id: number;
  tipo: TipoDocumento;
  titulo: string;
  descricao: string;
  emitidoEm: string;
  assinado: boolean;
  consultaId: number;
}

/** Consulta atendida com os documentos gerados nela. */
export interface ConsultaRelatorio {
  id: number;
  dataHora: string;
  status: 'REALIZADA' | 'PAGO' | 'AGENDADA' | 'CONFIRMADA' | 'CANCELADA';
  especialidadeNome: string | null;
  profissionalId: number | null;
  profissionalNome: string | null;
  /** Codigo do tipo de profissional: 'MEDICO' ou 'DENTISTA'. */
  tipoProfissionalNome: string | null;
  diagnostico: string | null;
  documentos: DocumentoRelatorio[];
}

/** Paciente atendido, com o resumo do historico e os relatorios disponiveis. */
export interface PacienteAtendido {
  id: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  profissionalId: number | null;
  profissionalNome: string | null;
  ultimoAtendimento: string;
  totalConsultas: number;
  totalDocumentos: number;
  consultas: ConsultaRelatorio[];
}

/** Tipo de documento retornado pelo backend para montagem dos filtros. */
export interface TipoDocumentoOpcao {
  codigo: TipoDocumento;
  rotulo: string;
  descricao: string;
}

/** Filtros aceitos na busca de pacientes atendidos. */
export interface FiltroRelatorio {
  profissionalId?: number | null;
  termo?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}
