/**
 * Interface para configuração de campos do PDF dinâmico
 * Define quais campos são obrigatórios e quais são opcionais
 */

export interface CampoPDF {
  id: string;
  label: string;
  categoria: 'profissional' | 'paciente' | 'consulta' | 'outros';
  obrigatorio: boolean;
  selecionado: boolean;
  disponivel?: boolean;
}

export interface ConfiguracaoPDF {
  profissional: CampoPDF[];
  paciente: CampoPDF[];
  consulta: CampoPDF[];
  outros: CampoPDF[];
}

/**
 * Configuração padrão dos campos do PDF
 * Campos obrigatórios não podem ser desmarcados
 * Baseado na estrutura real dos dados retornados pela API
 */
export const CAMPOS_PDF_PADRAO: ConfiguracaoPDF = {
  profissional: [
    // Obrigatórios
    { id: 'nome', label: 'Nome', categoria: 'profissional', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'registroConselho', label: 'CRM', categoria: 'profissional', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'especialidades', label: 'Especialidade', categoria: 'profissional', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'tipoProfissional', label: 'Tipo', categoria: 'profissional', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'cpf', label: 'CPF', categoria: 'profissional', obrigatorio: true, selecionado: true, disponivel: true },

    // Opcionais
    { id: 'enderecoCompleto', label: 'Endereço Completo', categoria: 'profissional', obrigatorio: false, selecionado: false, disponivel: true },
  ],

  paciente: [
    // Obrigatórios
    { id: 'nome', label: 'Nome', categoria: 'paciente', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'cpf', label: 'CPF', categoria: 'paciente', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'sexo', label: 'Sexo', categoria: 'paciente', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'email', label: 'E-mail', categoria: 'paciente', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'telefone', label: 'Telefone', categoria: 'paciente', obrigatorio: true, selecionado: true, disponivel: true },

    // Opcionais
    { id: 'enderecoCompleto', label: 'Endereço Completo', categoria: 'paciente', obrigatorio: false, selecionado: false, disponivel: true },
    { id: 'status', label: 'Status', categoria: 'paciente', obrigatorio: false, selecionado: false, disponivel: true },
  ],

  consulta: [
    // Obrigatórios
    { id: 'diaSemana', label: 'Dia da Semana', categoria: 'consulta', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'dataHora', label: 'Data e Hora', categoria: 'consulta', obrigatorio: true, selecionado: true, disponivel: true },
    { id: 'status', label: 'Status', categoria: 'consulta', obrigatorio: true, selecionado: true, disponivel: true },

    // Opcionais
    { id: 'observacoes', label: 'Observações', categoria: 'consulta', obrigatorio: false, selecionado: false, disponivel: true },
    { id: 'valor', label: 'Valor', categoria: 'consulta', obrigatorio: false, selecionado: false, disponivel: true },
    { id: 'formaPagamentoNome', label: 'Forma de Pagamento', categoria: 'consulta', obrigatorio: false, selecionado: false, disponivel: true },
  ],

  outros: [
    { id: 'calendario', label: 'Calendário', categoria: 'outros', obrigatorio: false, selecionado: true, disponivel: true },
  ]
};
