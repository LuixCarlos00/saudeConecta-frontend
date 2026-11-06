import { ChartConfiguration } from 'chart.js';
import {
  DashboardPlataforma,
  StatusAssinaturaPlataforma
} from 'src/app/features/dashboard/data-access/plataforma-dashboard-api.service';
import { formatarInteiro, formatarMoeda, ROTULO_STATUS, rotuloMes } from './plataforma-formatadores';

/** Cores semânticas por status (contraste mantido em fundo claro e escuro). */
export const COR_STATUS: Record<StatusAssinaturaPlataforma, string> = {
  ATIVA: '#10b981',
  TRIAL: '#3b82f6',
  INADIMPLENTE: '#f59e0b',
  SUSPENSA: '#ea580c',
  CANCELADA: '#6b7280'
};

const COR_RECEITA = '#0d9488';
const COR_NOVAS = '#10b981';
const COR_CANCELAMENTOS = '#ef4444';
const COR_CONSULTAS = '#3b82f6';
const COR_PLANO = '#3b82f6';
const COR_PERFIL = '#0ea5e9';

/** Cores do tema atual lidas das variáveis CSS (texto e grade dos eixos). */
export interface PaletaGrafico {
  texto: string;
  grade: string;
  fundo: string;
}

/**
 * Lê a paleta do tema vigente a partir das variáveis CSS do documento.
 *
 * @returns cores de texto, grade e fundo do card
 */
export function lerPaletaDoTema(): PaletaGrafico {
  const css = getComputedStyle(document.documentElement);
  const ler = (nome: string, padrao: string): string => css.getPropertyValue(nome).trim() || padrao;
  return {
    texto: ler('--text-secondary', '#4b5563'),
    grade: ler('--border-color', '#e5e7eb'),
    fundo: ler('--bg-card', '#ffffff')
  };
}

type Opcoes = NonNullable<ChartConfiguration<'bar'>['options']>;
type Formatador = (valor: number) => string;

function opcoesEixos(
  paleta: PaletaGrafico,
  formatarValor: Formatador,
  horizontal = false,
  legenda = false
): Opcoes {
  const eixoValor = {
    beginAtZero: true,
    ticks: { color: paleta.texto, precision: 0, callback: (v: string | number) => formatarValor(Number(v)) },
    grid: { color: paleta.grade }
  };
  const eixoCategoria = { ticks: { color: paleta.texto }, grid: { display: false } };
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    interaction: { mode: 'index', intersect: false },
    scales: horizontal ? { x: eixoValor, y: eixoCategoria } : { x: eixoCategoria, y: eixoValor },
    plugins: {
      legend: { display: legenda, position: 'bottom', labels: { color: paleta.texto, usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: ctx => {
            const valor = Number(horizontal ? ctx.parsed.x : ctx.parsed.y);
            const nome = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
            return `${nome}${formatarValor(valor)}`;
          }
        }
      }
    }
  } as Opcoes;
}

/** Rosca de assinaturas por status. */
export function graficoStatus(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'doughnut'>['data']; options: NonNullable<ChartConfiguration<'doughnut'>['options']>;
} {
  return {
    data: {
      labels: d.porStatus.map(s => ROTULO_STATUS[s.status] ?? s.status),
      datasets: [{
        data: d.porStatus.map(s => s.quantidade),
        backgroundColor: d.porStatus.map(s => COR_STATUS[s.status] ?? '#9ca3af'),
        borderColor: paleta.fundo,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: { position: 'bottom', labels: { color: paleta.texto, usePointStyle: true } },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${formatarInteiro(Number(ctx.parsed))} clínica(s)` } }
      }
    }
  };
}

/** Barras: clínicas ativas por plano. */
export function graficoClinicasPorPlano(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'bar'>['data']; options: NonNullable<ChartConfiguration<'bar'>['options']>;
} {
  return {
    data: {
      labels: d.porPlano.map(p => p.plano),
      datasets: [{ label: 'Clínicas', data: d.porPlano.map(p => p.quantidade), backgroundColor: COR_PLANO, borderRadius: 4 }]
    },
    options: opcoesEixos(paleta, formatarInteiro) as unknown as NonNullable<ChartConfiguration<'bar'>['options']>
  };
}

/** Barras: MRR por plano, em R$. */
export function graficoMrrPorPlano(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'bar'>['data']; options: NonNullable<ChartConfiguration<'bar'>['options']>;
} {
  return {
    data: {
      labels: d.porPlano.map(p => p.plano),
      datasets: [{ label: 'MRR', data: d.porPlano.map(p => p.mrr), backgroundColor: COR_RECEITA, borderRadius: 4 }]
    },
    options: opcoesEixos(paleta, formatarMoeda) as unknown as NonNullable<ChartConfiguration<'bar'>['options']>
  };
}

/** Barras: receita recebida por mês, em R$. */
export function graficoReceitaMensal(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'bar'>['data']; options: NonNullable<ChartConfiguration<'bar'>['options']>;
} {
  return {
    data: {
      labels: d.serieMensal.map(p => rotuloMes(p.mes)),
      datasets: [{
        label: 'Receita recebida',
        data: d.serieMensal.map(p => p.receitaRecebida),
        backgroundColor: COR_RECEITA,
        borderRadius: 4
      }]
    },
    options: opcoesEixos(paleta, formatarMoeda) as unknown as NonNullable<ChartConfiguration<'bar'>['options']>
  };
}

/** Linhas: novas clínicas x cancelamentos por mês. */
export function graficoNovasVsCancelamentos(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'line'>['data']; options: NonNullable<ChartConfiguration<'line'>['options']>;
} {
  const base = { tension: 0.3, pointRadius: 3, borderWidth: 2 };
  return {
    data: {
      labels: d.serieMensal.map(p => rotuloMes(p.mes)),
      datasets: [
        { ...base, label: 'Novas clínicas', data: d.serieMensal.map(p => p.novasClinicas), borderColor: COR_NOVAS, backgroundColor: COR_NOVAS },
        { ...base, label: 'Cancelamentos', data: d.serieMensal.map(p => p.cancelamentos), borderColor: COR_CANCELAMENTOS, backgroundColor: COR_CANCELAMENTOS }
      ]
    },
    options: opcoesEixos(paleta, formatarInteiro, false, true) as unknown as NonNullable<ChartConfiguration<'line'>['options']>
  };
}

/** Barras: consultas por mês. */
export function graficoConsultasMensais(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'bar'>['data']; options: NonNullable<ChartConfiguration<'bar'>['options']>;
} {
  return {
    data: {
      labels: d.serieMensal.map(p => rotuloMes(p.mes)),
      datasets: [{ label: 'Consultas', data: d.serieMensal.map(p => p.consultas), backgroundColor: COR_CONSULTAS, borderRadius: 4 }]
    },
    options: opcoesEixos(paleta, formatarInteiro) as unknown as NonNullable<ChartConfiguration<'bar'>['options']>
  };
}

/** Barras horizontais: usuários ativos por perfil. */
export function graficoUsuariosPorPerfil(d: DashboardPlataforma, paleta: PaletaGrafico): {
  data: ChartConfiguration<'bar'>['data']; options: NonNullable<ChartConfiguration<'bar'>['options']>;
} {
  return {
    data: {
      labels: d.usuariosPorPerfil.map(u => u.perfil),
      datasets: [{ label: 'Usuários', data: d.usuariosPorPerfil.map(u => u.quantidade), backgroundColor: COR_PERFIL, borderRadius: 4 }]
    },
    options: opcoesEixos(paleta, formatarInteiro, true) as unknown as NonNullable<ChartConfiguration<'bar'>['options']>
  };
}
