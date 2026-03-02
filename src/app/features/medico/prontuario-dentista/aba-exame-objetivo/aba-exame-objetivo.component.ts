import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Dente,
  DenteStatus,
  DenteStatusOption,
  DentePayload,
  DENTE_STATUS_OPTIONS,
  getStatusOption,
} from 'src/app/util/variados/interfaces/Prontuario/ProntuarioDentista';

export interface QuadranteConfig {
  id: number;
  label: string;
  dentes: number[];
}

export const QUADRANTES: QuadranteConfig[] = [
  { id: 1, label: 'Q1 · Sup. Direito', dentes: [18, 17, 16, 15, 14, 13, 12, 11] },
  { id: 2, label: 'Q2 · Sup. Esquerdo', dentes: [21, 22, 23, 24, 25, 26, 27, 28] },
  { id: 4, label: 'Q4 · Inf. Direito', dentes: [48, 47, 46, 45, 44, 43, 42, 41] },
  { id: 3, label: 'Q3 · Inf. Esquerdo', dentes: [31, 32, 33, 34, 35, 36, 37, 38] },
];

@Component({
  selector: 'app-aba-exame-objetivo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aba-exame-objetivo.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaExameObjetivoComponent implements OnInit {

  // ── Sinais Vitais ──
  pressaoArterial = '';
  pulso = '';
  altura = '';
  temperatura = '';
  peso = '';

  // ── Exame Extrabucal ──
  edema = '';
  facies = '';
  linfonodos = '';

  // ── Anamnese ──
  QueixaPrincipal = '';
  HistoricoOdontologico = '';
  observacao = '';

  // ── Exame Intrabucal ──
  HigieneBucal = '';
  CondicaoGengival = '';
  labios = '';
  mucosas = '';
  soalhoBucal = '';
  palato = '';
  orofaringe = '';
  lingua = '';
  gengiva = '';
  habitosNocivos = '';
  portadorAparelho = '';
  oclusao = '';
  exameOutros = '';
  ATM = '';

  // ── Diagnóstico e Tratamento ──
  Diagnostico = '';
  Prescricao = '';
  Orientacoes = '';

  // ── Odontograma ──
  odontograma: Dente[] = [];
  selectedDente: Dente | null = null;
  hoveredDente: number | null = null;

  readonly denteStatusOptions: DenteStatusOption[] = DENTE_STATUS_OPTIONS;

  exameSubTab = 0;

  private readonly TODOS_DENTES = [
    11, 12, 13, 14, 15, 16, 17, 18,
    21, 22, 23, 24, 25, 26, 27, 28,
    31, 32, 33, 34, 35, 36, 37, 38,
    41, 42, 43, 44, 45, 46, 47, 48,
  ];

  ngOnInit(): void {
    this.inicializarOdontograma();
  }

  private inicializarOdontograma(): void {
    this.odontograma = this.TODOS_DENTES.map(n => ({
      numero: n,
      status: 'sadio' as DenteStatus,
    }));
  }

  // ── Odontograma — lógica ──
  getDente(numero: number): Dente {
    return this.odontograma.find(d => d.numero === numero)
      ?? { numero, status: 'sadio' };
  }

  selecionarDente(dente: Dente): void {
    this.selectedDente = this.selectedDente?.numero === dente.numero ? null : dente;
  }

  selecionarPorNumero(numero: number): void {
    this.selecionarDente(this.getDente(numero));
  }

  atualizarStatusDente(status: DenteStatus): void {
    if (this.selectedDente) {
      this.selectedDente.status = status;
    }
  }

  // ── Helpers de status ──
  getStatusOption(status: DenteStatus): DenteStatusOption { return getStatusOption(status); }
  getStatusColor(status: DenteStatus): string { return getStatusOption(status).color; }
  getStatusFill(status: DenteStatus): string { return getStatusOption(status).colorFill; }
  getLabelStatus(status: DenteStatus): string { return getStatusOption(status).label; }

  getToothFillColor(numero: number): string {
    return this.getStatusFill(this.getDente(numero).status);
  }

  getToothStrokeColor(numero: number): string {
    return this.getStatusColor(this.getDente(numero).status);
  }

  isSelected(numero: number): boolean { return this.selectedDente?.numero === numero; }
  isHovered(numero: number): boolean { return this.hoveredDente === numero; }

  get dentesAlterados(): number {
    return this.odontograma.filter(d => d.status !== 'sadio').length;
  }

  onHoverEnter(numero: number): void {
    this.hoveredDente = numero;
  }

  onHoverLeave(): void {
    this.hoveredDente = null;
  }

  private serializarOdontograma(): DentePayload[] {
    return this.odontograma
      .filter(d => d.status !== 'sadio' || (d.observacao && d.observacao.trim().length > 0))
      .map(d => ({
        numeroFdi: d.numero,
        status: d.status,
        observacao: d.observacao?.trim() || undefined,
      }));
  }

  /**
   * Preenche os campos da aba com dados existentes (modo edição).
   * @param dados Objeto com os campos do prontuário
   */
  setDados(dados: any): void {
    if (!dados) return;
    this.pressaoArterial = dados.pressaoArterial || '';
    this.pulso = dados.pulso || '';
    this.altura = dados.altura || '';
    this.temperatura = dados.temperatura || '';
    this.peso = dados.peso || '';
    this.edema = dados.edema || '';
    this.facies = dados.facies || '';
    this.linfonodos = dados.linfonodos || '';
    this.QueixaPrincipal = dados.queixaPrincipal || '';
    this.HistoricoOdontologico = dados.anamnese || '';
    this.observacao = dados.observacao || '';
    this.HigieneBucal = dados.higieneBucal || '';
    this.CondicaoGengival = dados.condicaoGengival || '';
    this.labios = dados.labios || '';
    this.mucosas = dados.mucosas || '';
    this.soalhoBucal = dados.soalhoBucal || '';
    this.palato = dados.palato || '';
    this.orofaringe = dados.orofaringe || '';
    this.lingua = dados.lingua || '';
    this.gengiva = dados.gengiva || '';
    this.habitosNocivos = dados.habitosNocivos || '';
    this.portadorAparelho = dados.portadorAparelho || '';
    this.oclusao = dados.oclusao || '';
    this.exameOutros = dados.exameOutros || '';
    this.ATM = dados.atm || '';
    this.Diagnostico = dados.diagnostico || '';
    this.Prescricao = dados.prescricao || '';
    this.Orientacoes = dados.orientacoes || '';

    // Restaurar odontograma a partir dos dentes salvos
    if (dados.dentes && Array.isArray(dados.dentes)) {
      for (const dente of dados.dentes) {
        const d = this.odontograma.find(o => o.numero === dente.numeroFdi);
        if (d) {
          d.status = dente.status || 'sadio';
          d.observacao = dente.observacao || undefined;
        }
      }
    }
  }

  /**
   * Retorna os dados da aba para composição do payload de finalização.
   */
  getDados(): any {
    return {
      queixaPrincipal: this.QueixaPrincipal,
      anamnese: this.HistoricoOdontologico,
      observacao: this.observacao,
      higieneBucal: this.HigieneBucal,
      condicaoGengival: this.CondicaoGengival,
      oclusal: '',
      atm: this.ATM,
      odontograma: this.serializarOdontograma(),
      diagnostico: this.Diagnostico,
      orientacoes: this.Orientacoes,
      pressaoArterial: this.pressaoArterial,
      pulso: this.pulso,
      altura: this.altura,
      temperatura: this.temperatura,
      peso: this.peso,
      edema: this.edema,
      facies: this.facies,
      linfonodos: this.linfonodos,
      labios: this.labios,
      mucosas: this.mucosas,
      soalhoBucal: this.soalhoBucal,
      palato: this.palato,
      orofaringe: this.orofaringe,
      lingua: this.lingua,
      gengiva: this.gengiva,
      habitosNocivos: this.habitosNocivos,
      portadorAparelho: this.portadorAparelho,
      oclusao: this.oclusao,
      exameOutros: this.exameOutros,
    };
  }
}
