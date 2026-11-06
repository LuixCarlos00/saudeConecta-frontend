import { Consultav2 } from 'src/app/shared/models/consultav2';
import { formatarHoraLocal } from 'src/app/shared/utils/data-local';

/**
 * Funções puras da agenda: filtros, grades do mês/semana/dia, título e navegação por período,
 * e helpers de status. Não dependem de Angular nem do relógio (o "hoje" entra por parâmetro).
 * Todas as datas são tratadas no calendário LOCAL.
 */

export type TipoVisualizacao = 'mes' | 'semana' | 'dia';

export interface DiaCalendario {
  data: Date;
  mesAtual: boolean;
  consultas: Consultav2[];
  hoje: boolean;
}

export interface HoraDia {
  hora: number;
  label: string;
  consultas: Consultav2[];
}

/** Filtros do painel lateral da agenda. */
export interface FiltrosAgenda {
  /** false = consultas agendadas/confirmadas; true = realizadas/pagas/canceladas */
  finalizadas: boolean;
  /** Status marcados no painel; vazio = todos do tipo escolhido */
  status: string[];
  /** ID do profissional vindo do select (texto); vazio = todos */
  profissional: string;
  especialidade: string;
  /** Trecho do nome do paciente, sem diferenciar maiúsculas */
  busca: string;
}

export const STATUS_OPCOES = [
  { value: 'AGENDADA',   label: 'Agendada',   cor: 'status-agendada'   },
  { value: 'CONFIRMADA', label: 'Confirmada', cor: 'status-confirmada' },
  { value: 'REALIZADA',  label: 'Realizada',  cor: 'status-realizada'  },
  { value: 'CANCELADA',  label: 'Cancelada',  cor: 'status-cancelada'  },
  { value: 'PAGO',       label: 'Pago',       cor: 'status-pago'       },
];

export const STATUS_FINALIZADAS = ['REALIZADA', 'PAGO', 'CANCELADA'];
export const STATUS_AGENDADAS = ['AGENDADA', 'CONFIRMADA'];

export const STATUS_LABELS: Record<string, string> = {
  AGENDADA: 'Agendada',
  CONFIRMADA: 'Confirmada',
  REALIZADA: 'Realizada',
  CANCELADA: 'Cancelada',
  PAGO: 'Pago',
  FALTOU: 'Faltou',
  REMARCADA: 'Remarcada',
};

export const DIAS_SEMANA_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const MESES_NOMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CLASSES_STATUS: Record<string, string> = {
  AGENDADA: 'status-agendada',
  CONFIRMADA: 'status-confirmada',
  REALIZADA: 'status-realizada',
  CANCELADA: 'status-cancelada',
  PAGO: 'status-pago',
  FALTOU: 'status-faltou',
  REMARCADA: 'status-remarcada',
};

const ORDEM_FLUXO = ['AGENDADA', 'CONFIRMADA', 'REALIZADA', 'PAGO'];

// ========== FILTROS ==========

/** Opções de status mostradas na legenda e nos filtros, conforme o tipo (agendadas ou finalizadas). */
export function legendaDoTipo(finalizadas: boolean): typeof STATUS_OPCOES {
  const permitidos = finalizadas ? STATUS_FINALIZADAS : STATUS_AGENDADAS;
  return STATUS_OPCOES.filter(s => permitidos.includes(s.value));
}

/** Aplica os filtros do painel; o tipo (agendadas/finalizadas) sempre vale, mesmo sem status marcado. */
export function filtrarConsultas(consultas: Consultav2[], filtros: FiltrosAgenda): Consultav2[] {
  const statusPermitidos = filtros.finalizadas ? STATUS_FINALIZADAS : STATUS_AGENDADAS;
  return consultas.filter(c => {
    const passaTipo = statusPermitidos.includes(c.status);
    const passaStatus = filtros.status.length === 0 || filtros.status.includes(c.status);
    const passaProfissional = !filtros.profissional || c.profissionalId === Number(filtros.profissional);
    const passaEspecialidade = !filtros.especialidade || c.especialidadeNome === filtros.especialidade;
    const passaBusca = !filtros.busca || c.pacienteNome?.toLowerCase().includes(filtros.busca.toLowerCase());
    return passaTipo && passaStatus && passaProfissional && passaEspecialidade && passaBusca;
  });
}

/** Profissionais (o último nome visto de cada ID vale) e especialidades (ordenadas) presentes nas consultas. */
export function extrairProfissionaisEEspecialidades(consultas: Consultav2[]): {
  profissionais: { id: number; nome: string }[];
  especialidades: string[];
} {
  const mapProf = new Map<number, string>();
  const setEspec = new Set<string>();
  consultas.forEach(c => {
    mapProf.set(c.profissionalId, c.profissionalNome);
    if (c.especialidadeNome) setEspec.add(c.especialidadeNome);
  });
  return {
    profissionais: Array.from(mapProf.entries()).map(([id, nome]) => ({ id, nome })),
    especialidades: Array.from(setEspec).sort(),
  };
}

// ========== DATAS ==========

