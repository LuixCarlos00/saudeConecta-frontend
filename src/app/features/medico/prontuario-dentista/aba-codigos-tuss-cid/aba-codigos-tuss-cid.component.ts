import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CodigosTussCidService } from 'src/app/services/codigos/codigos-tuss-cid.service';

@Component({
  selector: 'app-aba-codigos-tuss-cid',
 
  templateUrl: './aba-codigos-tuss-cid.component.html',
  styleUrl: '../prontuario-dentista.component.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaCodigosTussCidComponent {

  private readonly MAX_AUTOCOMPLETE_RESULTS = 15;
  private readonly codigosService = inject(CodigosTussCidService);

  // ── Registros TUSS ──
  tussSelecionados: any[] = [];
  textoTuss = '';
  buscaTuss = '';
  tussResultados: any[] = [];

  // ── Registros CID ──
  cidSelecionados: any[] = [];
  textoCid = '';
  buscaCid = '';
  cidResultados: any[] = [];

  // ── Prescrição ──
  Prescricao = '';

  // ── Solicitação de Exame ──
  tussExameSelecionados: any[] = [];
  cidExameSelecionados: any[] = [];
  textoSolicitacaoExame = '';
  buscaTussExame = '';
  buscaCidExame = '';
  tussExameResultados: any[] = [];
  cidExameResultados: any[] = [];

  // ── TUSS ──
  async filtrarTuss(): Promise<void> {
    const termo = this.buscaTuss?.trim().toLowerCase();
    if (!termo || termo.length < 2) { this.tussResultados = []; return; }
    const resultados = await this.codigosService.buscarTuss(termo, this.MAX_AUTOCOMPLETE_RESULTS);
    // Descarta resposta atrasada se o usuário já digitou outra coisa durante o carregamento.
    if (this.buscaTuss?.trim().toLowerCase() === termo) { this.tussResultados = resultados; }
  }

  adicionarTuss(item: any): void {
    if (!this.tussSelecionados.some(t => t.codigo === item.codigo)) {
      this.tussSelecionados.push({ codigo: item.codigo, descricao: item.descricao, fabricante: item.fabricante });
      this.atualizarTextoTuss();
    }
    this.buscaTuss = '';
    this.tussResultados = [];
  }

  removerTuss(index: number): void {
    this.tussSelecionados.splice(index, 1);
    this.atualizarTextoTuss();
  }

  private atualizarTextoTuss(): void {
    this.textoTuss = this.tussSelecionados.length === 0 ? '' :
      this.tussSelecionados.map((t, i) => `${i + 1}. [${t.codigo}] ${t.descricao}`).join('\n');
  }

  // ── CID ──
  async filtrarCid(): Promise<void> {
    const termo = this.buscaCid?.trim().toLowerCase();
    if (!termo || termo.length < 2) { this.cidResultados = []; return; }
    const resultados = await this.codigosService.buscarCid(termo, this.MAX_AUTOCOMPLETE_RESULTS);
    // Descarta resposta atrasada se o usuário já digitou outra coisa durante o carregamento.
    if (this.buscaCid?.trim().toLowerCase() === termo) { this.cidResultados = resultados; }
  }

  adicionarCid(item: any): void {
    if (!this.cidSelecionados.some(c => c.codigo === item.codigo)) {
      this.cidSelecionados.push({ codigo: item.codigo, label: item.label });
      this.atualizarTextoCid();
    }
    this.buscaCid = '';
    this.cidResultados = [];
  }

  removerCid(index: number): void {
    this.cidSelecionados.splice(index, 1);
    this.atualizarTextoCid();
  }

  private atualizarTextoCid(): void {
    this.textoCid = this.cidSelecionados.length === 0 ? '' :
      this.cidSelecionados.map((c, i) => `${i + 1}. [${c.codigo}] ${c.label}`).join('\n');
  }

  // ── Solicitação de Exame — TUSS ──
  async filtrarTussExame(): Promise<void> {
    const termo = this.buscaTussExame?.trim().toLowerCase();
    if (!termo || termo.length < 2) { this.tussExameResultados = []; return; }
    const resultados = await this.codigosService.buscarTuss(termo, this.MAX_AUTOCOMPLETE_RESULTS);
    // Descarta resposta atrasada se o usuário já digitou outra coisa durante o carregamento.
    if (this.buscaTussExame?.trim().toLowerCase() === termo) { this.tussExameResultados = resultados; }
  }

  adicionarTussExame(item: any): void {
    if (!this.tussExameSelecionados.some(t => t.codigo === item.codigo)) {
      this.tussExameSelecionados.push({ codigo: item.codigo, descricao: item.descricao });
      this.atualizarTextoSolicitacaoExame();
    }
    this.buscaTussExame = '';
    this.tussExameResultados = [];
  }

  removerTussExame(index: number): void {
    this.tussExameSelecionados.splice(index, 1);
    this.atualizarTextoSolicitacaoExame();
  }

  // ── Solicitação de Exame — CID ──
  async filtrarCidExame(): Promise<void> {
    const termo = this.buscaCidExame?.trim().toLowerCase();
    if (!termo || termo.length < 2) { this.cidExameResultados = []; return; }
    const resultados = await this.codigosService.buscarCid(termo, this.MAX_AUTOCOMPLETE_RESULTS);
    // Descarta resposta atrasada se o usuário já digitou outra coisa durante o carregamento.
    if (this.buscaCidExame?.trim().toLowerCase() === termo) { this.cidExameResultados = resultados; }
  }

  adicionarCidExame(item: any): void {
    if (!this.cidExameSelecionados.some(c => c.codigo === item.codigo)) {
      this.cidExameSelecionados.push({ codigo: item.codigo, label: item.label });
      this.atualizarTextoSolicitacaoExame();
    }
    this.buscaCidExame = '';
    this.cidExameResultados = [];
  }

  removerCidExame(index: number): void {
    this.cidExameSelecionados.splice(index, 1);
    this.atualizarTextoSolicitacaoExame();
  }

  private atualizarTextoSolicitacaoExame(): void {
    const linhas: string[] = [];
    if (this.tussExameSelecionados.length > 0) {
      linhas.push('TUSS:');
      this.tussExameSelecionados.forEach((t, i) => linhas.push(`  ${i + 1}. [${t.codigo}] ${t.descricao}`));
    }
    if (this.cidExameSelecionados.length > 0) {
      if (linhas.length > 0) linhas.push('');
      linhas.push('CID:');
      this.cidExameSelecionados.forEach((c, i) => linhas.push(`  ${i + 1}. [${c.codigo}] ${c.label}`));
    }
    this.textoSolicitacaoExame = linhas.join('\n');
  }

  /**
   * Preenche os campos da aba com dados existentes (modo edição).
   * @param dados Objeto com os campos do prontuário
   */
  setDados(dados: any): void {
    if (!dados) return;
    this.Prescricao = dados.prescricao || '';
    this.textoTuss = dados.tussTexto || '';
    this.textoCid = dados.cidTexto || '';
    this.textoSolicitacaoExame = dados.solicitacaoExameTexto || '';
    // getDados() também devolve as listas selecionadas; sem elas (modo edição) mantém as atuais.
    if (Array.isArray(dados.tussSelecionados)) { this.tussSelecionados = [...dados.tussSelecionados]; }
    if (Array.isArray(dados.cidSelecionados)) { this.cidSelecionados = [...dados.cidSelecionados]; }
    if (Array.isArray(dados.tussExameSelecionados)) { this.tussExameSelecionados = [...dados.tussExameSelecionados]; }
    if (Array.isArray(dados.cidExameSelecionados)) { this.cidExameSelecionados = [...dados.cidExameSelecionados]; }
  }

  /**
   * Retorna os dados da aba para composição do payload de finalização.
   */
  getDados(): any {
    return {
      prescricao: this.Prescricao,
      tituloPrescricao: 'Prescrição Odontológica',
      tussSelecionados: this.tussSelecionados,
      cidSelecionados: this.cidSelecionados,
      tussTexto: this.textoTuss,
      cidTexto: this.textoCid,
      tussExameSelecionados: this.tussExameSelecionados,
      cidExameSelecionados: this.cidExameSelecionados,
      solicitacaoExameTexto: this.textoSolicitacaoExame,
    };
  }
}
