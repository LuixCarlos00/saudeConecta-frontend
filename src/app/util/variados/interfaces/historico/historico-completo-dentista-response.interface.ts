export interface DenteResponse {
  codigo: number;
  numeroFdi: number;
  status: string;
  observacao?: string;
}

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

export interface HistoricoCompletoDentistaResponse {
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

  // Dados do Prontuário Odontológico
  prontuarioId?: number;
  codigoProntuario?: string;
  tipoProntuario?: string;

  // Sinais Vitais
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

  // Anamnese e Avaliação Odontológica
  queixaPrincipal?: string;
  anamnese?: string;
  observacao?: string;
  diagnostico?: string;
  conduta?: string;
  cidTexto?: string;

  // Exame Extra-Oral
  facies?: string;
  linfonodos?: string;
  atm?: string;
  edema?: string;

  // Exame Intra-Oral
  labios?: string;
  lingua?: string;
  gengiva?: string;
  mucosas?: string;
  palato?: string;
  orofaringe?: string;
  soalhoBucal?: string;

  // Condições Bucais
  higieneBucal?: string;
  condicaoGengival?: string;
  oclusal?: string;
  portadorAparelho?: string;
  habitosNocivos?: string;

  // Tratamento
  planoTratamento?: string;
  procedimentos?: string;
  orientacoes?: string;
  inicioTratamento?: string;
  terminoTratamento?: string;
  responsavel?: string;
  interrupcao?: string;

  // Prescrição
  tituloPrescricao?: string;
  dataPrescricao?: string;
  prescricao?: string;
  modeloPrescricao?: string;

  // Solicitações de Exames
  solicitacaoExameTexto?: string;
  tussTexto?: string;
  exameOutros?: string;
  tituloExame?: string;
  dataExame?: string;
  modeloExame?: string;

  // Controle
  tempoDuracao?: string;
  dataFinalizado?: string;
  dataFinalizadoDentista?: string;

  // Odontograma
  dentes?: DenteResponse[];

  // Planejamentos
  planejamentos?: PlanejamentoResponse[];
}
