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
   * Gera o PDF do comprovante de pagamento odontologico.
   */
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

    y = this.pdfSecao(doc, 'INFORMAÇÕES DA CONSULTA', m, y, w);
    y = this.pdfTabela(doc, [
      [
        { b: 'Consulta Nº:', t: this.consultaId || '-' },
        { b: 'Data:', t: this.dataConsulta || '-' },
        { b: 'Horário:', t: this.horarioConsulta || '-' },
      ],
      [
        { b: 'Forma Pgto.:', t: this.formaPagamento || '-' },
        { b: 'Valor Consulta:', t: this.formatarMoeda(this.valorConsulta), span: 2 },
      ],
    ], m, y, w);

    y = this.pdfSecao(doc, 'DENTISTA RESPONSÁVEL', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomeDentista || '-' },
      { b: 'CRO:', t: this.cro || '-' },
      { b: 'Especialidade:', t: this.especialidade || '-' },
    ], [
      { b: 'Email:', t: this.emailDentista || '-' },
      { b: 'Telefone:', t: this.telefoneDentista || '-' },
      { b: ' ', t: '' },
    ]], m, y, w);

    if (this.planejamentos.length > 0) {
      y = this.pdfQuebraPagina(doc, y, 20, ph);
      y = this.pdfSecao(doc, 'PLANEJAMENTO TERAPÊUTICO', m, y, w);
      y = this.pdfTabelaPlanejamento(doc, m, y, w, ph);
    }

    y = this.pdfQuebraPagina(doc, y, 25, ph);
    y = this.pdfSecao(doc, 'RESUMO FINANCEIRO', m, y, w);
    y = this.pdfLinhaValor(doc, 'Valor da Consulta', this.formatarMoeda(this.valorConsulta), m, y, w, false);
    if (this.totalPlanejamento > 0) {
      y = this.pdfLinhaValor(doc, 'Total Planejamento Terapêutico', this.formatarMoeda(this.totalPlanejamento), m, y, w, false);
    }
    y = this.pdfLinhaValor(
      doc, 'TOTAL GERAL',
      this.formatarMoeda(this.valorConsulta + this.totalPlanejamento),
      m, y, w, true
    );

    y = this.pdfQuebraPagina(doc, y, 30, ph);
    y = this.pdfSecao(doc, 'ASSINATURA DO PROFISSIONAL', m, y, w);
    y = this.pdfAssinaturaProfissional(doc, m, y, w);

    this.pdfRodape(doc, pw, ph);

    doc.save(`Comprovante_Pagamento_Odontologico_${this.codigoProntuario}_${this.dataAtual}.pdf`);
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
    doc.text('COMPROVANTE DE PAGAMENTO - CONSULTA ODONTOLÓGICA', pw / 2, y + 1, { align: 'center' });
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
   * Desenha a tabela do planejamento terapeutico com cabecalho, linhas e total.
   *
   * @param doc documento em construcao
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @param ph altura da pagina
   * @returns nova posicao vertical
   */
  private pdfTabelaPlanejamento(doc: any, m: number, y: number, w: number, ph: number): number {
    const cols = [w * 0.18, w * 0.62, w * 0.20];
    const xs = [m, m + cols[0], m + cols[0] + cols[1]];

    y = this.pdfCabecalhoPlanejamento(doc, xs, cols, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    for (const item of this.planejamentos) {
      const proc = doc.splitTextToSize(item.procedimentoRealizado || '-', cols[1] - 2);
      const h = Math.max(4.5, proc.length * 3.2 + 1);

      if (y + h > ph - 14) {
        doc.addPage();
        y = 8;
        y = this.pdfCabecalhoPlanejamento(doc, xs, cols, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }

      doc.setLineWidth(0.15);
      doc.setDrawColor(180, 180, 180);
      for (let i = 0; i < cols.length; i++) {
        doc.rect(xs[i], y, cols[i], h);
      }

      doc.setTextColor(30, 30, 30);
      doc.text(item.dataProcedimento || '-', xs[0] + 1, y + 2.8);
      doc.text(proc, xs[1] + 1, y + 2.8);
      doc.text(this.formatarMoeda(item.valor || 0), xs[2] + cols[2] - 1, y + 2.8, { align: 'right' });

      y += h;
    }

    if (y + 5 > ph - 14) {
      doc.addPage();
      y = 8;
    }
    doc.setFillColor(243, 244, 246);
    doc.rect(m, y, w, 5, 'F');
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.rect(m, y, w, 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('TOTAL PLANEJAMENTO', m + 1, y + 3.4);
    doc.text(this.formatarMoeda(this.totalPlanejamento), xs[2] + cols[2] - 1, y + 3.4, { align: 'right' });

    return y + 5;
  }

  /**
   * Desenha a faixa de cabecalho da tabela do planejamento.
   *
   * @param doc documento em construcao
   * @param xs posicoes horizontais das colunas
   * @param cols larguras das colunas
   * @param y posicao vertical atual
   * @returns nova posicao vertical
   */
  private pdfCabecalhoPlanejamento(doc: any, xs: number[], cols: number[], y: number): number {
    const altura = 5;
    doc.setFillColor(243, 244, 246);
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);

    const titulos = ['DATA', 'PROCEDIMENTO', 'VALOR'];
    for (let i = 0; i < cols.length; i++) {
      doc.rect(xs[i], y, cols[i], altura, 'F');
      doc.rect(xs[i], y, cols[i], altura);
      doc.text(titulos[i], xs[i] + 1, y + 3.4);
    }
    return y + altura;
  }

  /**
   * Desenha uma linha do resumo financeiro com valor alinhado a direita.
   *
   * @param doc documento em construcao
   * @param rotulo descricao do valor
   * @param valor valor ja formatado
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @param destaque aplica fundo cinza e negrito quando verdadeiro
   * @returns nova posicao vertical
   */
  private pdfLinhaValor(
    doc: any, rotulo: string, valor: string,
    m: number, y: number, w: number, destaque: boolean
  ): number {
    const altura = 5.5;
    if (destaque) {
      doc.setFillColor(243, 244, 246);
      doc.rect(m, y, w, altura, 'F');
    }
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.rect(m, y, w, altura);

    doc.setFontSize(8);
    doc.setFont('helvetica', destaque ? 'bold' : 'normal');
    doc.setTextColor(destaque ? 17 : 55, destaque ? 24 : 65, destaque ? 39 : 81);
    doc.text(rotulo, m + 1, y + 3.7);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, m + w - 1, y + 3.7, { align: 'right' });

    return y + altura;
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
        `Página ${i} de ${total} | Emitido em ${this.getDataAtual()} às ${this.getHoraAtual()} | Documento financeiro - Confidencial`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }
}
