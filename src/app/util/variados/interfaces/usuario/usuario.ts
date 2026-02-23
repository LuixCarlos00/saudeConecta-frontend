export interface Usuario {
  id: number;
  login?: string;
  status?: number;
  tipoUsuario?: number;
  nome?: string;
  perfil?: string;

  // Propriedades JWT (quando usado como token)
  aud?: string;
  exp?: string;
  iss?: string;
  sub?: string;
}


