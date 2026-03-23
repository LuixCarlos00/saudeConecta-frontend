import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-comprovante-pagamento-dentista',
  templateUrl: './comprovante-pagamento-dentista.component.html',
  styleUrls: ['./comprovante-pagamento-dentista.component.css'],
})
export class ComprovantePagamentoDentistaComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeDentista = '';
  cro = '';
  emailDentista = '';
  telefoneDentista = '';
  especialidade = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da consulta
  consultaId = '';
  dataConsulta = '';
  horarioConsulta = '';
  formaPagamento = '';
  valorConsulta = 0;
  codigoProntuario = '';

  // Planejamento Terapêutico
  planejamentos: Array<{
    dataProcedimento: string;
    procedimentoRealizado: string;
    valor: number;
  }> = [];
  totalPlanejamento = 0;

  constructor(
    public dialogRef: MatDialogRef<ComprovantePagamentoDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    const p = this.data;

    // ── Profissional ──
    const prof = p.profissional as any;
    this.nomeDentista = prof?.nome?.trim() || '';
    this.cro = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';
    this.emailDentista = prof?.email?.trim() || '';
    this.telefoneDentista = prof?.telefone?.trim() || '';
    // Especialidade pode vir como string (DTO) ou como Set (entidade)
    if (prof?.especialidade) {
      this.especialidade = prof.especialidade.trim();
    } else if (prof?.especialidades && prof.especialidades.length > 0) {
      this.especialidade = prof.especialidades[0]?.nome || '';
    } else if (Array.isArray(prof?.especialidades) === false && prof?.especialidades) {
      // Set serializado como objeto
      const keys = Object.keys(prof.especialidades);
      if (keys.length > 0) {
        this.especialidade = prof.especialidades[keys[0]]?.nome || '';
      }
    }

    // ── Paciente ──
    const consulta = p.consulta as any;
    const paciente = consulta?.paciente;
    this.nomePaciente = paciente?.paciNome?.trim()
      ?? paciente?.nome?.trim()
      ?? consulta?.pacienteNome?.trim()
      ?? '';
    this.cpfPaciente = paciente?.paciCpf?.trim()
      ?? paciente?.cpf?.trim()
      ?? consulta?.pacienteCpf?.trim()
      ?? '';

    // ── Consulta ──
    this.consultaId = consulta?.id?.toString() || '';
    if (consulta?.dataHora) {
      const dt = new Date(consulta.dataHora);
      this.dataConsulta = dt.toLocaleDateString('pt-BR');
      this.horarioConsulta = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    this.formaPagamento = consulta?.formaPagamento?.nome
      ?? consulta?.formaPagamentoNome
      ?? '';
    this.valorConsulta = consulta?.valor || 0;

    // ── Prontuário ──
    this.codigoProntuario = p.codigo?.toString() || p.codigoProntuario?.toString() || '';

    // ── Planejamento Terapêutico ──
    const plans = p.planejamentosTerapeuticos || p.planejamentos || [];
    this.planejamentos = plans.map((plan: any) => ({
      dataProcedimento: plan.dataProcedimento || '',
      procedimentoRealizado: plan.procedimentoRealizado || plan.procedimento || '',
      valor: plan.valor || 0,
    }));
    this.totalPlanejamento = this.planejamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
  }

  /**
   * Fecha o diálogo.
   */
  fechar(): void {
    this.dialogRef.close();
  }

  /**
   * Retorna a data atual formatada.
   */
  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  /**
   * Retorna a hora atual formatada.
   */
  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Formata valor monetário.
   */
  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Gera o PDF do comprovante de pagamento.
   */
  GerarPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    let y = 12;

    // ── Cabeçalho ──
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('COMPROVANTE DE PAGAMENTO - CONSULTA', pageWidth / 2, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Prontuário Nº ${this.codigoProntuario}`, pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, pageWidth / 2, 21, { align: 'center' });
    y = 30;

    // ── Dados do Profissional ──
    y = this.adicionarSecao(doc, 'DADOS DO PROFISSIONAL', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: this.nomeDentista },
      { label: 'CRO', value: this.cro },
      { label: 'Especialidade', value: this.especialidade },
    ], y, margin, pageWidth);
    y += 3;

    // ── Dados do Paciente ──
    y = this.adicionarSecao(doc, 'DADOS DO PACIENTE', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Paciente', value: this.nomePaciente },
      { label: 'CPF', value: this.cpfPaciente || '-' },
    ], y, margin, pageWidth);
    y += 3;

    // ── Dados da Consulta ──
    y = this.adicionarSecao(doc, 'INFORMAÇÕES DA CONSULTA', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Consulta Nº', value: this.consultaId },
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
      { label: 'Forma Pgto.', value: this.formaPagamento || '-' },
      { label: 'Valor Consulta', value: this.formatarMoeda(this.valorConsulta) },
    ], y, margin, pageWidth);
    y += 3;

    // ── Planejamento Terapêutico ──
    if (this.planejamentos.length > 0) {
      y = this.adicionarSecao(doc, 'PLANEJAMENTO TERAPÊUTICO', y, margin, pageWidth);

      const colWidths = [30, (pageWidth - (margin * 2) - 60), 30];

      // Header da tabela
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setLineWidth(0.1);
      doc.setDrawColor(180, 180, 180);
      doc.rect(margin, y, pageWidth - (margin * 2), 7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text('DATA', margin + 2, y + 4.5);
      doc.text('PROCEDIMENTO', margin + colWidths[0] + 2, y + 4.5);
      doc.text('VALOR', margin + colWidths[0] + colWidths[1] + 2, y + 4.5);
      y += 7;

      // Linhas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      for (const plan of this.planejamentos) {
        doc.setDrawColor(180, 180, 180);
        doc.rect(margin, y, pageWidth - (margin * 2), 6);
        doc.text(plan.dataProcedimento || '-', margin + 2, y + 4);
        doc.text(plan.procedimentoRealizado || '-', margin + colWidths[0] + 2, y + 4);
        doc.text(this.formatarMoeda(plan.valor), margin + colWidths[0] + colWidths[1] + 2, y + 4);
        y += 6;
      }

      // Total
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, pageWidth - (margin * 2), 8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('TOTAL PLANEJAMENTO:', margin + colWidths[0] + 2, y + 5.5);
      doc.text(this.formatarMoeda(this.totalPlanejamento), margin + colWidths[0] + colWidths[1] + 2, y + 5.5);
      y += 12;
    }

    // ── Resumo Financeiro ──
    y = this.adicionarSecao(doc, 'RESUMO FINANCEIRO', y, margin, pageWidth);

    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);

    // Valor Consulta
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 8, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Valor da Consulta:', margin + 4, y + 5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(this.formatarMoeda(this.valorConsulta), pageWidth - margin - 4, y + 5.5, { align: 'right' });
    y += 8;

    // Valor Planejamento
    if (this.totalPlanejamento > 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, pageWidth - (margin * 2), 8, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Total Planejamento Terapêutico:', margin + 4, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(this.formatarMoeda(this.totalPlanejamento), pageWidth - margin - 4, y + 5.5, { align: 'right' });
      y += 8;
    }

    // Total Geral
    const totalGeral = this.valorConsulta + this.totalPlanejamento;
    doc.setFillColor(44, 62, 80);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('TOTAL GERAL:', margin + 4, y + 7);
    doc.text(this.formatarMoeda(totalGeral), pageWidth - margin - 4, y + 7, { align: 'right' });
    y += 15;

    // ── Assinatura ──
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    const centroX = pageWidth / 2;
    doc.line(centroX - 40, y + 10, centroX + 40, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(this.nomeDentista, centroX, y + 15, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text(`CRO: ${this.cro}`, centroX, y + 19, { align: 'center' });

    // ── Rodapé ──
    const footerY = pageHeight - 12;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, margin, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento financeiro - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Comprovante_Pagamento_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  // ── Métodos auxiliares ──

  private adicionarSecao(doc: jsPDF, titulo: string, y: number, margin: number, pageWidth: number): number {
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    doc.setFillColor(100, 100, 100);
    doc.rect(margin, y, 2, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(titulo.toUpperCase(), margin + 4, y + 4);
    doc.setTextColor(0, 0, 0);
    return y + 7.5;
  }

  private adicionarCamposHorizontal(
    doc: jsPDF, campos: Array<{ label: string; value: string }>,
    y: number, margin: number, pageWidth: number
  ): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaCampo = 10;

    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna);
      doc.rect(x, y, larguraColuna, alturaCampo);
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y + 3);
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      const texto = doc.splitTextToSize(campo.value || '-', larguraColuna - 4);
      doc.text(texto, x, y + 7);
    });
    return y + alturaCampo;
  }

}
