import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-prescricao-dentista',
  templateUrl: './prescricao-dentista.component.html',
  styleUrls: ['./prescricao-dentista.component.css'],
})
export class PrescricaoDentistaComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeDentista = '';
  cro = '';
  emailDentista = '';
  telefoneDentista = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da prescrição
  dataPrescricao = '';
  tituloPrescricao = '';
  prescricao = '';

  // ID para o PDF
  codigoProntuario = '';

  constructor(
    public dialogRef: MatDialogRef<PrescricaoDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    const p = this.data;
    console.log('Dados recebidos para impressão (prescrição dentista):', p);

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

    // ── Prescrição ────────────────────────────────────────────────────────────
    this.dataPrescricao = p.dataPrescricao || this.dataAtual;
    this.tituloPrescricao = p.tituloPrescricao?.trim() || 'PRESCRIÇÃO ODONTOLÓGICA';
    this.prescricao = p.prescricao?.trim() || 'Medicamentos conforme prescrição odontológica.';

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigo ?? p.codigoProntuario ?? '000000');

    console.log('Dados para PDF (prescrição dentista):', {
      nomeDentista: this.nomeDentista,
      cro: this.cro,
      nomePaciente: this.nomePaciente,
      cpfPaciente: this.cpfPaciente,
      tituloPrescricao: this.tituloPrescricao,
      dataPrescricao: this.dataPrescricao,
      codigoProntuario: this.codigoProntuario,
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
    doc.text('PRESCRIÇÃO ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
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

    // Seção: Dentista Prescritor
    y = this.adicionarSecaoVertical(doc, 'DENTISTA PRESCRITOR', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Nome', value: `Dr. ${this.nomeDentista}` },
      { label: 'CRO', value: this.cro },
      { label: 'Email', value: this.emailDentista },
      { label: 'Telefone', value: this.telefoneDentista },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Informações da Prescrição
    y = this.adicionarSecaoVertical(doc, 'INFORMAÇÕES DA PRESCRIÇÃO', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Título', value: this.tituloPrescricao },
      { label: 'Data Prescrição', value: this.dataPrescricao },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Medicamentos Prescritos
    const alturaCaixaPrescricao = 60;
    const espacoNecessario = 7.5 + alturaCaixaPrescricao + 2;

    const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
    y = resultado.y;
    paginaAtual += resultado.pagina;

    y = this.adicionarSecaoVertical(doc, 'MEDICAMENTOS PRESCRITOS', null, y, margin, pageWidth);

    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), alturaCaixaPrescricao, 'D');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const linhas = doc.splitTextToSize(this.prescricao, pageWidth - (margin * 2) - 4);
    const alturaTexto = linhas.length * 4;
    const alturaReal = Math.max(alturaCaixaPrescricao, alturaTexto + 10);

    if (alturaReal > alturaCaixaPrescricao) {
      const resultado2 = this.verificarEspacoAdicionarPagina(doc, y - 7.5, espacoNecessario + (alturaReal - alturaCaixaPrescricao), pageHeight, margin, pageWidth);
      y = resultado2.y;
      paginaAtual += resultado2.pagina;
      y = this.adicionarSecaoVertical(doc, 'MEDICAMENTOS PRESCRITOS', null, y, margin, pageWidth);
      doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
    }

    doc.text(linhas, margin + 2, y + 8);
    y += alturaReal + 2;

    // Aviso
    const resultadoAviso = this.verificarEspacoAdicionarPagina(doc, y, 12, pageHeight, margin, pageWidth);
    y = resultadoAviso.y;
    paginaAtual += resultadoAviso.pagina;

    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(150, 150, 150);
    doc.rect(margin, y, pageWidth - (margin * 2), 10, 'FD');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Uso conforme orientação odontológica. Não interrompa o tratamento sem consultar seu dentista.', pageWidth / 2, y + 6, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 12;

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
    doc.text('Documento válido para apresentação em farmácias e estabelecimentos de saúde.', margin, footerY + 9);

    doc.save(`Prescricao_${this.codigoProntuario}_${this.dataPrescricao}.pdf`);
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
    doc.text('PRESCRIÇÃO ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
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
