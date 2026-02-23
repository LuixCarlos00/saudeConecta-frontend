import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-registro-consulta-dentista',
  templateUrl: './registro-consulta-dentista.component.html',
  styleUrls: ['./registro-consulta-dentista.component.css'],
})
export class RegistroConsultaDentistaComponent implements OnInit {

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
  emailPaciente = '';
  telefonePaciente = '';

  // Dados da consulta
  dataConsulta = '';
  horarioConsulta = '';
  diaSemana = '';
  statusConsulta = '';

  // Exame clínico odontológico
  higieneBucal = '';
  condicaoGengival = '';
  oclusal = '';
  atm = '';

  // Clínico textual
  queixaPrincipal = '';
  anamnese = '';
  diagnostico = '';
  planoTratamento = '';
  procedimentos = '';
  prescricao = '';
  orientacoes = '';
  observacao = '';

  // ID para o PDF
  codigoProntuario = '';

  constructor(
    public dialogRef: MatDialogRef<RegistroConsultaDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    const p = this.data;
    console.log('Dados recebidos para impressão (registro dentista):', p);

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
      ?? '';
    this.emailPaciente = paciente?.paciEmail?.trim()
      ?? paciente?.email?.trim()
      ?? '';
    this.telefonePaciente = paciente?.paciTelefone?.trim()
      ?? paciente?.telefone?.trim()
      ?? '';

    // ── Dados da consulta ─────────────────────────────────────────────────────
    const dataHora = consulta?.dataHora || '';
    if (dataHora) {
      const dt = new Date(dataHora);
      this.dataConsulta = dt.toLocaleDateString('pt-BR');
      this.horarioConsulta = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      this.diaSemana = dt.toLocaleDateString('pt-BR', { weekday: 'long' });
    }
    this.statusConsulta = consulta?.status || '';

    // ── Exame clínico odontológico ────────────────────────────────────────────
    this.higieneBucal = p.higieneBucal || '';
    this.condicaoGengival = p.condicaoGengival || '';
    this.oclusal = p.oclusal || '';
    this.atm = p.atm || '';

    // ── Campos clínicos textuais ──────────────────────────────────────────────
    this.queixaPrincipal = p.queixaPrincipal || '';
    this.anamnese = p.anamnese || '';
    this.diagnostico = p.diagnostico || '';
    this.planoTratamento = p.planoTratamento || '';
    this.procedimentos = p.procedimentos || '';
    this.prescricao = p.prescricao || '';
    this.orientacoes = p.orientacoes || '';
    this.observacao = p.observacao || '';

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigo ?? p.codigoProntuario ?? '000000');
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
    doc.text('REGISTRO DE CONSULTA ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
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
      { label: 'Data Nasc.', value: this.dataNascimento },
      { label: 'Email', value: this.emailPaciente },
      { label: 'Telefone', value: this.telefonePaciente },
    ], y, margin, pageWidth);
    y += 3;

    // Seção: Dados da Consulta
    y = this.adicionarSecaoVertical(doc, 'DADOS DA CONSULTA', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontal(doc, [
      { label: 'Data', value: this.dataConsulta },
      { label: 'Horário', value: this.horarioConsulta },
      { label: 'Dia da Semana', value: this.diaSemana },
      { label: 'Status', value: this.statusConsulta },
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

    // Seção: Exame Clínico — altura dinâmica para textos grandes
    y = this.adicionarSecaoVertical(doc, 'EXAME CLÍNICO', null, y, margin, pageWidth);
    y = this.adicionarCamposHorizontalDinamico(doc, [
      { label: 'Higiene Bucal', value: this.higieneBucal || '-' },
      { label: 'Cond. Gengival', value: this.condicaoGengival || '-' },
      { label: 'Oclusal', value: this.oclusal || '-' },
      { label: 'ATM', value: this.atm || '-' },
    ], y, margin, pageWidth);
    y += 3;

    // Seções textuais — renderiza apenas se preenchidas
    const secoesClincias: Array<{ titulo: string; valor: string; altura: number }> = [
      { titulo: 'QUEIXA PRINCIPAL', valor: this.queixaPrincipal, altura: 30 },
      { titulo: 'ANAMNESE', valor: this.anamnese, altura: 40 },
      { titulo: 'DIAGNÓSTICO', valor: this.diagnostico, altura: 40 },
      { titulo: 'PLANO DE TRATAMENTO', valor: this.planoTratamento, altura: 40 },
      { titulo: 'PROCEDIMENTOS REALIZADOS', valor: this.procedimentos, altura: 40 },
      { titulo: 'PRESCRIÇÃO ODONTOLÓGICA', valor: this.prescricao, altura: 40 },
      { titulo: 'ORIENTAÇÕES', valor: this.orientacoes, altura: 30 },
      { titulo: 'OBSERVAÇÕES', valor: this.observacao, altura: 30 },
    ];

    for (const secao of secoesClincias) {
      if (!secao.valor) { continue; }

      const espacoNecessario = 7.5 + secao.altura + 2;
      const resultado = this.verificarEspacoAdicionarPagina(doc, y, espacoNecessario, pageHeight, margin, pageWidth);
      y = resultado.y;
      paginaAtual += resultado.pagina;

      y = this.adicionarSecaoVertical(doc, secao.titulo, null, y, margin, pageWidth);

      doc.setLineWidth(0.1);
      doc.setDrawColor(150, 150, 150);
      doc.rect(margin, y, pageWidth - (margin * 2), secao.altura, 'D');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const linhas = doc.splitTextToSize(secao.valor, pageWidth - (margin * 2) - 4);
      const alturaTexto = linhas.length * 4;
      const alturaReal = Math.max(secao.altura, alturaTexto + 10);

      if (alturaReal > secao.altura) {
        const resultado2 = this.verificarEspacoAdicionarPagina(
          doc, y - 7.5, espacoNecessario + (alturaReal - secao.altura), pageHeight, margin, pageWidth
        );
        y = resultado2.y;
        paginaAtual += resultado2.pagina;
        y = this.adicionarSecaoVertical(doc, secao.titulo, null, y, margin, pageWidth);
        doc.rect(margin, y, pageWidth - (margin * 2), alturaReal, 'D');
      }

      doc.text(linhas, margin + 2, y + 8);
      y += alturaReal + 2;
    }

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
    doc.text('Documento de registro clínico - Confidencial', pageWidth - margin, footerY + 5, { align: 'right' });

    doc.save(`Registro_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  private adicionarSecaoVertical(
    doc: jsPDF, titulo: string, cor: string | null,
    y: number, margin: number, pageWidth: number
  ): number {
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

  private adicionarCamposHorizontal(
    doc: jsPDF, campos: Array<{ label: string; value: string }>,
    y: number, margin: number, pageWidth: number
  ): number {
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

  /**
   * Versão dinâmica: calcula a altura de cada coluna pelo texto real
   * e usa a maior — evita overflow em textos longos.
   */
  private adicionarCamposHorizontalDinamico(
    doc: jsPDF, campos: Array<{ label: string; value: string }>,
    y: number, margin: number, pageWidth: number
  ): number {
    const colunas = campos.length;
    const larguraColuna = (pageWidth - (margin * 2)) / colunas;
    const alturaMinima = 8;
    const linhaAltura = 4;

    // 1. Calcular as linhas de cada coluna
    const linhasPorCampo = campos.map(campo => {
      doc.setFontSize(8);
      return doc.splitTextToSize(campo.value || '-', larguraColuna - 4);
    });

    // 2. Altura de cada coluna; a maior vira a altura uniforme
    const alturaCampo = Math.max(
      alturaMinima,
      ...linhasPorCampo.map(linhas => linhas.length * linhaAltura + 6)
    );

    // 3. Bordas
    doc.setLineWidth(0.1);
    doc.setDrawColor(150, 150, 150);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna);
      doc.line(x, y - 2, x + larguraColuna, y - 2);
      doc.line(x, y + alturaCampo - 1, x + larguraColuna, y + alturaCampo - 1);
      if (index < colunas - 1) {
        doc.line(x + larguraColuna, y - 2, x + larguraColuna, y + alturaCampo - 1);
      }
    });

    // 4. Labels
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(102, 102, 102);
    campos.forEach((campo, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(campo.label.toUpperCase(), x, y);
    });

    // 5. Values com quebra de linha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    campos.forEach((_, index) => {
      const x = margin + (index * larguraColuna) + 2;
      doc.text(linhasPorCampo[index], x, y + 4);
    });

    return y + alturaCampo + 2;
  }

  private verificarEspacoAdicionarPagina(
    doc: jsPDF, y: number, espacoNecessario: number,
    pageHeight: number, margin: number, pageWidth: number
  ): { y: number; pagina: number } {
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
    doc.text('REGISTRO DE CONSULTA ODONTOLÓGICA', pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario} - Continuação`, pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }

  private hexToRgb(hex: string | null): { r: number; g: number; b: number } {
    if (!hex) { return { r: 0, g: 0, b: 0 }; }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 0, g: 0, b: 0 };
  }

  fechar() {
    this.dialogRef.close();
  }
}
