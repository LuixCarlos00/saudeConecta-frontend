import { Injectable } from '@angular/core';

export interface CondicaoCronica {
  nome: string;
  frequencia: number;
  urgente: boolean;
}

export interface Recomendacao {
  titulo: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface TimelineItem {
  data: string;
  resumo: string;
  tags: string[];
}

export interface UltimaConsultaDetalhada {
  data: string;
  pressao: string;
  pulso: string;
  temperatura: string;
  saturacao: string;
  peso: string;
  altura: string;
  queixaPrincipal: string;
  diagnostico: string;
}

export interface ResumoClinico {
  totalConsultas: number;
  periodo: { primeira: string; ultima: string; meses: number } | null;
  intervaloDias: number | null;
  gravidadeGeral: 'baixa' | 'moderada' | 'alta';
  condicoesCronicas: CondicaoCronica[];
  alertasClinicos: string[];
  medicamentos: string[];
  vitaisAnormais: string[];
  vitaisDescricoes: string[];
  frequencia: {
    recente: number;
    anterior: number;
    tendencia: 'crescente' | 'decrescente' | 'estavel';
    descricao: string;
  };
  timeline: TimelineItem[];
  recomendacoes: Recomendacao[];
  ultimaConsultaDetalhada: UltimaConsultaDetalhada | null;
}

@Injectable({ providedIn: 'root' })
export class IALocalService {

  private readonly CRONICAS = [
    'hipertensão', 'diabetes', 'asma', 'artrite', 'depressão', 'ansiedade',
    'colesterol', 'triglicerídeos', 'osteoporose', 'enxaqueca', 'insônia',
    'gastrite', 'refluxo', 'rinite', 'sinusite', 'alergia', 'fibromialgia',
    'hipotireoidismo', 'hipertireoidismo', 'bronquite', 'insuficiência cardíaca',
    'parkinson', 'alzheimer', 'epilepsia', 'lúpus', 'psoríase', 'doença renal'
  ];

  private readonly URGENTES = [
    'dor forte', 'dor intensa', 'febre alta', 'dificuldade respirar', 'pressão alta',
    'tontura', 'desmaio', 'sangramento', 'vômito persistente', 'dor no peito',
    'perda de visão', 'confusão mental', 'paralisia', 'dificuldade falar',
    'dor abdominal intensa', 'falta de ar'
  ];

  private readonly MEDICAMENTOS = [
    'ibuprofeno', 'paracetamol', 'dipirona', 'amoxicilina', 'losartana',
    'metformina', 'omeprazol', 'atorvastatina', 'salbutamol', 'diazepam',
    'captopril', 'enalapril', 'hidroclorotiazida', 'sertralina', 'fluoxetina',
    'amlodipina', 'sinvastatina', 'azitromicina', 'prednisona', 'insulina',
    'ramipril', 'carvedilol', 'espironolactona', 'furosemida', 'metoprolol'
  ];

  analisarHistorico(historico: any[], tipo: string = 'medico'): ResumoClinico {
    if (!historico?.length) return this.resumoVazio();

    const ordenado = this.ordenarPorData(historico);
    const condicoes = this.extrairCondicoes(ordenado);
    const alertas = this.extrairAlertas(ordenado);
    const meds = this.extrairMedicamentos(ordenado);
    const periodo = this.calcularPeriodo(ordenado);
    const frequencia = this.calcularFrequencia(ordenado);
    const vitais = this.analisarVitais(ordenado[ordenado.length - 1]);
    const timeline = this.montarTimeline(ordenado);
    const gravidade = this.calcularGravidade(condicoes, alertas, vitais.anormais, frequencia);
    const recomendacoes = this.gerarRecomendacoes(condicoes, alertas, vitais, gravidade, frequencia, ordenado.length);
    const intervaloDias = periodo && ordenado.length > 1
      ? Math.round(periodo.dias / (ordenado.length - 1)) : null;

    return {
      totalConsultas: ordenado.length,
      periodo: periodo ? {
        primeira: this.formatarData(periodo.primeira),
        ultima: this.formatarData(periodo.ultima),
        meses: Math.floor(periodo.dias / 30)
      } : null,
      intervaloDias,
      gravidadeGeral: gravidade,
      condicoesCronicas: condicoes,
      alertasClinicos: alertas,
      medicamentos: meds,
      vitaisAnormais: vitais.anormais,
      vitaisDescricoes: vitais.descricoes,
      frequencia,
      timeline,
      recomendacoes,
      ultimaConsultaDetalhada: this.extrairUltimaConsulta(ordenado[ordenado.length - 1]),
    };
  }

