import { Address } from './address.model';

/**
 * Interface para médico
 */
export interface Doctor {
  id: number;
  name: string;
  gender: number;
  birthDate: string;
  crm: string;
  cpf: string;
  rg: string;
  specialty: string;
  email: string;
  phone: string;
  consultationTime?: number;
  addressId?: number;
  userId?: number;
  address?: Address;
}

/**
 * DTO para criação de médico
 */
export interface CreateDoctorDto {
  MedNome: string;
  MedSexo: number;
  MedDataNacimento: string;
  MedCrm: string;
  MedCpf: string;
  MedRg: string;
  MedEspecialidade: string;
  MedEmail: string;
  MedTelefone: string;
  endereco: number;
  usuario: number;
}

/**
 * Resposta da API de médico (formato atual do backend)
 */
export interface DoctorApiResponse {
  MedCodigo?: number;
  MedNome?: string;
  MedSexo?: number;
  MedDataNacimento?: string;
  MedCrm?: string;
  MedCpf?: string;
  MedRg?: string;
  MedEspecialidade?: string;
  MedEmail?: string;
  MedTelefone?: string;
  MedTempoDeConsulta?: string | number;
  endereco?: number;
  usuario?: number;
  // Formato alternativo (camelCase)
  medCodigo?: number;
  medNome?: string;
  medSexo?: number;
  medDataNacimento?: string;
  medCrm?: string;
  medCpf?: string;
  medRg?: string;
  medEspecialidade?: string;
  medEmail?: string;
  medTelefone?: string;
  medTempoDeConsulta?: number;
}

/**
 * Mapper para converter resposta da API para modelo padronizado
 */
export function mapDoctorFromApi(response: DoctorApiResponse): Doctor {
  return {
    id: response.MedCodigo ?? response.medCodigo ?? 0,
    name: response.MedNome ?? response.medNome ?? '',
    gender: response.MedSexo ?? response.medSexo ?? 1,
    birthDate: response.MedDataNacimento ?? response.medDataNacimento ?? '',
    crm: response.MedCrm ?? response.medCrm ?? '',
    cpf: response.MedCpf ?? response.medCpf ?? '',
    rg: response.MedRg ?? response.medRg ?? '',
    specialty: response.MedEspecialidade ?? response.medEspecialidade ?? '',
    email: response.MedEmail ?? response.medEmail ?? '',
    phone: response.MedTelefone ?? response.medTelefone ?? '',
    consultationTime: typeof response.MedTempoDeConsulta === 'number' 
      ? response.MedTempoDeConsulta 
      : response.medTempoDeConsulta,
    addressId: response.endereco,
    userId: response.usuario
  };
}
