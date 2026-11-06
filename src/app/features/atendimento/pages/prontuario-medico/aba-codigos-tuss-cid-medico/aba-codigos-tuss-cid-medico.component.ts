import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NotificacaoService } from 'src/app/core/notificacao/notificacao.service';
import { CodigosTussCidService } from 'src/app/features/atendimento/data-access/codigos/codigos-tuss-cid.service';
import { extrairItensCodigo, extrairItensSolicitacaoExame } from 'src/app/shared/utils/codigos-tuss-cid';

@Component({
  selector: 'app-aba-codigos-tuss-cid-medico',
   templateUrl: './aba-codigos-tuss-cid-medico.component.html',
  styleUrl: '../prontuario-shared.scss',
  host: { style: 'display: block; width: 100%;' },
})
export class AbaCodigosTussCidMedicoComponent {

  private readonly MAX_AUTOCOMPLETE_RESULTS = 15;
  private readonly codigosService = inject(CodigosTussCidService);
  private readonly notificacao = inject(NotificacaoService);
  /** Já avisou da falha ao baixar as tabelas? Evita repetir o aviso a cada tecla até uma busca dar certo. */
  private avisouFalhaTabelas = false;

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
    const resultados = await this.buscarSeguro(() => this.codigosService.buscarTuss(termo, this.MAX_AUTOCOMPLETE_RESULTS));
    if (!resultados) { return; }
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
    const resultados = await this.buscarSeguro(() => this.codigosService.buscarCid(termo, this.MAX_AUTOCOMPLETE_RESULTS));
    if (!resultados) { return; }
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
    const resultados = await this.buscarSeguro(() => this.codigosService.buscarTuss(termo, this.MAX_AUTOCOMPLETE_RESULTS));
    if (!resultados) { return; }
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
    const resultados = await this.buscarSeguro(() => this.codigosService.buscarCid(termo, this.MAX_AUTOCOMPLETE_RESULTS));
    if (!resultados) { return; }
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
   * Preenche a aba com dados existentes (modo edição) ou com um rascunho.
   * As listas selecionadas só vêm no formato de getDadosRascunho(); sem elas, mantém as atuais.
   * @param dados Objeto com os campos da aba
   */
  setDados(dados: any): void {
    if (!dados) return;
    this.Prescricao = dados.prescricao || '';
    this.textoTuss = dados.tussTexto || '';
    this.textoCid = dados.cidTexto || '';
    this.textoSolicitacaoExame = dados.solicitacaoExameTexto || '';
    if (Array.isArray(dados.tussSelecionados)) { this.tussSelecionados = [...dados.tussSelecionados]; }
    else if (this.tussSelecionados.length === 0) {
      // Edição: o back guarda só o texto. Sem reconstruir a lista, adicionar um código apagaria o texto salvo.
      this.tussSelecionados = extrairItensCodigo(this.textoTuss);
    }
    if (Array.isArray(dados.cidSelecionados)) { this.cidSelecionados = [...dados.cidSelecionados]; }
    else if (this.cidSelecionados.length === 0) {
      this.cidSelecionados = extrairItensCodigo(this.textoCid).map(i => ({ codigo: i.codigo, label: i.descricao }));
    }
    const exames = extrairItensSolicitacaoExame(this.textoSolicitacaoExame);
    if (Array.isArray(dados.tussExameSelecionados)) { this.tussExameSelecionados = [...dados.tussExameSelecionados]; }
    else if (this.tussExameSelecionados.length === 0) { this.tussExameSelecionados = exames.tuss; }
    if (Array.isArray(dados.cidExameSelecionados)) { this.cidExameSelecionados = [...dados.cidExameSelecionados]; }
    else if (this.cidExameSelecionados.length === 0) {
      this.cidExameSelecionados = exames.cid.map(i => ({ codigo: i.codigo, label: i.descricao }));
    }
  }

  getDados(): any {
    return {
      prescricao: this.Prescricao,
      tituloPrescricao: 'Prescrição Médica',
      tussTexto: this.textoTuss,
      cidTexto: this.textoCid,
      solicitacaoExameTexto: this.textoSolicitacaoExame,
    };
  }

  /**
   * Retorna getDados() mais as listas selecionadas (TUSS/CID e exames), que não vão no payload final
   * mas são necessárias para o rascunho: sem elas, remover um item após restaurar apagaria o texto.
   */
  getDadosRascunho(): any {
    return {
      ...this.getDados(),
      tussSelecionados: this.tussSelecionados,
      cidSelecionados: this.cidSelecionados,
      tussExameSelecionados: this.tussExameSelecionados,
      cidExameSelecionados: this.cidExameSelecionados,
    };
  }

  /**
   * Executa uma busca nas tabelas TUSS/CID. Se o download da tabela falhar, avisa o usuário
   * (uma vez, até a próxima busca dar certo) em vez de deixar a promise rejeitada sem tratamento.
   *
   * @param busca função que consulta o CodigosTussCidService
   * @returns os resultados, ou null se a tabela não pôde ser carregada
   */
  private async buscarSeguro<T>(busca: () => Promise<T[]>): Promise<T[] | null> {
    try {
      const resultados = await busca();
      this.avisouFalhaTabelas = false;
      return resultados;
    } catch {
      if (!this.avisouFalhaTabelas) {
        this.avisouFalhaTabelas = true;
        this.notificacao.fire('Erro', 'Não foi possível carregar a tabela de códigos. Tente de novo.', 'error');
      }
      return null;
    }
  }
}
