import { Usuario } from '../usuario/usuario';

export interface Secretaria {
  // Propriedades PascalCase (legado)
  SecreCodigo?: number;
  SecreNome?: string;
  SecreEmail?: string;
  SecreUsuario?: number;
  SecreStatus?: number;
  SecreCodigoAtorizacao?: string;
  SecreDataCriacao?: string;

  // Propriedades camelCase (padrão do backend)
  secreCodigo?: number;
  secreNome?: string;
  secreEmail?: string;
  secreStatus?: number;
  secreCodigoAtorizacao?: string;
  secreDataCriacao?: string;
  secreUsuario?: Usuario;



  secCodigo?: number;
  secNome?: string;
  secCpf?: string;
  secRg?: string;
  secTelefone?: string;
  secEmail?: string;
  secDataNascimento?: string;
  secEndereco?: number;
  secUsuario?: number;
}
