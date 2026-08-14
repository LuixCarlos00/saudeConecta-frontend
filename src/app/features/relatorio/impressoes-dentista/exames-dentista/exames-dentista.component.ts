import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-exames-dentista',
  templateUrl: './exames-dentista.component.html',
  styleUrls: ['./exames-dentista.component.css'],
})
export class ExamesDentistaComponent implements OnInit {

  dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeDentista = '';
  cro = '';
  emailDentista = '';
  telefoneDentista = '';

  // Dados do paciente
  nomePaciente = '';
  cpfPaciente = '';

  // Dados da solicitação
  dataSolicitacao = '';
  tituloExame = '';
  procedimentos = '';
  dataExame = '';

  // ID para o PDF
  codigoProntuario = '';

  constructor(
    public dialogRef: MatDialogRef<ExamesDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    const p = this.data;

    // ── Profissional ─────────────────────────────────────────────────────────
    // O profissional do dentista tem `registroConselho` em vez de `conselho`
    const prof = p.profissional as any;
    this.nomeDentista = prof?.nome?.trim() || '';
    this.cro = prof?.registroConselho?.trim() || prof?.conselho?.trim() || '';
    this.emailDentista = prof?.email?.trim() || '';
    this.telefoneDentista = prof?.telefone?.trim() || '';

    // ── Paciente ─────────────────────────────────────────────────────────────
    // Estrutura dentista: consulta.paciente.paciNome / paciCpf (campos com prefixo)
    // Fallbacks para estrutura médica: paciente.nome / pacienteNome
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

    // ── Solicitação / Procedimentos ───────────────────────────────────────────
    // Dentista usa `procedimentos` como conteúdo principal dos exames
    this.dataSolicitacao = p.dataPrescricao || p.dataExame || this.dataAtual;
    this.tituloExame = p.tituloExame?.trim() || 'PROCEDIMENTOS ODONTOLÓGICOS';
    this.procedimentos = p.solicitacaoExameTexto?.trim() || 'Nada a constar.';
    this.dataExame = p.dataExame || this.dataAtual;

    // ── Identificação ─────────────────────────────────────────────────────────
    this.codigoProntuario = String(p.codigo ?? p.codigoProntuario ?? '000000');

  }

  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  getHoraAtual(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  GerarPDF(): void {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 10;
    const w = pw - m * 2;
    let y = 12;

    this.pdfCabecalho(doc, pw, m, y);
    y += 12;

    y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomePaciente || '-' },
      { b: 'CPF:', t: this.cpfPaciente || '-' },
    ]], m, y, w);

    y = this.pdfSecao(doc, 'INFORMAÇÕES DA SOLICITAÇÃO', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Título:', t: this.tituloExame || '-' },
      { b: 'Solicitado em:', t: this.dataSolicitacao || '-' },
      { b: 'Data do procedimento:', t: this.dataExame || '-' },
    ]], m, y, w);

    y = this.pdfSecao(doc, 'DENTISTA SOLICITANTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomeDentista || '-' },
      { b: 'CRO:', t: this.cro || '-' },
      { b: 'Email:', t: this.emailDentista || '-' },
      { b: 'Tel.:', t: this.telefoneDentista || '-' },
    ]], m, y, w);

    y = this.pdfQuebraPagina(doc, y, 30, ph);
    y = this.pdfSecao(doc, 'PROCEDIMENTOS SOLICITADOS', m, y, w);
    y = this.pdfBlocoTexto(doc, this.procedimentos || '-', m, y, w, ph, 60);

    y = this.pdfQuebraPagina(doc, y, 34, ph);
    y = this.pdfSecao(doc, 'ASSINATURA', m, y, w);
    y = this.pdfAssinaturaProfissional(doc, m, y, w);
    y = this.pdfAviso(doc, 'Documento válido para apresentação em clínicas e laboratórios odontológicos.', m, y, w);

    this.pdfRodape(doc, pw, ph);

    doc.save(`Solicitacao_Procedimentos_${this.codigoProntuario}_${this.dataAtual}.pdf`);
  }

  /**
   * Adiciona nova pagina quando o espaco restante for insuficiente.
   *
   * @param doc documento em construcao
   * @param y posicao vertical atual
   * @param necessario altura necessaria para o proximo bloco
   * @param ph altura da pagina
   * @returns nova posicao vertical
   */
  private pdfQuebraPagina(doc: any, y: number, necessario: number, ph: number): number {
    if (y + necessario > ph - 12) {
      doc.addPage();
      return 8;
    }
    return y;
  }

  /**
   * Desenha o cabecalho do documento.
   *
   * @param doc documento em construcao
   * @param pw largura da pagina
   * @param m margem lateral
   * @param y posicao vertical inicial
   */
  private pdfCabecalho(doc: any, pw: number, m: number, y: number): void {
    const w = pw - m * 2;
    doc.setFillColor(44, 62, 80);
    doc.rect(m, y - 4, w, 10, 'F');
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('SOLICITAÇÃO DE PROCEDIMENTOS', pw / 2, y + 1, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario}`, pw / 2, y + 5, { align: 'center' });
  }

  /**
   * Desenha o titulo de uma secao.
   *
   * @param doc documento em construcao
   * @param titulo texto da secao
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @returns nova posicao vertical
   */
  private pdfSecao(doc: any, titulo: string, m: number, y: number, w: number): number {
    doc.setFillColor(107, 114, 128);
    doc.rect(m, y, 2, 5, 'F');
    doc.setFillColor(248, 249, 250);
    doc.rect(m + 2, y, w - 2, 5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(107, 114, 128);
    doc.text(titulo.toUpperCase(), m + 5, y + 3.5);
    return y + 6;
  }

  /**
   * Desenha uma tabela de celulas com rotulo em negrito.
   *
   * @param doc documento em construcao
   * @param rows linhas com as celulas
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @returns nova posicao vertical
   */
  private pdfTabela(doc: any, rows: any[][], m: number, y: number, w: number): number {
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);

    for (const row of rows) {
      const totalSpan = row.reduce((s: number, c: any) => s + (c.span || 1), 0);
      const colW = w / totalSpan;
      let x = m;
      let maxH = 4;

      const processados: Array<{ x: number; cw: number; lines: string[] }> = [];
      for (const cell of row) {
        const cw = colW * (cell.span || 1);
        const fullText = cell.t ? `${cell.b} ${cell.t}`.trim() : cell.b;
        const lines = doc.splitTextToSize(fullText, cw - 2);
        const h = Math.max(4.5, lines.length * 3.2 + 1);
        maxH = Math.max(maxH, h);
        processados.push({ x, cw, lines });
        x += cw;
      }

      for (const p of processados) {
        doc.rect(p.x, y, p.cw, maxH);
      }

      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      for (let ci = 0; ci < processados.length; ci++) {
        const p = processados[ci];
        const cell = row[ci];
        let ty = y + 2.8;
        for (let li = 0; li < p.lines.length; li++) {
          if (li === 0 && cell.b && cell.t) {
            doc.setFont('helvetica', 'bold');
            doc.text(cell.b + ' ', p.x + 1, ty);
            const bw = doc.getTextWidth(cell.b + ' ');
            doc.setFont('helvetica', 'normal');
            const rest = p.lines[0].substring(cell.b.length).trim();
            doc.text(rest, p.x + 1 + bw, ty);
          } else if (li === 0 && cell.b && !cell.t) {
            doc.setFont('helvetica', 'bold');
            doc.text(p.lines[0], p.x + 1, ty);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.text(p.lines[li], p.x + 1, ty);
          }
          ty += 3.2;
        }
      }

      y += maxH;
    }
    return y;
  }

  /**
   * Desenha um bloco de texto livre dentro de uma moldura, quebrando por pagina.
   *
   * @param doc documento em construcao
   * @param texto conteudo a ser escrito
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @param ph altura da pagina
   * @param alturaMinima altura minima da moldura
   * @returns nova posicao vertical
   */
  private pdfBlocoTexto(
    doc: any, texto: string, m: number, y: number,
    w: number, ph: number, alturaMinima: number
  ): number {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);

    let linhas: string[] = doc.splitTextToSize(texto || '-', w - 4);

    while (linhas.length > 0) {
      const disponivel = ph - 14 - y;
      if (disponivel < 12) {
        doc.addPage();
        y = 8;
        continue;
      }

      const cabem = Math.max(1, Math.floor((disponivel - 4) / 3.6));
      const bloco = linhas.slice(0, cabem);
      linhas = linhas.slice(cabem);

      const altura = Math.max(
        linhas.length === 0 ? alturaMinima : 0,
        bloco.length * 3.6 + 4
      );

      doc.setLineWidth(0.15);
      doc.setDrawColor(180, 180, 180);
      doc.rect(m, y, w, altura);

      let ty = y + 4.5;
      for (const linha of bloco) {
        doc.text(linha, m + 2, ty);
        ty += 3.6;
      }

      y += altura;
      if (linhas.length > 0) {
        doc.addPage();
        y = 8;
      }
    }
    return y;
  }

  /**
   * Desenha a linha de assinatura do profissional responsavel.
   *
   * @param doc documento em construcao
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @returns nova posicao vertical
   */
  private pdfAssinaturaProfissional(doc: any, m: number, y: number, w: number): number {
    const altura = 24;
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.rect(m, y, w, altura);

    doc.setDrawColor(107, 114, 128);
    doc.setLineWidth(0.2);
    doc.line(m + w / 2 - 30, y + 14, m + w / 2 + 30, y + 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(this.nomeDentista || 'Profissional', m + w / 2, y + 18, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text(`CRO: ${this.cro || '-'}`, m + w / 2, y + 21.5, { align: 'center' });

    return y + altura;
  }

  /**
   * Desenha a faixa de aviso do documento.
   *
   * @param doc documento em construcao
   * @param texto mensagem do aviso
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @returns nova posicao vertical
   */
  private pdfAviso(doc: any, texto: string, m: number, y: number, w: number): number {
    const altura = 5;
    doc.setFillColor(248, 249, 250);
    doc.rect(m, y, w, altura, 'F');
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.rect(m, y, w, altura);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(texto, m + w / 2, y + 3.4, { align: 'center' });
    return y + altura;
  }

  /**
   * Desenha o rodape em todas as paginas do documento.
   *
   * @param doc documento em construcao
   * @param pw largura da pagina
   * @param ph altura da pagina
   */
  private pdfRodape(doc: any, pw: number, ph: number): void {
    const total = doc.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor(107, 114, 128);
      doc.setLineWidth(0.3);
      doc.line(10, ph - 10, pw - 10, ph - 10);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Página ${i} de ${total} | Emitido em ${this.getDataAtual()} às ${this.getHoraAtual()} | Documento odontológico - Confidencial`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }
}
