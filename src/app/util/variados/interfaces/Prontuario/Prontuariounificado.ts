import { ConsultaResponse, ProfissionalResponse } from './Prontuario';
import { DentePayload } from './ProntuarioDentista';

// ─── Estrutura real que vem do backend do dentista ───────────────────────────

export interface DenteResponse {
  codigo?: number;
  numeroFdi?: number;
  status?: string;
  observacao?: string;
}

export interface ConsultaDentistaResponse {
  id?: number;
  dataHora?: string;
  status?: string;
  observacoes?: string;
  profissional?: any;
  especialidade?: any;
  paciente?: {
    id?: number;
    nome?: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    sexo?: string;
    dataNascimento?: string;
  };
  formaPagamento?: any;
}

export interface ProfissionalDentistaResponse {
  id?: number;
  nome?: string;
  email?: string;
  telefone?: string;
  sexo?: string;
  dataNascimento?: string;
  tipoProfissional?: any;
  especialidades?: any[];
  conselho?: string;
}

// ─── Interface unificada ──────────────────────────────────────────────────────

export interface ProntuarioUnificado {

  // ── Identificação ──────────────────────────────────────────────────────────
  codigoProntuario?: number;   // prontuário médico
  codigo?: number;             // prontuário dentista

  // ── Dados vitais (prontuário médico) ──────────────────────────────────────
  altura?: string;
  peso?: string;
  temperatura?: string;
  saturacao?: string;
  hemoglobina?: string;
  pressao?: string;
  frequenciaRespiratoria?: string;
  frequenciaArterialSistolica?: string;
  frequenciaArterialDiastolica?: string;
  sexo?: string;

  // ── Anamnese (ambos) ───────────────────────────────────────────────────────
  queixaPrincipal?: string;
  anamnese?: string;
  observacao?: string;

  // ── Clínico médico ─────────────────────────────────────────────────────────
  conduta?: string;
  diagnostico?: string;

  // ── Clínico odontológico ───────────────────────────────────────────────────
  higieneBucal?: string;
  condicaoGengival?: string;
  oclusal?: string;
  atm?: string;
  planoTratamento?: string;
  procedimentos?: string;
  orientacoes?: string;

  // ── Odontograma estruturado ────────────────────────────────────────────────
  dentes?: DenteResponse[];

  // ── Prescrição (ambos) ─────────────────────────────────────────────────────
  modeloPrescricao?: string;
  tituloPrescricao?: string;
  dataPrescricao?: string;
  prescricao?: string;

  // ── Exames / Procedimentos (ambos) ────────────────────────────────────────
  modeloExame?: string;
  tituloExame?: string;
  dataExame?: string;
  exame?: string;

  // ── Controle ──────────────────────────────────────────────────────────────
  dataFinalizado?: string;
  tempoDuracao?: string;

  // ── Relacionamentos ────────────────────────────────────────────────────────
  profissional?: ProfissionalDentistaResponse | ProfissionalResponse;
  consulta?: ConsultaDentistaResponse | ConsultaResponse;

  // ── Flag ───────────────────────────────────────────────────────────────────
  tipoProntuario: 'medico' | 'dentista' | 'ambos';
}
