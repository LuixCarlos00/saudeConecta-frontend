/** Tipo de atendimento a que o rascunho pertence. */
export type TipoRascunho = 'MEDICO' | 'DENTISTA';

/**
 * Conteúdo do rascunho: o que cada aba devolve em getDados()/getDadosRascunho().
 * O back guarda como JSON opaco; o formato é definido pelo front.
 */
export interface DadosRascunho {
  identificacao: any;
  exame: any;
  planejamento: any;
  codigos: any;
}

/** Corpo do PUT /atendimentos/{consultaId}/rascunho. */
export interface RascunhoAtendimentoRequest {
  tipo: TipoRascunho;
  dados: DadosRascunho;
  tempoAcumuladoSegundos: number;
  /** Versão recebida por último; null na primeira gravação. */
  versao: number | null;
}

/** Resposta do GET/PUT do rascunho. */
export interface RascunhoAtendimentoResponse {
  consultaId: number;
  tipo: TipoRascunho;
  dados: DadosRascunho;
  tempoAcumuladoSegundos: number;
  versao: number;
  atualizadoEm: string;
}

/** Item de GET /atendimentos/rascunhos/meus (usado pela agenda). */
export interface RascunhoResumo {
  consultaId: number;
  atualizadoEm: string;
  tempoAcumuladoSegundos: number;
}
