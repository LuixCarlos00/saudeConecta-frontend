import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-atestado-dentista',
  templateUrl: './atestado-dentista.component.html',
  styleUrls: ['./atestado-dentista.component.css'],
})
export class AtestadoDentistaComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeDentista = '';
  cro = '';
  emailDentista = '';
  telefoneDentista = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';
  dataNascimento = '';

  // Dados da consulta
  dataConsulta = '';
  horarioConsulta = '';
  diaSemana = '';

  // ID para o PDF
  codigoProntuario = '';

  constructor(
    public dialogRef: MatDialogRef<AtestadoDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    const p = this.data;
    console.log('Dados recebidos para impressão (atestado dentista):', p);

    // ── Profissional ─────────────────────────────────────────────────────────
    const prof = p.profissional as any;
    this.nomeDentista = prof?.nome?.trim() || '';
    this.cro = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';
    this.emailDentista = prof?.email?.trim() || '';
    this.telefoneDentista = prof?.telefone?.trim() || '';

    // ── Paciente ─────────────────────────────────────────────────────────────
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
    this.dataNascimento = paciente?.paciDataNacimento
      ?? paciente?.dataNascimento
      ?? consulta?.paciente?.dataNascimento
      ?? '';

    // ── Dados da consulta ─────────────────────────────────────────────────────
    const dataHora = consulta?.dataHora || '';
    if (dataHora) {
      const dt = new Date(dataHora);
      this.dataConsulta = dt.toLocaleDateString('pt-BR');
      this.horarioConsulta = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
    }

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigo ?? p.codigoProntuario ?? '000000');

    console.log('Dados para PDF (atestado dentista):', {
      nomeDentista: this.nomeDentista,
      cro: this.cro,
      nomePaciente: this.nomePaciente,
      cpfPaciente: this.cpfPaciente,
      dataNascimento: this.dataNascimento,
      dataConsulta: this.dataConsulta,
      horarioConsulta: this.horarioConsulta,
      diaSemana: this.diaSemana,
      codigoProntuario: this.codigoProntuario,
    });
  }

  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  GerarPDF() {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = 20;
    let paginaAtual = 1;

    // Cabeçalho
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ATESTADO ODONTOLÓGICO', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y = 35;

    // Seção: Dados do Paciente
    y = this.adicionarSecaoVertical(doc, 'DADOS DO PACIENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: this.nomePaciente },
      { label: 'CPF', value: this.cpfPaciente },
      { label: 'Data Nascimento', value: this.dataNascimento },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dados da Consulta
    y = this.adicionarSecaoVertical(doc, 'DADOS DA CONSULTA', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
      { label: 'Dia Semana', value: this.diaSemana },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dentista Atendente
    y = this.adicionarSecaoVertical(doc, 'DENTISTA ATENDENTE', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: `Dr. ${this.nomeDentista}` },
      { label: 'CRO', value: this.cro },
      { label: 'Email', value: this.emailDentista },
      { label: 'Telefone', value: this.telefoneDentista },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Declaração
    const alturaCaixaDeclaracao = 40;
    const espacoNecessarioDeclaracao = 7.5 + alturaCaixaDeclaracao + 2;

    const resultadoDeclaracao = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessarioDeclaracao, pageHeight, margin, pageWidth);
    y = resultadoDeclaracao.y;
    paginaAtual += resultadoDeclaracao.pagina;

    y = this.adicionarSecaoVertical(doc, 'DECLARAÇÃO', null, y, margin, pageWidth);

    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixaDeclaracao, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const declaracao = `Atesto para os devidos fins que o(a) paciente acima identificado(a) foi atendido(a) por mim na data e horário mencionados, necessitando de repouso por _______________________ .`;
    const linhas = doc.splitTextToSize(declaracao, pageWidth - (margin * 2) - 4);
    const alturaTexto = linhas.length * 4;
    const alturaReal = Math.max(alturaCaixaDeclaracao, alturaTexto + 10);

    if (alturaReal > alturaCaixaDeclaracao) {
      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessarioDeclaracao + (alturaReal - alturaCaixaDeclaracao), pageHeight, margin, pageWidth);
      y = resultado2.y;
      paginaAtual += resultado2.pagina;
      y = this.adicionarSecaoVertical(doc, 'DECLARAÇÃO', null, y, margin, pageWidth);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
    }

    doc.text(linhas, margin + 2, y + 8);
    y += alturaReal + 2;

    // Seção: Assinatura
    const resultadoAssinatura = this.verificarEspacoAdicionarPagina(doc, y, 30, pageHeight, margin, pageWidth);
    y = resultadoAssinatura.y;
    paginaAtual += resultadoAssinatura.pagina;

    y = this.adicionarSecaoVertical(doc, 'ASSINATURA', null, y, margin, pageWidth);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('Carimbo e Assinatura:', margin, y);

    doc.setLineWidth(0.2);
    doc.setDrawColor(100, 100, 100);
    doc.line(margin + 35, y, pageWidth - margin - 35, y);
    y += 10;

    doc.text(this.nomeDentista || '', pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text(`CRO: ${this.cro || ''}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(52, 152, 219);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.getDataAtual()} às ${this.getHoraAtual()}`, margin, footerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(153, 153, 153);
    doc.text('Documento válido apenas com assinatura e carimbo', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Atestado_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  private adicionarSecaoVertical(doc: jsPDF, titulo: string, cor: string | null, y: number, margin: number, pageWidth: number): number {
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    if (cor) {
      const rgb = this.hexToRgb(cor);
      doc.setFillColor(rgb.r, rgb.g, rgb.b);
      doc.rect(margin, y, 2, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rgb.r, rgb.g, rgb.b);
    } else {
      doc.setFillColor(100, 100, 100);
      doc.rect(margin, y, 2, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }
    doc.text(titulo.toUpperCase(), margin + 4, y + 4);
    doc.setTextColor(0, 0, 0);
    return y + 7.5;
  }

  private adicionarCamposHorizontal(doc: jsPDF, campos: Array<{ label: string; value: string }>, y: number, margin: number, pageWidth: number): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaCampo = 8;
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna);
      doc.line(x, y - 2, x + larguraColuna, y - 2);
      doc.line(x, y + alturaCampo - 1, x + larguraColuna, y + alturaCampo - 1);
      if (index < colunas - 1) {
        doc.line(x + larguraColuna, y - 2, x + larguraColuna, y + alturaCampo - 1);
      }
    });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y);
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      const texto = doc.splitTextToSize(campo.value || '-', larguraColuna - 4);
      doc.text(texto, x, y + 4);
    });
    return y + alturaCampo + 2;
  }

  private verificarEspacoAdicionarPagina(doc: jsPDF, y: number, espacoNecessario: number, pageHeight: number, margin: number, pageWidth: number): { y: number; pagina: number } {
    if (y + espacoNecessario > pageHeight - margin - 20) {
      doc.addPage();
      this.adicionarCabecalhoPagina(doc, pageWidth);
      return { y: 35, pagina: 1 };
    }
    return { y, pagina: 0 };
  }

  private adicionarCabecalhoPagina(doc: jsPDF, pageWidth: number): void {
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, pageWidth, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('ATESTADO ODONTOLÓGICO', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario} - Continuação`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  private hexToRgb(hex: string | null): { r: number; g: number; b: number } {
    if (!hex) return { r: 0, g: 0, b: 0 };
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }
}
