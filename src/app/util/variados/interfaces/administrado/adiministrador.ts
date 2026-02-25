import { Usuario } from '../usuario/usuario';

export interface Adiministrador {
  // Propriedades PascalCase (legado)
  AdmCodigo?: number;
  AdmNome?: string;
  AdmUsuario?: number;
  AdmStatus?: number;
  AdmEmail?: string;
  AdmCodigoAtorizacao?: string;
  AdmDataCriacao?: string;

  // Propriedades camelCase (padrão do backend)
  admCodigo?: number;
  admNome?: string;
  admStatus?: number;
  admEmail?: string;
  admCodigoAtorizacao?: string;
  admDataCriacao?: string;
  admUsuario?: Usuario;
}


export interface Administrador {
  admCodigo?: number;
  admNome?: string;
  admCpf?: string;
  admRg?: string;
  admTelefone?: string;
  admEmail?: string;
  admDataNascimento?: string;
  admEndereco?: number;
  admUsuario?: number;
}
