import { Address } from './address.model';

/**
 * Interface para paciente
 */
export interface Patient {
  id: number;
  name: string;
  gender: Gender;
  birthDate: string;
  cpf: string;
  rg: string;
  email: string;
  phone: string;
  addressId: number;
  status: PatientStatus;
  address?: Address;
}

/**
 * Gênero
 */
export enum Gender {
  MALE = 1,
  FEMALE = 2
}

/**
 * Status do paciente
 */
export enum PatientStatus {
  ACTIVE = 1,
  INACTIVE = 0
}

/**
 * DTO para criação de paciente
 */
export interface CreatePatientDto {
  PaciNome: string;
  PaciSexo: number;
  PaciDataNacimento: string;
  PaciCpf: string;
  PaciRg: string;
  PaciEmail: string;
  PaciTelefone: string;
  endereco: number;
  PaciStatus: number;
}

/**
 * Resposta da API de paciente (formato atual do backend)
 */
export interface PatientApiResponse {
  PaciCodigo?: number;
  PaciNome?: string;
  PaciSexo?: number;
  PaciDataNacimento?: string;
  PaciCpf?: string;
  PaciRg?: string;
  PaciEmail?: string;
  PaciTelefone?: string;
  endereco?: number;
  PaciStatus?: number;
  // Formato alternativo (camelCase)
  paciCodigo?: number;
  paciNome?: string;
  paciSexo?: number;
  paciDataNacimento?: string;
  paciCpf?: string;
  paciRg?: string;
  paciEmail?: string;
  paciTelefone?: string;
  paciStatus?: number;
}

/**
 * Mapper para converter resposta da API para modelo padronizado
 */
export function mapPatientFromApi(response: PatientApiResponse): Patient {
  return {
    id: response.PaciCodigo ?? response.paciCodigo ?? 0,
    name: response.PaciNome ?? response.paciNome ?? '',
    gender: (response.PaciSexo ?? response.paciSexo ?? Gender.MALE) as Gender,
    birthDate: response.PaciDataNacimento ?? response.paciDataNacimento ?? '',
    cpf: response.PaciCpf ?? response.paciCpf ?? '',
    rg: response.PaciRg ?? response.paciRg ?? '',
    email: response.PaciEmail ?? response.paciEmail ?? '',
    phone: response.PaciTelefone ?? response.paciTelefone?.toString() ?? '',
    addressId: response.endereco ?? 0,
    status: (response.PaciStatus ?? response.paciStatus ?? PatientStatus.ACTIVE) as PatientStatus
  };
}