  private ordenarPorData(historico: any[]): any[] {
    return [...historico].sort((a, b) => {
      const da = new Date(a.dataFinalizado || a.prontDataFinalizado || 0);
      const db = new Date(b.dataFinalizado || b.prontDataFinalizado || 0);
      return da.getTime() - db.getTime();
    });
  }

  private extrairCondicoes(historico: any[]): CondicaoCronica[] {
    const mapa = new Map<string, number>();
    historico.forEach(c => {
      const texto = this.textoCompleto(c).toLowerCase();
      this.CRONICAS.forEach(cond => {
        if (texto.includes(cond)) mapa.set(cond, (mapa.get(cond) || 0) + 1);
      });
    });
    return Array.from(mapa.entries())
      .map(([nome, frequencia]) => ({
        nome: this.capitalize(nome),
        frequencia,
        urgente: ['hipertensão', 'diabetes', 'insuficiência cardíaca'].includes(nome)
      }))
      .sort((a, b) => b.frequencia - a.frequencia);
  }

  private extrairAlertas(historico: any[]): string[] {
    const encontrados = new Set<string>();
    historico.forEach(c => {
      const texto = this.textoCompleto(c).toLowerCase();
      this.URGENTES.forEach(u => {
        if (texto.includes(u)) encontrados.add(this.capitalize(u));
      });
    });
    return Array.from(encontrados);
  }

  private extrairMedicamentos(historico: any[]): string[] {
    const encontrados = new Set<string>();
    historico.forEach(c => {
      const texto = (c.prescricao || c.prontPrescricao || '').toLowerCase();
      this.MEDICAMENTOS.forEach(m => {
        if (texto.includes(m)) encontrados.add(this.capitalize(m));
      });
    });
    return Array.from(encontrados);
  }

  private calcularPeriodo(historico: any[]): { primeira: Date; ultima: Date; dias: number } | null {
    const datas = historico
      .map(h => h.dataFinalizado || h.prontDataFinalizado)
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()));

