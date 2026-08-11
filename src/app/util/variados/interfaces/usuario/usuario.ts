export interface Usuario {
  id: number;
  login?: string;
  status?: number;
  tipoUsuarioNovo?: string;
  nome?: string;
  perfil?: string;
  tipoProfissional?: string;

  // Propriedades JWT (quando usado como token)
  aud?: string;
  exp?: string;
  iss?: string;
  sub?: string;
}


