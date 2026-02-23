/**
 * Interface para endereço
 */
export interface Address {
  id: number;
  nationality: string;
  state: string;
  city: string;
  neighborhood: string;
  zipCode: string;
  street: string;
  number: number;
  complement?: string | number;
}

/**
 * DTO para criação de endereço
 */
export interface CreateAddressDto {
  EndNacionalidade: string;
  EndUF: string;
  EndMunicipio: string;
  EndBairro: string;
  EndCep: string;
  EndRua: string;
  EndNumero: number;
  EndComplemento?: number | string;
}

/**
 * Resposta da API de endereço (formato atual do backend)
 */
export interface AddressApiResponse {
  EndCodigo?: number;
  EndNacionalidade?: string;
  EndUF?: string;
  EndMunicipio?: string;
  EndBairro?: string;
  EndCep?: string;
  EndRua?: string;
  EndNumero?: number;
  EndComplemento?: number | string;
}

/**
 * Mapper para converter resposta da API para modelo padronizado
 */
export function mapAddressFromApi(response: AddressApiResponse): Address {
  return {
    id: response.EndCodigo ?? 0,
    nationality: response.EndNacionalidade ?? '',
    state: response.EndUF ?? '',
    city: response.EndMunicipio ?? '',
    neighborhood: response.EndBairro ?? '',
    zipCode: response.EndCep ?? '',
    street: response.EndRua ?? '',
    number: response.EndNumero ?? 0,
    complement: response.EndComplemento
  };
}

/**
 * Mapper para converter modelo para DTO de criação
 */
export function mapAddressToCreateDto(address: Partial<Address>): CreateAddressDto {
  return {
    EndNacionalidade: address.nationality ?? '',
    EndUF: address.state ?? '',
    EndMunicipio: address.city ?? '',
    EndBairro: address.neighborhood ?? '',
    EndCep: address.zipCode ?? '',
    EndRua: address.street ?? '',
    EndNumero: address.number ?? 0,
    EndComplemento: address.complement
  };
}
