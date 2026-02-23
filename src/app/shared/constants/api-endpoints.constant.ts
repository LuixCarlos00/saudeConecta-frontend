/**
 * Constantes de endpoints da API
 * Centraliza todos os endpoints para facilitar manutenção
 */

export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/Home/login',
    REGISTER: '/Home/cadastralogin',
    CHECK_USER: '/Home/buscarUsuarioExistente',
    BLOCK_USER: '/Home/bloquearUsuario/usuario',
    BLOCK_PATIENT: '/Home/bloquearPaciente/usuario',
    DELETE_USER: '/Home/deletarPorId',
    GET_ALL_USERS: '/Home/BuscarTodosUsuarios'
  },

  // Pacientes
  PATIENT: {
    BASE: '/paciente',
    CREATE: '/paciente/post',
    LIST_ALL: '/paciente/listatodospaciente',
    GET_BY_ID: '/paciente/buscarId',
    SEARCH_BY_NAME: '/paciente/buscarPorNome',
    SEARCH_BY_CPF: '/paciente/buscarPorCPF',
    SEARCH_BY_RG: '/paciente/buscarPorRG',
    SEARCH_BY_PHONE: '/paciente/buscarPorTelefone'
  },

  // Médicos
  DOCTOR: {
    BASE: '/medico',
    CREATE: '/medico/post',
    LIST_ALL: '/medico/listatodosmedicos',
    SEARCH_BY_NAME: '/medico/buscarPorNome',
    SEARCH_BY_CRM: '/medico/buscarPorCRM',
    SEARCH_BY_CITY: '/medico/buscarPorCidade',
    SEARCH_BY_SPECIALTY: '/medico/buscarPorMedEspecialidade'
  },

  // Consultas
  APPOINTMENT: {
    BASE: '/consulta',
    CREATE: '/consulta',
    LIST_ALL: '/consulta',
    DELETE: '/consulta',
    UPDATE: '/consulta',
    COMPLETE: '/consulta',
    CHECK_AVAILABILITY: '/consulta/horarios-ocupados',
    SEND_MESSAGE: '/consulta/enviar-mensagem',
    VERIFY_AVAILABILITY: '/consulta/verificar-disponibilidade',
    DOCTOR_AGENDA: '/consulta/agenda-medico',
    ALL_DOCTORS_AGENDA: '/consulta/agenda-todos-medicos',
    DOCTOR_HISTORY: '/consulta/historico-medico',
    STATISTICS: '/consulta/estatisticas'
  },

  // Endereço
  ADDRESS: {
    CREATE: '/endereco/post'
  },

  // Prontuário
  MEDICAL_RECORD: {
    BASE: '/prontuario',
    CREATE: '/prontuario/post'
  }
} as const;

/**
 * Tipo para garantir type-safety nos endpoints
 */
export type ApiEndpoint = typeof API_ENDPOINTS;
