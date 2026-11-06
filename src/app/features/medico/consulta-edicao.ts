/** Tipo de prontuário: define qual tela de edição abrir e qual endpoint chamar. */
export type TipoProntuario = 'MEDICO' | 'DENTISTA';

/** Dados mínimos da consulta que as telas de edição de prontuário precisam. */
export interface ConsultaEdicao {
  id: number;
  pacienteId: number;
  profissionalId: number;
  pacienteNome?: string;
}
