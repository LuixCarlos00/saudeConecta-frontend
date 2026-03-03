export interface Consultav2 {
  id: number;
  profissionalId: number;
  profissionalNome: string;
  profissionalConselho: string;
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
  REALIZADA = 'REALIZADA',
  CANCELADA = 'CANCELADA',
  PAGO = 'PAGO',
  FALTOU = 'FALTOU',
  REMARCADA = 'REMARCADA'
}
export enum FormaPagamento {
  PARTICULAR = 1,
  CONVENIO = 2,
  PIX = 3
}
