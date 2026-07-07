/**
 * Representa um item de dente do odontograma, retornado no histórico odontológico.
 */
export interface DenteResponse {
  codigo: number;
  numeroFdi: number;
  status: string;
  observacao?: string;
}

/**
 * Representa um planejamento terapêutico vinculado a uma consulta do histórico.
 */
export interface PlanejamentoResponse {
  id?: number;
  dataProcedimento?: string;
  procedimento?: string;
  procedimentoRealizado?: string;
  valor?: number;
  statusAssinatura?: string;
  assinaturaBase64?: string;
  dataAssinatura?: string;
  ipOrigem?: string;
}

/**
 * DTO unificado do histórico completo de consultas de um paciente.
 * Um mesmo item pode representar um registro médico ou odontológico,
 * discriminado pelo campo `tipoProntuario` ('MEDICO' | 'DENTISTA').
 *
 * Usado tanto no contexto do Administrador (histórico combinado médico + dentista)
 * quanto no contexto do Profissional (histórico restrito ao seu próprio tipo).
 */
export interface HistoricoCompletoPacienteResponse {
  // Discriminador
  tipoProntuario: 'MEDICO' | 'DENTISTA' | string;

  // Dados da Consulta
  consultaId: number;
  dataHora: string;
  duracaoMinutos: number;
  observacoes: string;
  valor: number;
  status: string;
  motivoCancelamento: string;

  // Dados do Paciente
  pacienteId: number;
  pacienteNome: string;
  pacienteCpf: string;
  pacienteDataNascimento: string;
  pacienteTelefone: string;

  // Dados do Profissional
  profissionalId: number;
  profissionalNome: string;
  profissionalEspecialidade: string;
  profissionalCrm: string;

  // Dados do Prontuário
  prontuarioId?: number;
  codigoProntuario?: string;

  // Sinais Vitais / Antropométricos
  peso?: string;
  altura?: string;
  temperatura?: string;
  pressao?: string;
  pulso?: string;
  saturacao?: string;
  frequenciaRespiratoria?: string;
  frequenciaArterialSistolica?: string;
  frequenciaArterialDiastolica?: string;
  hemoglobina?: string;
  sexo?: string;

  // Anamnese e Avaliação
  queixaPrincipal?: string;
  anamnese?: string;
  observacao?: string;
  diagnostico?: string;
  conduta?: string;
  cidTexto?: string;

  // Exame Extra-Oral (odontológico)
  facies?: string;
  linfonodos?: string;
  atm?: string;
  edema?: string;

  // Exame Intra-Oral (odontológico)
  labios?: string;
  lingua?: string;
  gengiva?: string;
  mucosas?: string;
  palato?: string;
  orofaringe?: string;
  soalhoBucal?: string;

  // Condições Bucais (odontológico)
  higieneBucal?: string;
  condicaoGengival?: string;
  oclusal?: string;
  portadorAparelho?: string;
  habitosNocivos?: string;

  // Tratamento
  planoTratamento?: string;
  procedimentos?: string;
  orientacoes?: string;
  responsavel?: string;

  // Prescrição
  tituloPrescricao?: string;
  dataPrescricao?: string;
  prescricao?: string;
  modeloPrescricao?: string;

  // Exames (médico)
  modeloExame?: string;
  tituloExame?: string;
  dataExame?: string;
  exame?: string;

  // Solicitações de Exames (odontológico)
  solicitacaoExameTexto?: string;
  tussTexto?: string;
  exameOutros?: string;

  // Controle
  tempoDuracao?: string;
  dataFinalizado?: string;
  dataFinalizadoDentista?: string;

  // Odontograma
  dentes?: DenteResponse[];

  // Planejamentos
  planejamentos?: PlanejamentoResponse[];
}
