import { formatarDataLocal } from 'src/app/shared/utils/data-local';

/**
 * Funções puras do dashboard: intervalos de datas, agrupamentos, totais, saldo,
 * categorias e tempo médio. Não tocam em Angular, HTTP nem no relógio (o "hoje"
 * entra por parâmetro), por isso são testáveis sem TestBed.
 */

/** Largura padrão das barras dos gráficos de barra. */
export const LARGURA_BARRA_PADRAO = {
  barPercentage: 0.5,
  categoryPercentage: 0.6,
};

export enum PeriodoFiltroSaldo {
  ESTE_MES = 'ESTE_MES',
  ULTIMOS_3_MESES = 'ULTIMOS_3_MESES',
  ULTIMOS_6_MESES = 'ULTIMOS_6_MESES',
  ESTE_ANO = 'ESTE_ANO'
}

export enum PeriodoEnumMediaTempo {
  SETE_DIAS = 1,
  TRINTA_DIAS = 2,
  SESSENTA_DIAS = 3,
  PERSONALIZADO = 0
}

export interface EspecialidadeResumo {
  nome: string;
  quantidade: number;
  percentual: number;
}

export interface MediaTempoConsulta {
  mediaTempo: number;
  totalConsultas: number;
  tempoMinimo: number;
  tempoMaximo: number;
}

export interface IntervaloDatas {
  inicio: string;
  fim: string;
}

export const PALETA_CORES_CATEGORIA: readonly string[] = [
  'rgba(59, 130, 246, 0.75)',
  'rgba(16, 185, 129, 0.75)',
  'rgba(245, 158, 11, 0.75)',
  'rgba(239, 68, 68, 0.75)',
  'rgba(139, 92, 246, 0.75)',
  'rgba(236, 72, 153, 0.75)',
  'rgba(6, 182, 212, 0.75)',
  'rgba(249, 115, 22, 0.75)',
  'rgba(34, 197, 94, 0.75)',
  'rgba(99, 102, 241, 0.75)',
  'rgba(168, 85, 247, 0.75)',
  'rgba(14, 165, 233, 0.75)'
];

export const PALETA_BORDAS_CATEGORIA: readonly string[] = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(6, 182, 212, 1)',
  'rgba(249, 115, 22, 1)',
  'rgba(34, 197, 94, 1)',
  'rgba(99, 102, 241, 1)',
  'rgba(168, 85, 247, 1)',
  'rgba(14, 165, 233, 1)'
];

const DIAS_POR_PERIODO_PADRONIZADO: Readonly<Record<number, number>> = { 1: 7, 2: 30, 3: 60 };

const DIAS_POR_PERIODO_MEDIA_TEMPO: Readonly<Record<PeriodoEnumMediaTempo, number>> = {
  [PeriodoEnumMediaTempo.SETE_DIAS]: 7,
  [PeriodoEnumMediaTempo.TRINTA_DIAS]: 30,
  [PeriodoEnumMediaTempo.SESSENTA_DIAS]: 60,
  [PeriodoEnumMediaTempo.PERSONALIZADO]: 0
};

// ===========================================================================
// CONSULTAS E AGENDAMENTOS
// ===========================================================================

/**
 * Intervalo dos filtros rápidos (1 = 7 dias, 2 = 30 dias, 3 = 60 dias), em datas locais.
 *
 * @param opcao opção do filtro; qualquer outro valor devolve o início vazio
 * @param hoje data de referência
 * @returns início (vazio se a opção for desconhecida) e fim no formato yyyy-MM-dd
 */
export function calcularIntervaloPadronizado(opcao: number, hoje: Date): IntervaloDatas {
  const dias = DIAS_POR_PERIODO_PADRONIZADO[opcao];
  let inicio = '';
  if (dias) {
    const data = new Date(hoje.getTime());
    data.setDate(data.getDate() - dias);
    inicio = formatarDataLocal(data);
  }
  return { inicio, fim: formatarDataLocal(hoje) };
}

/** Datas (dataHora ou conData, como texto) das consultas que têm data. */
export function extrairDatasConsultas(consultas: any[]): string[] {
  const datas: string[] = [];
  consultas.forEach((consulta) => {
    const data = consulta.dataHora || consulta.conData;
    if (data) {
      datas.push(data.toString());
    }
  });
  return datas;
}

/** Apenas o dia (yyyy-MM-dd, sem a hora) dos agendamentos que têm data. */
export function extrairDatasAgendamentos(consultas: any[]): string[] {
  const datas: string[] = [];
  consultas.forEach((consulta) => {
    // Suporta tanto formato novo (dataHora) quanto legado (conData)
    const dataCompleta = consulta.dataHora || consulta.conData;
    if (dataCompleta) {
      datas.push(dataCompleta.toString().split('T')[0]);
    }
  });
  return datas;
}

/** Quantidade de consultas por especialidade, na ordem em que cada uma aparece. */
export function contarConsultasPorEspecialidade(consultas: any[]): { especialidade: string; quantidade: number }[] {
  const counts: { [especialidade: string]: number } = {};

  consultas.forEach((consulta) => {
    const especialidade = consulta.especialidadeNome || consulta.conMedico?.medEspecialidade || 'Não informado';
    counts[especialidade] = counts[especialidade] ? counts[especialidade] + 1 : 1;
  });

  return Object.keys(counts).map((especialidade) => ({
    especialidade,
    quantidade: counts[especialidade],
  }));
}

