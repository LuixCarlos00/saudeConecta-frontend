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
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const m = 10;
    const w = pw - m * 2;
    let y = 12;

    this.pdfCabecalho(doc, pw, m, y);
    y += 12;

    if (!this.possuiAssinatura) {
      y = this.pdfAviso(doc, 'Planejamento ainda não assinado pelo paciente.', m, y, w);
    }

    y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomePaciente || '-' },
      { b: 'CPF:', t: this.cpfPaciente || '-' },
    ]], m, y, w);

    y = this.pdfSecao(doc, 'DADOS DA CONSULTA', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Consulta Nº:', t: this.consultaId || '-' },
      { b: 'Data:', t: this.dataConsulta || '-' },
      { b: 'Horário:', t: this.horarioConsulta || '-' },
    ]], m, y, w);

    y = this.pdfSecao(doc, 'DENTISTA RESPONSÁVEL', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomeDentista || '-' },
      { b: 'CRO:', t: this.cro || '-' },
    ]], m, y, w);

    y = this.pdfQuebraPagina(doc, y, 20, ph);
    y = this.pdfSecao(doc, 'PROCEDIMENTOS DO PLANEJAMENTO', m, y, w);
    y = this.pdfTabelaProcedimentos(doc, m, y, w, ph);

    if (this.possuiAssinatura) {
      y = this.pdfQuebraPagina(doc, y, 50, ph);
      y = this.pdfSecao(doc, 'ASSINATURA DIGITAL', m, y, w);
      y = this.pdfTabela(doc, [[
        { b: 'Data/Hora:', t: this.formatarData(this.assinaturaUnica.dataAssinatura) },
        { b: 'IP de Origem:', t: this.assinaturaUnica.ipOrigem || '-' },
      ]], m, y, w);
      y = this.pdfAssinatura(doc, m, y, w);
    }

    this.pdfRodape(doc, pw, ph);

    doc.save(`Planejamento_Odontologico_${this.codigoProntuario}_${new Date().toISOString().split('T')[0]}.pdf`);
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
    doc.text('PLANEJAMENTO ODONTOLÓGICO', pw / 2, y + 1, { align: 'center' });
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
   * Desenha a tabela de procedimentos com cabecalho, linhas e total.
   *
   * @param doc documento em construcao
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @param ph altura da pagina
   * @returns nova posicao vertical
   */
  private pdfTabelaProcedimentos(doc: any, m: number, y: number, w: number, ph: number): number {
    if (this.planejamentos.length === 0) {
      doc.setLineWidth(0.15);
      doc.setDrawColor(180, 180, 180);
      doc.rect(m, y, w, 10);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Nenhum procedimento adicionado ao planejamento.', m + w / 2, y + 6, { align: 'center' });
      return y + 10;
    }

    const cols = [w * 0.18, w * 0.44, w * 0.18, w * 0.20];
    const xs = [m, m + cols[0], m + cols[0] + cols[1], m + cols[0] + cols[1] + cols[2]];

    y = this.pdfCabecalhoProcedimentos(doc, xs, cols, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    for (const item of this.planejamentos) {
      const proc = doc.splitTextToSize(item.procedimentoRealizado || '-', cols[1] - 2);
      const h = Math.max(4.5, proc.length * 3.2 + 1);

      if (y + h > ph - 14) {
        doc.addPage();
        y = 8;
        y = this.pdfCabecalhoProcedimentos(doc, xs, cols, y);
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
      doc.text(`R$ ${(item.valor || 0).toFixed(2)}`, xs[2] + cols[2] - 1, y + 2.8, { align: 'right' });
      doc.text(item.statusAssinatura || 'PENDENTE', xs[3] + cols[3] / 2, y + 2.8, { align: 'center' });

      y += h;
    }

    // Linha de total
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
    doc.text('TOTAL', m + 1, y + 3.4);
    doc.text(`R$ ${this.totalPlanejamento.toFixed(2)}`, xs[2] + cols[2] - 1, y + 3.4, { align: 'right' });

    return y + 5;
  }

  /**
   * Desenha a faixa de cabecalho da tabela de procedimentos.
   *
   * @param doc documento em construcao
   * @param xs posicoes horizontais das colunas
   * @param cols larguras das colunas
   * @param y posicao vertical atual
   * @returns nova posicao vertical
   */
  private pdfCabecalhoProcedimentos(doc: any, xs: number[], cols: number[], y: number): number {
    const altura = 5;
    doc.setFillColor(243, 244, 246);
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);

    const titulos = ['DATA', 'PROCEDIMENTO', 'VALOR', 'ASSINATURA'];
    for (let i = 0; i < cols.length; i++) {
      doc.rect(xs[i], y, cols[i], altura, 'F');
      doc.rect(xs[i], y, cols[i], altura);
      doc.text(titulos[i], xs[i] + 1, y + 3.4);
    }
    return y + altura;
  }

  /**
   * Desenha a imagem da assinatura do paciente.
   *
   * @param doc documento em construcao
   * @param m margem lateral
   * @param y posicao vertical atual
   * @param w largura util
   * @returns nova posicao vertical
   */
  private pdfAssinatura(doc: any, m: number, y: number, w: number): number {
    const altura = 30;
    doc.setLineWidth(0.15);
    doc.setDrawColor(180, 180, 180);
    doc.rect(m, y, w, altura);

    if (this.assinaturaUnica.base64) {
      try {
        const imgData = this.assinaturaUnica.base64.startsWith('data:')
          ? this.assinaturaUnica.base64
          : `data:image/png;base64,${this.assinaturaUnica.base64}`;
        doc.addImage(imgData, 'PNG', m + w / 2 - 25, y + 2, 50, 18);
      } catch {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);
        doc.text('Assinatura digital registrada', m + w / 2, y + 12, { align: 'center' });
      }
    }

    doc.setDrawColor(107, 114, 128);
    doc.setLineWidth(0.2);
    doc.line(m + w / 2 - 30, y + 22, m + w / 2 + 30, y + 22);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(this.nomePaciente || 'Paciente', m + w / 2, y + 26, { align: 'center' });

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

