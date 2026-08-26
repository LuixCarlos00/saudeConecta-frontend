import { Prontuario } from 'src/app/util/variados/interfaces/Prontuario/Prontuario';
import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-prescricao-medico',
  templateUrl: './prescricao-medico.component.html',
  styleUrls: ['./prescricao-medico.component.css']
})
export class PrescricaoMedicoComponent implements OnInit {
   dataAtual = new Date().toISOString().split('T')[0];

  // Dados do profissional
  nomeMedico: string = '';
  crm: string = '';
  emailMedico: string = '';
  telefoneMedico: string = '';

  // Dados do paciente
  nomePaciente: string = '';
  cpfPaciente: string = '';

  // Dados da prescrição
  dataPrescricao: string = '';
  tituloPrescricao: string = '';
  prescricao: string = '';
  codigoProntuario: string = '';

  constructor(
    public dialogRef: MatDialogRef<PrescricaoMedicoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Prontuario) {}

  ngOnInit() {

    // Extrair dados do prontuário

    // Dados do profissional
    this.nomeMedico = this.data.profissional?.nome?.trim() || '';
    this.crm = this.data.profissional?.conselho?.trim() || '';
    this.emailMedico = this.data.profissional?.email?.trim() || '';
    this.telefoneMedico = this.data.profissional?.telefone?.trim() || '';

    // Dados do paciente
    this.nomePaciente = this.data.consulta?.pacienteNome?.trim() || '';
    this.cpfPaciente = this.data.consulta?.pacienteCpf?.trim() || '';

    // Dados da prescrição
    this.dataPrescricao = this.data.dataPrescricao || this.dataAtual;
    this.tituloPrescricao = this.data.tituloPrescricao?.trim() || 'PRESCRIÇÃO MÉDICA';
    this.prescricao = this.data.prescricao?.trim() || 'Nada a constar.';
    this.codigoProntuario = this.data.codigoProntuario?.toString() || '000000';
  }

  /**
   * Data atual formatada para o padrao brasileiro.
   *
   * @returns data no formato dd/mm/aaaa
   */
  getDataAtual(): string {
    return new Date().toLocaleDateString('pt-BR');
  }

  /**
   * Hora atual formatada para o padrao brasileiro.
   *
   * @returns hora no formato hh:mm
   */
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

    // ── Cabeçalho ──
    this.pdfCabecalho(doc, pw, m, y);
    y += 12;

    // ── Dados do Paciente ──
    y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomePaciente || '-' },
      { b: 'CPF:', t: this.cpfPaciente || '-' },
    ]], m, y, w);

    // ── Informações da Prescrição ──
    y = this.pdfSecao(doc, 'INFORMAÇÕES DA PRESCRIÇÃO', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Título:', t: this.tituloPrescricao || '-' },
      { b: 'Data:', t: this.dataPrescricao || '-' },
    ]], m, y, w);

    // ── Médico Prescritor ──
    y = this.pdfSecao(doc, 'MÉDICO PRESCRITOR', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomeMedico || '-' },
      { b: 'CRM:', t: this.crm || '-' },
      { b: 'Email:', t: this.emailMedico || '-' },
      { b: 'Tel.:', t: this.telefoneMedico || '-' },
    ]], m, y, w);

    // ── Medicamentos Prescritos ──
    y = this.pdfQuebraPagina(doc, y, 20, pw, ph, m);
    y = this.pdfSecao(doc, 'MEDICAMENTOS PRESCRITOS', m, y, w);
    y = this.pdfBlocoTexto(doc, this.prescricao || '-', m, y, w, ph);

    // ── Aviso ──
    y = this.pdfQuebraPagina(doc, y, 8, pw, ph, m);
    y = this.pdfAviso(doc, 'Uso conforme orientação médica. Não interrompa o tratamento sem consultar seu médico.', m, y, w);

    // ── Rodapé ──
    this.pdfRodape(doc, pw, ph);

    doc.save(`Prescricao_${this.codigoProntuario}_${this.dataPrescricao}.pdf`);
  }

  // ── Helpers PDF (padronizados com o registro de consulta) ────────────────

  /**
   * Adiciona nova pagina quando o espaco restante for insuficiente.
   *
   * @param doc documento em construcao
   * @param y posicao vertical atual
   * @param necessario altura necessaria para o proximo bloco
   * @param pw largura da pagina
   * @param ph altura da pagina
   * @param m margem lateral
   * @returns nova posicao vertical
   */
  private pdfQuebraPagina(doc: any, y: number, necessario: number, pw: number, ph: number, m: number): number {
    if (y + necessario > ph - 12) {
      doc.addPage();
      y = 8;
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
    doc.text('PRESCRIÇÃO MÉDICA', pw / 2, y + 1, { align: 'center' });
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
   * Desenha um bloco de texto livre com altura minima, quebrando pagina se necessario.
   *
   * @param doc documento em construcao
   * @param texto conteudo a ser impresso
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @param ph altura da pagina
   * @returns nova posicao vertical
   */
  private pdfBlocoTexto(doc: any, texto: string, m: number, y: number, w: number, ph: number): number {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(texto, w - 4);
    const alturaLinha = 3.6;
    const disponivel = ph - 14 - y;
    const cabemNaPagina = Math.max(1, Math.floor((disponivel - 4) / alturaLinha));

    if (linhas.length <= cabemNaPagina) {
      const altura = Math.max(30, linhas.length * alturaLinha + 4);
      doc.setLineWidth(0.15);
      doc.setDrawColor(180, 180, 180);
      doc.rect(m, y, w, altura);
      doc.setTextColor(30, 30, 30);
      doc.text(linhas, m + 2, y + 4);
      return y + altura;
    }

    // Texto longo: divide em blocos por pagina
    let restantes = [...linhas];
    let posicao = y;
    while (restantes.length > 0) {
      const espaco = ph - 14 - posicao;
      const cabem = Math.max(1, Math.floor((espaco - 4) / alturaLinha));
      const bloco = restantes.slice(0, cabem);
      restantes = restantes.slice(cabem);

      const altura = bloco.length * alturaLinha + 4;
      doc.setLineWidth(0.15);
      doc.setDrawColor(180, 180, 180);
      doc.rect(m, posicao, w, altura);
      doc.setTextColor(30, 30, 30);
      doc.text(bloco, m + 2, posicao + 4);
      posicao += altura;

      if (restantes.length > 0) {
        doc.addPage();
        posicao = 8;
      }
    }
    return posicao;
  }

  /**
   * Desenha a faixa de aviso legal do receituario.
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
        `Página ${i} de ${total} | Emitido em ${this.getDataAtual()} às ${this.getHoraAtual()} | Válido em farmácias e estabelecimentos de saúde`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }
}

