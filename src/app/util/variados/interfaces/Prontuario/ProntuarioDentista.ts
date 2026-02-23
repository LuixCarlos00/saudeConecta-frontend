/**
 * Representa um dente no odontograma do componente Angular.
 */
export interface Dente {
  numero: number;
  status: DenteStatus;
  observacao?: string;
}

export type DenteStatus =
  | 'sadio'
  | 'cariado'
  | 'obturado'
  | 'ausente'
  | 'protese'
  | 'canal'
  | 'fratura'
  | 'implante';

export interface DenteStatusOption {
  value: DenteStatus;
  label: string;
  color: string;
  colorFill: string;
  colorRoot: string;
  icon: string;
}

export const DENTE_STATUS_OPTIONS: DenteStatusOption[] = [
  { value: 'sadio', label: 'Sadio', color: '#10b981', colorFill: '#d1fae5', colorRoot: '#a7f3d0', icon: 'fa-check' },
  { value: 'cariado', label: 'Cariado', color: '#ef4444', colorFill: '#fee2e2', colorRoot: '#fecaca', icon: 'fa-skull-crossbones' },
  { value: 'obturado', label: 'Obturado', color: '#3b82f6', colorFill: '#dbeafe', colorRoot: '#bfdbfe', icon: 'fa-circle-dot' },
  { value: 'ausente', label: 'Ausente', color: '#6b7280', colorFill: '#f3f4f6', colorRoot: '#e5e7eb', icon: 'fa-xmark' },
  { value: 'protese', label: 'Prótese', color: '#8b5cf6', colorFill: '#ede9fe', colorRoot: '#ddd6fe', icon: 'fa-crown' },
  { value: 'canal', label: 'Canal', color: '#f59e0b', colorFill: '#fef3c7', colorRoot: '#fde68a', icon: 'fa-arrow-down-up-across-line' },
  { value: 'fratura', label: 'Fratura', color: '#dc2626', colorFill: '#fef2f2', colorRoot: '#fecaca', icon: 'fa-bolt' },
  { value: 'implante', label: 'Implante', color: '#06b6d4', colorFill: '#cffafe', colorRoot: '#a5f3fc', icon: 'fa-screwdriver' },
];

export function getStatusOption(status: DenteStatus): DenteStatusOption {
  return DENTE_STATUS_OPTIONS.find(o => o.value === status) ?? DENTE_STATUS_OPTIONS[0];
}

// ─── DTO enviado ao backend ───────────────────────────────────────────────────

/** Um dente serializado para o payload — espelha DenteRequest.java */
export interface DentePayload {
  numeroFdi: number;
  status: DenteStatus;
  observacao?: string;
}

/**
 * Payload completo enviado ao POST /prontuario-dentista.
 * Espelha CadastrarProntuarioDentistaRequest.java (v2).
 */
export interface ProntuarioDentistaRequest {
  // anamnese
  queixaPrincipal?: string;
  anamnese?: string;
  observacao?: string;

  // exame clínico — campos separados
  higieneBucal?: string;
  condicaoGengival?: string;
  oclusal?: string;
  atm?: string;

  // odontograma estruturado
  odontograma: DentePayload[];

  // diagnóstico
  diagnostico?: string;
  planoTratamento?: string;

  // prescrição
  prescricao?: string;
  tituloPrescricao?: string;
  dataPrescricao?: string;

  // procedimentos
  procedimentos?: string;
  orientacoes?: string;
  tituloExame?: string;
  dataExame?: string;

  // controle
  dataFinalizado?: string;
  tempoDuracao?: string;

  // relacionamentos
  codigoMedico?: number;
  consulta?: number;
}
