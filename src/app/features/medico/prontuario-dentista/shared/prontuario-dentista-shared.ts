import { EventEmitter } from '@angular/core';
import { Consultav2 } from 'src/app/util/variados/interfaces/consulta/consultav2';
import {
  Dente,
  DenteStatus,
  DenteStatusOption,
} from 'src/app/util/variados/interfaces/Prontuario/ProntuarioDentista';

/**
 * Dados compartilhados entre as abas do prontuário dentista.
 * Cada sub-componente recebe via @Input() os dados que precisa.
 */
export interface DadosIdentificacao {
  responsavel: string;
  inicioTratamento: string;
  terminoTratamento: string;
  interrupcao: string;
  dadosPaciente: any;
  pacienteLoading: boolean;
}

export interface DadosExameObjetivo {
  // Anamnese
  QueixaPrincipal: string;
  HistoricoOdontologico: string;
  observacao: string;
  // Exame Clínico
  HigieneBucal: string;
  CondicaoGengival: string;
  Oclusal: string;
  ATM: string;
  // Sinais Vitais
  pressaoArterial: string;
  pulso: string;
  altura: string;
  temperatura: string;
  peso: string;
  // Exame Extrabucal
  edema: string;
  facies: string;
  linfonodos: string;
  // Exame Intrabucal
  labios: string;
  mucosas: string;
  soalhoBucal: string;
  palato: string;
  orofaringe: string;
  lingua: string;
  gengiva: string;
  habitosNocivos: string;
  portadorAparelho: string;
  exameOutros: string;
  // Diagnóstico
  Diagnostico: string;
  Prescricao: string;
  Orientacoes: string;
  // Odontograma
  odontograma: Dente[];
  selectedDente: Dente | null;
  hoveredDente: number | null;
  exameSubTab: number;
}

export interface DadosPlanejamento {
  procedimentosPadrao: any[];
  planejamentos: any[];
  novoPlanejamento: { procedimentoRealizado: string; valor: number; dataProcedimento: string };
  mostrarFormProcedimento: boolean;
  novoProcedimentoPadrao: { nomeProcedimento: string; valorPadrao: number };
}

export interface DadosCodigosTussCid {
  buscaTuss: string;
  buscaCid: string;
  tussResultados: any[];
  cidResultados: any[];
  tussSelecionados: any[];
  cidSelecionados: any[];
  textoTuss: string;
  textoCid: string;
  buscaTussExame: string;
  buscaCidExame: string;
  tussExameResultados: any[];
  cidExameResultados: any[];
  tussExameSelecionados: any[];
  cidExameSelecionados: any[];
  textoSolicitacaoExame: string;
  Prescricao: string;
}

export interface DadosQuestionario {
  questionarioRespondido: boolean;
  questionarioStatus: string;
  questionarioRespostas: any;
  questionarioAssinatura: string;
  questionarioDataAssinatura: string;
  questionarioPerguntas: { pergunta: string; resposta: string; observacao?: string }[];
}

export interface DadosHistorico {
  historicoProntuarios: any[];
  historicoCarregado: boolean;
  historicoLoading: boolean;
}
