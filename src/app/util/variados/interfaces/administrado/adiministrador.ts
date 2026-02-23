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
