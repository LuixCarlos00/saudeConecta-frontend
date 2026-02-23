import { log } from 'node:console';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import { ProntuarioUnificado } from 'src/app/util/variados/interfaces/Prontuario/Prontuariounificado';

@Component({
  selector: 'app-ImprimirSoliciatacaoDeExames',
  templateUrl: './ImprimirSoliciatacaoDeExames.component.html',
  styleUrls: ['./ImprimirSoliciatacaoDeExames.component.css'],
})
export class ImprimirSoliciatacaoDeExamesComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeMedico = '';
  crm = '';
  emailMedico = '';
  telefoneMedico = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da solicitação
  dataSolicitacao = '';
  tituloExame = '';
  exame = '';
  dataExame = '';

  // ID para o PDF
  codigoProntuario = '';

  constructor(
    public dialogRef: MatDialogRef<ImprimirSoliciatacaoDeExamesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProntuarioUnificado
  ) { }

  ngOnInit() {
    const p = this.data;
    console.log('Dados recebidos para impressão:', p);
    // ── Profissional ─────────────────────────────────────────────────────────
    // A estrutura de profissional é a mesma para médico e dentista
    this.nomeMedico = (p.profissional as any)?.nome?.trim() || '';
    this.crm = (p.profissional as any)?.conselho?.trim() || '';
    this.emailMedico = (p.profissional as any)?.email?.trim() || '';
    this.telefoneMedico = (p.profissional as any)?.telefone?.trim() || '';

    // ── Paciente ─────────────────────────────────────────────────────────────
    // Médico:   consulta.pacienteNome / consulta.pacienteCpf  (ConsultaResponse)
    // Dentista: consulta.paciente.nome / consulta.paciente.cpf (objeto aninhado)
    const consulta = p.consulta as any;
    this.nomePaciente = consulta?.paciente?.nome?.trim()
      ?? consulta?.pacienteNome?.trim()
      ?? '';
    this.cpfPaciente = consulta?.paciente?.cpf?.trim()
      ?? consulta?.pacienteCpf?.trim()
      ?? '';

    // ── Solicitação de exames ─────────────────────────────────────────────────
    // Dentista usa "procedimentos" para o conteúdo dos exames
    this.dataSolicitacao = p.dataPrescricao || this.dataAtual;
    this.tituloExame = p.tituloExame?.trim() || 'SOLICITAÇÃO DE EXAMES';
    this.exame = p.procedimentos?.trim() || p.exame?.trim() || 'Exames a serem realizados conforme avaliação clínica.';
    this.dataExame = p.dataExame || this.dataAtual;

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigoProntuario ?? p.codigo ?? '000000');

    console.log('Dados para PDF:', {
      nomeMedico: this.nomeMedico,
      crm: this.crm,
      emailMedico: this.emailMedico,
      telefoneMedico: this.telefoneMedico,
      nomePaciente: this.nomePaciente,
      cpfPaciente: this.cpfPaciente,
      dataSolicitacao: this.dataSolicitacao,
      tituloExame: this.tituloExame,
      exame: this.exame,
      dataExame: this.dataExame,
      codigoProntuario: this.codigoProntuario,
      dataAtual: this.dataAtual,
      profissional: p.profissional,
      consulta: p.consulta,
      procedimentos: p.procedimentos

    });
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
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('SOLICITAÇÃO DE EXAMES', pageWidth / 2, 16, { align: 'center' });
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
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Profissional Solicitante
    const tituloProfissional = this.data.tipoProntuario === 'dentista' ? 'DENTISTA SOLICITANTE' : 'MÉDICO SOLICITANTE';
    y = this.adicionarSecaoVertical(doc, tituloProfissional, null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: `Dr. ${this.nomeMedico}` },
      { label: 'Conselho', value: this.crm },
      { label: 'Email', value: this.emailMedico },
      { label: 'Telefone', value: this.telefoneMedico },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Informações da Solicitação
    y = this.adicionarSecaoVertical(doc, 'INFORMAÇÕES DA SOLICITAÇÃO', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Título', value: this.tituloExame },
      { label: 'Data Solicitação', value: this.dataSolicitacao },
      { label: 'Data Exame', value: this.dataExame },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Exames / Procedimentos
    const tituloSecao = this.data.tipoProntuario === 'dentista' ? 'PROCEDIMENTOS SOLICITADOS' : 'EXAMES SOLICITADOS';
    const alturaCaixa = 50;
    const espacoNecessario = 7.5 + alturaCaixa + 2;

    const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
    y = resultado.y;
    paginaAtual += resultado.pagina;

    y = this.adicionarSecaoVertical(doc, tituloSecao, null, y, margin, pageWidth);

    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixa, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const linhas = doc.splitTextToSize(this.exame, pageWidth - (margin * 2) - 4);
    const alturaTexto = linhas.length * 4;
    const alturaReal = Math.max(alturaCaixa, alturaTexto + 10);

    if (alturaReal > alturaCaixa) {
      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + (alturaReal - alturaCaixa), pageHeight, margin, pageWidth);
      y = resultado2.y;
      paginaAtual += resultado2.pagina;
      y = this.adicionarSecaoVertical(doc, tituloSecao, null, y, margin, pageWidth);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
    }

    doc.text(linhas, margin + 2, y + 8);
    y += alturaReal + 2;

    // Rodapé
    const footerY = pageHeight - 15;
    doc.setLineWidth(0.3);
    doc.setDrawColor(52, 152, 219);
    doc.line(margin, footerY, pageWidth - margin, footerY);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(`Emitido em: ${this.dataAtual}`, margin, footerY + 5);
    doc.setFontSize(6);
    doc.text('Documento válido para apresentação em laboratórios e clínicas especializadas.', margin, footerY + 9);

    doc.save(`SolicitacaoExames_${this.codigoProntuario}_${this.dataSolicitacao}.pdf`);
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
    doc.text('SOLICITAÇÃO DE EXAMES', pageWidth / 2, 16, { align: 'center' });
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
