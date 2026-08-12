import { TipoDocumento } from 'src/app/util/variados/interfaces/relatorio/relatorio-paciente';

/** Metadados de apresentacao de cada tipo de documento. */
export interface MetaDocumento {
  icone: string;
  cor: string;
  rotulo: string;
}

/**
 * Aparencia dos cards de documento na tela de relatorios.
 * Os codigos correspondem ao enum TipoDocumentoRelatorio do backend.
 */
export const META_DOCUMENTOS: Record<TipoDocumento, MetaDocumento> = {
  REGISTRO_CONSULTA:     { icone: 'fa-solid fa-notes-medical',       cor: '#64748b', rotulo: 'Registro' },
  PRESCRICAO:            { icone: 'fa-solid fa-prescription',        cor: '#10b981', rotulo: 'Prescrição' },
  EXAMES:                { icone: 'fa-solid fa-flask',               cor: '#3b82f6', rotulo: 'Exames' },
  PLANEJAMENTO:          { icone: 'fa-solid fa-list-check',          cor: '#d946ef', rotulo: 'Planejamento' },
  QUESTIONARIO_SAUDE:    { icone: 'fa-solid fa-clipboard-question',  cor: '#0ea5e9', rotulo: 'Questionário' },
  COMPROVANTE_PAGAMENTO: { icone: 'fa-solid fa-file-invoice-dollar', cor: '#14b8a6', rotulo: 'Comprovante' },
  ATESTADO:              { icone: 'fa-solid fa-file-signature',      cor: '#f59e0b', rotulo: 'Atestado' },
  HISTORICO_COMPLETO:    { icone: 'fa-solid fa-file-medical',        cor: '#8b5cf6', rotulo: 'Histórico' }
};

/** Metadados usado quando o backend enviar um tipo ainda nao mapeado. */
export const META_DOCUMENTO_PADRAO: MetaDocumento = {
  icone: 'fa-solid fa-file-lines',
  cor: '#64748b',
  rotulo: 'Documento'
};
