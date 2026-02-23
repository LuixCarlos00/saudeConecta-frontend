import { Doctor } from './doctor.model';
import { Patient } from './patient.model';

/**
 * Interface para consulta/agendamento
 */
export interface Appointment {
  id: number;
  doctorId: number;
  patientId: number;
  dayOfWeek: string;
  time: string;
  date: string;
  observations: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  status: AppointmentStatus;
  adminId: number;
  doctor?: Doctor;
  patient?: Patient;
}

/**
 * Forma de pagamento
 */
export enum PaymentMethod {
  CASH = 1,
  CREDIT_CARD = 2,
  DEBIT_CARD = 3,
  PIX = 4,
  HEALTH_INSURANCE = 5
}

/**
 * Status da consulta
 */
export enum AppointmentStatus {
  SCHEDULED = 1,
  CONFIRMED = 2,
  IN_PROGRESS = 3,
  COMPLETED = 4,
  CANCELLED = 5
}

/**
 * DTO para criação de consulta
 */
export interface CreateAppointmentDto {
  ConMedico: number;
  ConPaciente: number;
  ConDia_semana: string;
  ConHorario: string;
  ConData: string;
  ConObservacoes: string;
  ConFormaPagamento: number;
  ConStatus: number;
  ConAdm: number;
}

/**
 * Resposta da API de consulta (formato atual do backend)
 */
export interface AppointmentApiResponse {
  ConCodigoConsulta?: number;
  ConMedico?: number | any;
  ConPaciente?: number | any;
  ConDia_semana?: string;
  ConHorario?: string;
  ConData?: string;
  ConObservacoes?: string;
  ConDataCriacao?: string;
  ConFormaPagamento?: number;
  ConStatus?: number;
  ConAdm?: number;
  // Formato alternativo (camelCase)
  conCodigoConsulta?: number;
  conMedico?: number | any;
  conPaciente?: number | any;
  conDia_semana?: string;
  conHorario?: string;
  conData?: string;
  conObservacoes?: string;
  conDataCriacao?: string;
  conFormaPagamento?: number;
  conStatus?: number;
  conAdm?: number;
}

/**
 * Interface para dados da tabela de consultas
 */
export interface AppointmentTableRow {
  consulta: number;
  medico: any;
  paciente: any;
  diaSemana: string;
  data: string;
  horario: string;
  observacao: string;
  dadaCriacao: string;
  status: number;
  adm: number;
  formaPagamento: number;
}

/**
 * Mapper para converter resposta da API para modelo padronizado
 */
export function mapAppointmentFromApi(response: AppointmentApiResponse): Appointment {
  return {
    id: response.ConCodigoConsulta ?? response.conCodigoConsulta ?? 0,
    doctorId: typeof response.ConMedico === 'number' ? response.ConMedico : (response.conMedico ?? 0),
    patientId: typeof response.ConPaciente === 'number' ? response.ConPaciente : (response.conPaciente ?? 0),
    dayOfWeek: response.ConDia_semana ?? response.conDia_semana ?? '',
    time: response.ConHorario ?? response.conHorario ?? '',
    date: response.ConData ?? response.conData ?? '',
    observations: response.ConObservacoes ?? response.conObservacoes ?? '',
    createdAt: response.ConDataCriacao ?? response.conDataCriacao ?? '',
    paymentMethod: (response.ConFormaPagamento ?? response.conFormaPagamento ?? PaymentMethod.CASH) as PaymentMethod,
    status: (response.ConStatus ?? response.conStatus ?? AppointmentStatus.SCHEDULED) as AppointmentStatus,
    adminId: response.ConAdm ?? response.conAdm ?? 0
  };
}

/**
 * Mapper para converter para linha da tabela
 */
export function mapAppointmentToTableRow(response: AppointmentApiResponse): AppointmentTableRow {
  return {
    consulta: response.ConCodigoConsulta ?? response.conCodigoConsulta ?? 0,
    medico: response.ConMedico ?? response.conMedico,
    paciente: response.ConPaciente ?? response.conPaciente,
    diaSemana: response.ConDia_semana ?? response.conDia_semana ?? '',
    data: response.ConData ?? response.conData ?? '',
    horario: response.ConHorario ?? response.conHorario ?? '',
    observacao: response.ConObservacoes ?? response.conObservacoes ?? '',
    dadaCriacao: response.ConDataCriacao ?? response.conDataCriacao ?? '',
    status: response.ConStatus ?? response.conStatus ?? 0,
    adm: response.ConAdm ?? response.conAdm ?? 0,
    formaPagamento: response.ConFormaPagamento ?? response.conFormaPagamento ?? 0
  };
}
