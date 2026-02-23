import { Time } from '@angular/common';

export interface Consulta {
  ConCodigoConsulta: number;
  ConMedico: number;
  ConPaciente: number;
  ConDia_semana: string;
  ConHorario: string;
  ConData: string;
  ConObservacoes: string;
  ConDadaCriacao: string;
  ConFormaPagamento: number;
  ConStatus: string;
  ConAdm: number;

  conCodigoConsulta?: number;
  conMedico?: number;
  conPaciente?: number;
  conDia_semana?: string;
  conHorario?: string;
  conData?: string;
  conObservacoes?: string;
  conDadaCriacao?: string;
  conFormaPagamento?: number;
  conStatus?: String;
  conAdm?: number;
}