export function isMesmaData(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** Domingo da semana da data informada. */
export function inicioDaSemana(data: Date): Date {
  const d = new Date(data);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function consultasDoDia(consultas: Consultav2[], data: Date): Consultav2[] {
  return consultas.filter(c => isMesmaData(new Date(c.dataHora), data));
}

function consultasDoDiaEHora(consultas: Consultav2[], data: Date, hora: number): Consultav2[] {
  return consultas.filter(c => {
    const dataConsulta = new Date(c.dataHora);
    return isMesmaData(dataConsulta, data) && dataConsulta.getHours() === hora;
  });
}

// ========== GRADES ==========

/** Grade fixa de 42 células (6 semanas) do mês de `dataAtual`, começando no domingo. */
export function gerarDiasMes(dataAtual: Date, consultas: Consultav2[], hoje: Date): DiaCalendario[] {
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const dias: DiaCalendario[] = [];

  // Preencher dias antes do primeiro dia do mês
  for (let i = primeiroDia.getDay(); i > 0; i--) {
    const data = new Date(ano, mes, 1 - i);
    dias.push({ data, mesAtual: false, consultas: consultasDoDia(consultas, data), hoje: false });
  }

  // Dias do mês atual
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const data = new Date(ano, mes, d);
    dias.push({
      data,
      mesAtual: true,
      consultas: consultasDoDia(consultas, data),
      hoje: isMesmaData(data, hoje)
    });
  }

  // Preencher dias após o último dia do mês para completar a grade
  const restante = 42 - dias.length;
  for (let i = 1; i <= restante; i++) {
    const data = new Date(ano, mes + 1, i);
    dias.push({ data, mesAtual: false, consultas: consultasDoDia(consultas, data), hoje: false });
  }

  return dias;
}

/** Os 7 dias (domingo a sábado) da semana de `dataAtual`. */
export function gerarDiasSemana(dataAtual: Date, consultas: Consultav2[], hoje: Date): DiaCalendario[] {
  const inicio = inicioDaSemana(dataAtual);
  return Array.from({ length: 7 }, (_, i) => {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);
    return {
      data,
      mesAtual: true,
      consultas: consultasDoDia(consultas, data),
      hoje: isMesmaData(data, hoje)
    };
  });
}

/** As 13 faixas de hora (07h às 19h) do dia de `dataAtual`. */
export function gerarHorasDia(dataAtual: Date, consultas: Consultav2[]): HoraDia[] {
  return Array.from({ length: 13 }, (_, i) => {
    const hora = 7 + i;
    return {
      hora,
      label: `${hora.toString().padStart(2, '0')}:00`,
      consultas: consultasDoDiaEHora(consultas, dataAtual, hora)
    };
  });
}

// ========== TÍTULO E NAVEGAÇÃO ==========

/** Título do período: "Novembro 2026", "1/11 – 7/11/2026" ou "6 de Novembro de 2026". */
export function tituloDoPeriodo(tipo: TipoVisualizacao, dataAtual: Date): string {
  if (tipo === 'mes') {
    return `${MESES_NOMES[dataAtual.getMonth()]} ${dataAtual.getFullYear()}`;
  }
  if (tipo === 'semana') {
    const inicio = inicioDaSemana(dataAtual);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
    return `${inicio.getDate()}/${inicio.getMonth() + 1} – ${fim.getDate()}/${fim.getMonth() + 1}/${fim.getFullYear()}`;
  }
  return `${dataAtual.getDate()} de ${MESES_NOMES[dataAtual.getMonth()]} de ${dataAtual.getFullYear()}`;
}

/**
 * Desloca a data de referência um período: mês (vai para o dia 1 do mês vizinho),
 * semana (7 dias) ou dia (1 dia).
 *
 * @param sentido -1 para o anterior, 1 para o próximo
 */
export function deslocarPeriodo(tipo: TipoVisualizacao, dataAtual: Date, sentido: 1 | -1): Date {
  if (tipo === 'mes') {
    return new Date(dataAtual.getFullYear(), dataAtual.getMonth() + sentido, 1);
  }
  const nova = new Date(dataAtual);
  nova.setDate(nova.getDate() + (tipo === 'semana' ? 7 : 1) * sentido);
  return nova;
}

// ========== STATUS ==========

/** Classe CSS do status; status desconhecido devolve vazio. */
export function classeStatus(status: string): string {
  return CLASSES_STATUS[status] || '';
}

/** Hora local HH:mm de um instante ISO; vazio devolve vazio. */
export function horarioLocal(dataHora: string): string {
  if (!dataHora) return '';
  return formatarHoraLocal(new Date(dataHora));
}

/** A etapa do fluxo (agendada, confirmada, realizada, paga) já ficou para trás do status atual? */
export function etapaConcluida(etapa: string, statusAtual: string): boolean {
  return ORDEM_FLUXO.indexOf(statusAtual) > ORDEM_FLUXO.indexOf(etapa);
}

/**
 * O botão de editar aparece no drawer? Consulta confirmada não é editável por gestor nem por
 * profissional; fora isso, só o gestor edita consultas agendadas ou confirmadas.
 */
export function podeEditarConsultaPorPerfil(status: string, ehAdmin: boolean, ehProfissional: boolean): boolean {
  if (status === 'CONFIRMADA' && (ehAdmin || ehProfissional)) {
    return false;
  }
  return (status === 'AGENDADA' || status === 'CONFIRMADA') && ehAdmin;
}

/** A consulta já tem atendimento em andamento (rascunho salvo)? */
export function temRascunho(consultasComRascunho: Set<number>, consulta: Consultav2 | null | undefined): boolean {
  return !!consulta && consultasComRascunho.has(consulta.id);
}
