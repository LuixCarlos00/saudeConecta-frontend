/**
 * Interface ProntuarioCompletoResponse MEDICOS
 * Representa o prontuário médico completo retornado pelo backend
 * Mapeada diretamente do DTO ProntuarioCompletoResponse do backend
 */
export interface Prontuario {
  // =============================================================================
  // IDENTIFICAÇÃO
  // =============================================================================

  /** Código único do prontuário */
  codigoProntuario?: number;

  // =============================================================================
  // DADOS VITAIS E ANTROPOMÉTRICOS
  // =============================================================================

  /** Peso do paciente (ex: "70.5") */
  peso?: string;

  /** Altura do paciente (ex: "1.75") */
  altura?: string;

  /** Temperatura corporal (ex: "36.5") */
  temperatura?: string;

  /** Saturação de oxigênio (ex: "98") */
  saturacao?: string;

  /** Pressão arterial (ex: "120/80") */
  pressao?: string;

  /** Frequência respiratória (ex: "16") */
  frequenciaRespiratoria?: string;

  /** Pressão arterial sistólica (ex: "120") */
  frequenciaArterialSistolica?: string;

  /** Pressão arterial diastólica (ex: "80") */
  frequenciaArterialDiastolica?: string;

  /** Hemoglobina (ex: "14.5") */
  hemoglobina?: string;

  // =============================================================================
  // DADOS DEMOGRÁFICOS DO PACIENTE
  // =============================================================================

  /** Data de nascimento do paciente */
  dataNascimento?: string;

  /** Sexo do paciente (ex: "M", "F") */
  sexo?: string;

  // =============================================================================
  // ANAMNESE E AVALIAÇÃO CLÍNICA
  // =============================================================================

  /** Queixa principal do paciente */
  queixaPrincipal?: string;

  /** Anamnese completa - histórico do paciente */
  anamnese?: string;

  /** Conduta médica adotada */
  conduta?: string;

  /** Observações gerais */
  observacao?: string;

  /** Diagnóstico(s) - códigos CID-10 e descrições */
  diagnostico?: string;

  // =============================================================================
  // PRESCRIÇÃO MÉDICA
  // =============================================================================

  /** Modelo/template da prescrição */
  modeloPrescricao?: string;

  /** Título da prescrição */
  tituloPrescricao?: string;

  /** Data da prescrição */
  dataPrescricao?: string;

  /** Conteúdo completo da prescrição */
  prescricao?: string;

  // =============================================================================
  // SOLICITAÇÃO DE EXAMES
  // =============================================================================

  /** Modelo/template da solicitação de exames */
  modeloExame?: string;

  /** Título da solicitação de exames */
  tituloExame?: string;

  /** Data da solicitação de exames */
  dataExame?: string;

  /** Conteúdo completo da solicitação de exames */
  exame?: string;

  /** Tempo de duração da consulta */
  tempoDuracao?: string;

  // =============================================================================
  // CONTROLE E FINALIZAÇÃO
  // =============================================================================

  /** Data de finalização do prontuário (format: yyyy-MM-dd) */
  dataFinalizado?: string;

  // =============================================================================
  // RELACIONAMENTOS (DTOs para evitar lazy loading)
  // =============================================================================

  /** Informações do profissional responsável */
  profissional?: ProfissionalResponse;

  /** Informações da consulta associada */
  consulta?: ConsultaResponse;
}

/**
 * DTO para informações do Profissional
 * Mapeada diretamente do ProfissionalResponse do backend
 */
export interface ProfissionalResponse {
  /** ID do profissional */
  id?: number;

  /** Nome do profissional */
  nome?: string;

  /** Número do conselho/CRM */
  conselho?: string;

  /** Email do profissional */
  email?: string;

  /** Telefone do profissional */
  telefone?: string;
}

/**
 * DTO para informações do Paciente
 * Mapeada diretamente do PacienteResponse do backend
 */
export interface PacienteResponse {
  /** ID do paciente */
  id?: number;

  /** Nome do paciente */
  nome?: string;

  /** CPF do paciente */
  cpf?: string;

  /** Email do paciente */
  email?: string;

  /** Telefone do paciente */
  telefone?: string;

  /** Sexo do paciente */
  sexo?: string;

  /** Data de nascimento do paciente */
  dataNascimento?: string;
}

/**
 * DTO para informações da Consulta
 * Mapeada diretamente do ConsultaResponse do backend
 */
export interface ConsultaResponse {
  /** ID da consulta */
  id?: number;

  /** Nome do paciente */
  pacienteNome?: string;

  /** CPF do paciente */
  pacienteCpf?: string;

  /** Data e hora da consulta (format: LocalDateTime.toString()) */
  dataHora?: string;

  /** Status da consulta (ex: "REALIZADA", "AGENDADA") */
  status?: string;

  /** Observações da consulta */
  observacoes?: string;

  /** Valor da consulta */
  valor?: number;

  /** Nome da forma de pagamento */
  formaPagamentoNome?: string;

  /** Dados completos do paciente */
  paciente?: PacienteResponse;
}
