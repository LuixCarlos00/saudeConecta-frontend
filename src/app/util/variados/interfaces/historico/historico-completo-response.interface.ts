export interface HistoricoCompletoResponse {
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
  
  // Dados do Prontuário (se existir)
  prontuarioId?: number;
  
  // Dados Vitais e Antropométricos
  peso?: string;
  altura?: string;
  temperatura?: string;
  saturacao?: string;
  pressao?: string;
  frequenciaRespiratoria?: string;
  frequenciaArterialSistolica?: string;
  frequenciaArterialDiastolica?: string;
  hemoglobina?: string;
  
  // Dados Demográficos
  dataNascimento?: string;
  sexo?: string;
  
  // Anamnese e Avaliação
  queixaPrincipal?: string;
  anamnese?: string;
  conduta?: string;
  observacao?: string;
  diagnostico?: string;
  
  // Prescrição Médica
  modeloPrescricao?: string;
  tituloPrescricao?: string;
  dataPrescricao?: string;
  prescricao?: string;
  
  // Exames
  modeloExame?: string;
  tituloExame?: string;
  dataExame?: string;
  exame?: string;
  tempoDuracao?: string;
  
  // Dados de Controle
  dataFinalizado?: string;
  codigoProntuario?: string;
}
