import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-planejamento-dentista',
  templateUrl: './planejamento-dentista.component.html',
  styleUrls: ['./planejamento-dentista.component.css'],
})
export class PlanejamentoDentistaComponent implements OnInit {

  // Dados do profissional
  nomeDentista = '';
  cro = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da consulta
  consultaId = '';
  dataConsulta = '';
  horarioConsulta = '';
  codigoProntuario = '';

  // Planejamento
  planejamentos: any[] = [];
  totalPlanejamento = 0;
  possuiAssinatura = false;
  assinaturaUnica = { base64: '', dataAssinatura: '', ipOrigem: '' };

  constructor(
    public dialogRef: MatDialogRef<PlanejamentoDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    const p = this.data;

    // ── Profissional ──
    const prof = p.profissional as any;
    this.nomeDentista = prof?.nome?.trim() || '';
    this.cro = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';

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

    // ── Prontuário ──
    this.codigoProntuario = p.codigo?.toString() || p.codigoProntuario?.toString() || '';

    // ── Planejamentos (já disponíveis no dialog) ──
    const plans = p.planejamentosTerapeuticos || p.planejamentos || [];
    this.mapearPlanejamentos(plans);
  }

  private mapearPlanejamentos(plans: any[]): void {
    this.planejamentos = (plans || []).map((plan: any) => ({
      dataProcedimento: plan.dataProcedimento || '',
      procedimentoRealizado: plan.procedimentoRealizado || plan.procedimento || '',
      valor: plan.valor || 0,
      statusAssinatura: plan.statusAssinatura || 'PENDENTE',
      assinaturaBase64: plan.assinaturaBase64 || '',
      dataAssinatura: plan.dataAssinatura || '',
      ipOrigem: plan.ipOrigem || '',
    }));
    this.totalPlanejamento = this.planejamentos.reduce((acc, p) => acc + (p.valor || 0), 0);
    const assinado = this.planejamentos.find(p => p.statusAssinatura === 'ASSINADO' && p.assinaturaBase64);
    this.possuiAssinatura = !!assinado;
    this.assinaturaUnica = {
      base64: assinado?.assinaturaBase64 || '',
      dataAssinatura: assinado?.dataAssinatura || '',
      ipOrigem: assinado?.ipOrigem || ''
    };
  }

  fechar(): void {
    this.dialogRef.close();
  }

  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarData(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      const dt = new Date(dateStr);
      return dt.toLocaleDateString('pt-BR') + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  }

  GerarPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;

    // ── Cabeçalho (cinza escuro, sem cores) ──
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('PLANEJAMENTO ODONTOLÓGICO', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 35;

    // ── Dados do Profissional ──
    y = this.adicionarSecao(doc, 'DADOS DO PROFISSIONAL', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: this.nomeDentista },
      { label: 'CRO', value: this.cro },
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
    y = this.adicionarSecao(doc, 'DADOS DA CONSULTA', y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Consulta Nº', value: this.consultaId },
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
    ], y, margin, pageWidth);
    y += 3;

    // ── Tabela de Procedimentos ──
    if (this.planejamentos.length > 0) {
      y = this.adicionarSecao(doc, 'PROCEDIMENTOS DO PLANEJAMENTO', y, margin, pageWidth);

      // Header da tabela
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(80, 80, 80);
      doc.text('DATA', margin + 2, y + 4.5);
      doc.text('PROCEDIMENTO', margin + 40, y + 4.5);
      doc.text('VALOR', margin + 130, y + 4.5);
      doc.text('STATUS', margin + 155, y + 4.5);
      y += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);
      for (const item of this.planejamentos) {
        if (y > pageHeight - 30) {
          doc.addPage();
          y = 12;
        }
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y + 5, pageWidth - margin, y + 5);
        doc.text(item.dataProcedimento || '-', margin + 2, y + 4);
        const proc = doc.splitTextToSize(item.procedimentoRealizado || '-', 85);
        doc.text(proc, margin + 40, y + 4);
        doc.text(`R$ ${(item.valor || 0).toFixed(2)}`, margin + 130, y + 4);
        doc.text(item.statusAssinatura || 'PENDENTE', margin + 155, y + 4);
        y += Math.max(6, proc.length * 4);
      }

      // Total
      doc.setFillColor(248, 249, 250);
      doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('TOTAL', margin + 2, y + 5);
      doc.text(`R$ ${this.totalPlanejamento.toFixed(2)}`, margin + 130, y + 5);
      y += 12;
    }

    // ── Assinatura Digital (única) ──
    if (this.possuiAssinatura && this.assinaturaUnica.base64) {
      if (y > pageHeight - 60) {
        doc.addPage();
        y = 15;
      }
      y = this.adicionarSecao(doc, 'ASSINATURA DIGITAL', y, margin, pageWidth);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`Data/Hora: ${this.formatarData(this.assinaturaUnica.dataAssinatura)}`, margin + 4, y + 5);
      doc.text(`IP de Origem: ${this.assinaturaUnica.ipOrigem || '-'}`, margin + 4, y + 10);
      y += 15;

      try {
        const imgData = this.assinaturaUnica.base64.startsWith('data:')
          ? this.assinaturaUnica.base64
          : `data:image/png;base64,${this.assinaturaUnica.base64}`;
        doc.addImage(imgData, 'PNG', margin + 30, y, 60, 30);
        y += 35;
      } catch {
        doc.text('Assinatura digital registrada', margin + 4, y + 5);
        y += 10;
      }
    }

    // ── Rodapé ──
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, margin, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento clínico - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Planejamento_Odontologico_${this.codigoProntuario}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

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

  private adicionarCamposHorizontal(doc: jsPDF, campos: Array<{ label: string; value: string }>, y: number, margin: number, pageWidth: number): number {
    const colunas = campos.length;
    const largura = (pageWidth - (margin * 2)) / colunas;
    doc.setLineWidth(0.1);
    doc.setDrawColor(180, 180, 180);
    campos.forEach((_, i) => doc.rect(margin + (i * largura), y, largura, 10));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((c, i) => doc.text(c.label.toUpperCase(), margin + (i * largura) + 2, y + 3));
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((c, i) => doc.text(c.value || '-', margin + (i * largura) + 2, y + 7));
    return y + 10;
  }
}
