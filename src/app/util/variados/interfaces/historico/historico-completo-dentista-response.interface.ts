export interface DenteResponse {
  codigo: number;
  numeroFdi: number;
  status: string;
  observacao?: string;
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

  // Anamnese e Avaliação Odontológica
  queixaPrincipal?: string;
  anamnese?: string;
  observacao?: string;
  diagnostico?: string;

  // Exame Clínico Bucal
  higieneBucal?: string;
  condicaoGengival?: string;
  oclusal?: string;
  atm?: string;

  // Plano de Tratamento
  planoTratamento?: string;
  procedimentos?: string;
  orientacoes?: string;

  // Prescrição
  tituloPrescricao?: string;
  dataPrescricao?: string;
  prescricao?: string;

  // Exames
  tituloExame?: string;
  dataExame?: string;

  // Controle
  tempoDuracao?: string;
  dataFinalizado?: string;

  // Odontograma — dentes
  dentes?: DenteResponse[];
}