    if (!datas.length) return null;
    datas.sort((a, b) => a.getTime() - b.getTime());
    const primeira = datas[0];
    const ultima = datas[datas.length - 1];
    const dias = Math.round((ultima.getTime() - primeira.getTime()) / 86400000);
    return { primeira, ultima, dias };
  }

  private calcularFrequencia(historico: any[]) {
    const agora = new Date();
    const seisMeses = new Date(agora.getTime() - 180 * 86400000);
    const dozeMeses = new Date(agora.getTime() - 360 * 86400000);

    const recente = historico.filter(h => {
      const d = new Date(h.dataFinalizado || h.prontDataFinalizado || 0);
      return d > seisMeses;
    }).length;

    const anterior = historico.filter(h => {
      const d = new Date(h.dataFinalizado || h.prontDataFinalizado || 0);
      return d > dozeMeses && d <= seisMeses;
    }).length;

    let tendencia: 'crescente' | 'decrescente' | 'estavel';
    let descricao: string;

    if (recente > anterior + 1) {
      tendencia = 'crescente';
      descricao = 'Aumento recente — possível quadro agudo ou descompensação';
    } else if (anterior > recente + 1) {
      tendencia = 'decrescente';
      descricao = 'Redução recente — paciente possivelmente estabilizado';
    } else {
      tendencia = 'estavel';
      descricao = 'Frequência estável — acompanhamento regular';
    }

    return { recente, anterior, tendencia, descricao };
  }

  private analisarVitais(ultima: any): { anormais: string[]; descricoes: string[] } {
    if (!ultima) return { anormais: [], descricoes: [] };

    const anormais: string[] = [];
    const descricoes: string[] = [];

    const pressao = ultima.pressao || ultima.prontPressao;
    if (pressao) {
      const m = pressao.match(/(\d+)[x\/](\d+)/);
      if (m) {
        const s = parseInt(m[1]), d = parseInt(m[2]);
        if (s > 140 || d > 90) {
          anormais.push('pressao');
          descricoes.push(`PA elevada: ${s}x${d} mmHg`);
        }
      }
    }

    const temp = parseFloat((ultima.temperatura || ultima.prontTemperatura || '').replace(',', '.'));
    if (temp > 37.5) { anormais.push('temperatura'); descricoes.push(`Febre: ${temp}°C`); }

    const sat = parseInt((ultima.saturacao || ultima.prontSaturacao || '').replace(/\D/g, ''));
    if (sat && sat < 95) { anormais.push('saturacao'); descricoes.push(`SpO₂ baixa: ${sat}%`); }

    const peso = parseFloat((ultima.peso || ultima.prontPeso || '').replace(',', '.'));
    const altura = parseFloat((ultima.altura || ultima.prontAltura || '').replace(',', '.').replace('m', ''));
    if (peso && altura) {
      const h = altura < 3 ? altura : altura / 100;
      const imc = peso / (h * h);
      if (imc >= 30) { anormais.push('imc'); descricoes.push(`Obesidade: IMC ${imc.toFixed(1)}`); }
      else if (imc >= 25) { descricoes.push(`Sobrepeso: IMC ${imc.toFixed(1)}`); }
    }

    return { anormais, descricoes };
  }

  private extrairUltimaConsulta(ultima: any): UltimaConsultaDetalhada | null {
    if (!ultima) return null;
    const data = ultima.dataFinalizado || ultima.prontDataFinalizado;
    return {
      data: data ? this.formatarData(new Date(data)) : '—',
      pressao: ultima.pressao || ultima.prontPressao || '',
      pulso: ultima.pulso || ultima.prontPulso || '',
      temperatura: ultima.temperatura || ultima.prontTemperatura || '',
      saturacao: ultima.saturacao || ultima.prontSaturacao || '',
      peso: ultima.peso || ultima.prontPeso || '',
      altura: ultima.altura || ultima.prontAltura || '',
      queixaPrincipal: ultima.queixaPrincipal || ultima.prontQueixaPricipal || '',
      diagnostico: ultima.diagnostico || ultima.prontDiagnostico || '',
    };
  }

  private montarTimeline(historico: any[]): TimelineItem[] {
    return [...historico].reverse().slice(0, 10).map(c => {
      const data = c.dataFinalizado || c.prontDataFinalizado;
      const queixa = c.queixaPrincipal || c.prontQueixaPricipal || '';
      const diagnostico = c.diagnostico || c.prontDiagnostico || '';
      const tags: string[] = [];

      const texto = this.textoCompleto(c).toLowerCase();
      if (texto.includes('pressão alta') || texto.includes('hipertensão')) tags.push('Hipertensão');
      if (texto.includes('diabetes')) tags.push('Diabetes');
      if (texto.includes('febre')) tags.push('Febre');
      if (c.prescricao || c.prontPrescricao) tags.push('Prescrição');

      const partes = [queixa, diagnostico].filter(Boolean);
      return {
        data: data ? this.formatarData(new Date(data)) : '—',
        resumo: partes.join(' — ') || 'Sem detalhes registrados',
        tags
      };
    });
  }

  private calcularGravidade(
    condicoes: CondicaoCronica[],
    alertas: string[],
    vitaisAnormais: string[],
    frequencia: any
  ): 'baixa' | 'moderada' | 'alta' {
    let pts = 0;
    if (condicoes.length >= 3) pts += 2;
    else if (condicoes.length > 0) pts += 1;
    if (alertas.length >= 2) pts += 2;
    else if (alertas.length > 0) pts += 1;
    pts += vitaisAnormais.length;
    if (frequencia.tendencia === 'crescente') pts += 1;
    if (pts >= 5) return 'alta';
    if (pts >= 2) return 'moderada';
    return 'baixa';
  }

  private gerarRecomendacoes(
    condicoes: CondicaoCronica[],
    alertas: string[],
    vitais: any,
    gravidade: string,
    frequencia: any,
    total: number
  ): Recomendacao[] {
    const recs: Recomendacao[] = [];

    if (vitais.anormais.includes('pressao')) {
      recs.push({
        titulo: 'Controle pressórico urgente',
        descricao: 'PA elevada registrada — avaliar ajuste terapêutico ou associação de anti-hipertensivos.',
        prioridade: 'alta'
      });
    }

    if (vitais.anormais.includes('saturacao')) {
      recs.push({
        titulo: 'Saturação de oxigênio baixa',
        descricao: 'SpO₂ < 95% — investigar causa pulmonar ou circulatória.',
        prioridade: 'alta'
      });
    }

    if (condicoes.length >= 3) {
      recs.push({
        titulo: 'Paciente plurimórbido',
        descricao: `${condicoes.length} condições identificadas — considerar abordagem multidisciplinar e revisão de polifarmácia.`,
        prioridade: 'media'
      });
    }

    if (frequencia.tendencia === 'crescente') {
      recs.push({
        titulo: 'Aumento de demanda recente',
        descricao: 'Frequência de consultas crescente — investigar causas e otimizar plano terapêutico.',
        prioridade: 'media'
      });
    }

    if (vitais.anormais.includes('imc')) {
      recs.push({
        titulo: 'Controle de peso',
        descricao: 'IMC elevado — orientar dieta, atividade física e avaliar impacto nas condições crônicas.',
        prioridade: 'media'
      });
    }

    if (alertas.length > 0) {
      recs.push({
        titulo: 'Sintomas agudos no histórico',
        descricao: `${alertas.slice(0, 3).join(', ')} — elaborar plano de ação para situações de urgência.`,
        prioridade: 'media'
      });
    }

    if (!recs.length || gravidade === 'baixa') {
      recs.push({
        titulo: 'Paciente estável',
        descricao: 'Nenhum alerta crítico identificado — manter seguimento regular conforme protocolo.',
        prioridade: 'baixa'
      });
    }

    return recs.sort((a, b) => {
      const ord = { alta: 0, media: 1, baixa: 2 };
      return ord[a.prioridade] - ord[b.prioridade];
    });
  }

  private textoCompleto(c: any): string {
    return [
      'queixaPrincipal', 'anamnese', 'diagnostico', 'prescricao',
      'observacao', 'orientacoes', 'prontQueixaPricipal', 'prontAnamnese',
      'prontDiagnostico', 'prontPrescricao', 'prontObservacao', 'prontOrientacoes'
    ].map(k => c[k] || '').join(' ');
  }

  private formatarData(data: Date): string {
    if (!(data instanceof Date) || isNaN(data.getTime())) return '—';
    return data.toLocaleDateString('pt-BR');
  }

  private capitalize(str: string): string {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
  }

  private resumoVazio(): ResumoClinico {
    return {
      totalConsultas: 0, periodo: null, intervaloDias: null,
      gravidadeGeral: 'baixa', condicoesCronicas: [], alertasClinicos: [],
      medicamentos: [], vitaisAnormais: [], vitaisDescricoes: [],
      frequencia: { recente: 0, anterior: 0, tendencia: 'estavel', descricao: 'Sem dados' },
      timeline: [], recomendacoes: [], ultimaConsultaDetalhada: null
    };
  }
}