/** Agrupa as datas (yyyy-MM-dd) por dia, do mais antigo ao mais novo. */
export function contarAgendamentosPorData(datas: string[]): { data: string; quantidade: number }[] {
  const counts: { [data: string]: number } = {};
  datas.forEach((data) => {
    counts[data] = counts[data] ? counts[data] + 1 : 1;
  });

  return Object.keys(counts)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((data) => ({ data, quantidade: counts[data] }));
}

/** Rótulo DD/MM de uma data yyyy-MM-dd; texto fora do padrão volta como veio. */
export function formatarDataAgendamentos(dataStr: string): string {
  if (!dataStr) return '';
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}`;
  }
  return dataStr;
}

// ===========================================================================
// SALDO FINANCEIRO
// ===========================================================================

/** Do primeiro dia do período escolhido até hoje, em datas locais. */
export function calcularIntervaloSaldo(periodo: PeriodoFiltroSaldo, hoje: Date): IntervaloDatas {
  let inicio: Date;

  switch (periodo) {
    case PeriodoFiltroSaldo.ESTE_MES:
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case PeriodoFiltroSaldo.ULTIMOS_3_MESES:
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
      break;
    case PeriodoFiltroSaldo.ULTIMOS_6_MESES:
      inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
      break;
    case PeriodoFiltroSaldo.ESTE_ANO:
      inicio = new Date(hoje.getFullYear(), 0, 1);
      break;
  }

  return { inicio: formatarDataLocal(inicio), fim: formatarDataLocal(hoje) };
}

/** "Este mês" agrupa por semana; os demais períodos agrupam por mês. */
export function agruparSaldoPor(periodo: PeriodoFiltroSaldo): 'semana' | 'mes' {
  return periodo === PeriodoFiltroSaldo.ESTE_MES ? 'semana' : 'mes';
}

/** Valor em reais com duas casas; nulo vira R$ 0,00. */
export function formatarMoeda(valor: number): string {
  return 'R$ ' + (valor ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ===========================================================================
// CLÍNICOS POR ESPECIALIDADE
// ===========================================================================

/** Especialidade principal: a primeira da lista, ou medEspecialidade, ou "Não informado". */
export function especialidadePrincipal(medico: any): string {
  if (medico.especialidades && medico.especialidades.length > 0) {
    return medico.especialidades[0].nome;
  }
  if (medico.medEspecialidade) {
    return medico.medEspecialidade.toString();
  }
  return 'Não informado';
}

/** Conta os profissionais por especialidade (maior primeiro) com o percentual arredondado. */
export function calcularEspecialidadesCategoria(profissionais: any[]): EspecialidadeResumo[] {
  const total = profissionais.length;
  const contagem = new Map<string, number>();

  profissionais.forEach(prof => {
    const esp = especialidadePrincipal(prof);
    contagem.set(esp, (contagem.get(esp) || 0) + 1);
  });

  return Array.from(contagem.entries())
    .map(([nome, quantidade]) => ({
      nome,
      quantidade,
      percentual: total > 0 ? Math.round((quantidade / total) * 100) : 0
    }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

/** Cor da especialidade pelo índice; a paleta gira ao passar de 12. */
export function corEspecialidadeCategoria(index: number): string {
  return PALETA_CORES_CATEGORIA[index % PALETA_CORES_CATEGORIA.length];
}

// ===========================================================================
// MÉDIA DE TEMPO DE CONSULTA
// ===========================================================================

/** Intervalo do período (7/30/60 dias); o personalizado (0) não recua e dá hoje-hoje. */
export function calcularIntervaloMediaTempo(periodo: PeriodoEnumMediaTempo, hoje: Date): IntervaloDatas {
  const inicio = new Date(hoje.getTime());
  const diasSubtrair = DIAS_POR_PERIODO_MEDIA_TEMPO[periodo];
  if (diasSubtrair > 0) {
    inicio.setDate(inicio.getDate() - diasSubtrair);
  }
  return { inicio: formatarDataLocal(inicio), fim: formatarDataLocal(hoje) };
}

/** Média (1 casa decimal), total, mínimo e máximo das durações em minutos. */
export function calcularEstatisticasMediaTempo(duracoes: number[]): MediaTempoConsulta {
  if (!duracoes || duracoes.length === 0) {
    return { mediaTempo: 0, totalConsultas: 0, tempoMinimo: 0, tempoMaximo: 0 };
  }

  const soma = duracoes.reduce((acc, val) => acc + val, 0);

  return {
    mediaTempo: Math.round((soma / duracoes.length) * 10) / 10,
    totalConsultas: duracoes.length,
    tempoMinimo: Math.min(...duracoes),
    tempoMaximo: Math.max(...duracoes)
  };
}

/**
 * Valida o intervalo personalizado do tempo médio.
 *
 * @returns a mensagem de erro para o usuário, ou null quando o intervalo é válido
 */
export function validarIntervaloMediaTempo(inicio: Date, fim: Date): string | null {
  if (!inicio || !fim) {
    return 'Selecione as datas de início e fim.';
  }
  if (inicio > fim) {
    return 'A data de início deve ser anterior à data de fim.';
  }
  const diffDias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDias > 365) {
    return 'O intervalo não pode ser maior que 365 dias.';
  }
  return null;
}

/** Minutos como "45 min" (abaixo de 1h) ou "1h 30min". */
export function formatarTempo(minutos: number): string {
  if (minutos < 60) {
    return `${minutos.toFixed(0)} min`;
  }
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  return `${horas}h ${mins}min`;
}
