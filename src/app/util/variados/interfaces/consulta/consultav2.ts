export interface Consultav2 {
  id: number;
  profissionalId: number;
  /** Id do usuário do profissional, quando o back informa (decide se o atalho de edição aparece). */
  profissionalUsuarioId?: number;
  profissionalNome: string;
  profissionalConselho: string;
  tipoProfissionalId: number | null;
  tipoProfissionalNome: string | null;
  pacienteId: number;
  pacienteNome: string;
  pacienteTelefone: string | null;
  especialidadeId: number;
  especialidadeNome: string;
  dataHora: string;
  dataHoraFim: string;
  duracaoMinutos: number;
  status: StatusConsulta;
  observacoes: string | null;
  formaPagamentoId: number;
  formaPagamentoNome: string;
  valor: number;
  canceladoPor: number | null;
  motivoCancelamento: string | null;
  createdAt: string;
}



export enum StatusConsulta {
  AGENDADA = 'AGENDADA',
  CONFIRMADA = 'CONFIRMADA',
  REALIZADA = 'REALIZADA',
  CANCELADA = 'CANCELADA',
  PAGO = 'PAGO',
  FALTOU = 'FALTOU',
  REMARCADA = 'REMARCADA'
}
