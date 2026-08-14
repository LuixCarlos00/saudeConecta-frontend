import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { ProntuarioDentistaApiService } from 'src/app/services/api/prontuario-dentista-api.service';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-questionario-saude-dentista',
  templateUrl: './questionario-saude-dentista.component.html',
  styleUrls: ['./questionario-saude-dentista.component.css'],
})
export class QuestionarioSaudeDentistaComponent implements OnInit, OnDestroy {

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

  // Questionário
  questionarioRespondido = false;
  questionarioStatus = '';
  questionarioPerguntas: { pergunta: string; resposta: string; observacao?: string }[] = [];
  questionarioAssinatura = '';
  questionarioDataAssinatura = '';
  questionarioIpOrigem = '';

  private readonly destroy$ = new Subject<void>();

  constructor(
    public dialogRef: MatDialogRef<QuestionarioSaudeDentistaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private prontuarioDentistaApi: ProntuarioDentistaApiService
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

    // ── Carregar Questionário ──
    const consultaId = consulta?.id || p.consultaId;
    if (consultaId) {
      this.carregarQuestionario(consultaId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private carregarQuestionario(consultaId: number): void {
    this.prontuarioDentistaApi.buscarQuestionarioSaude(consultaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.questionarioRespondido = resp?.respondido || false;
          this.questionarioStatus = resp?.status || '';
          this.questionarioAssinatura = resp?.assinaturaBase64 || '';
          this.questionarioDataAssinatura = resp?.dataAssinatura || '';
          this.questionarioIpOrigem = resp?.ipOrigem || '';

          if (resp?.respostasQuestionario) {
            try {
              const parsed = JSON.parse(resp.respostasQuestionario);
              this.questionarioPerguntas = this.mapearPerguntas(parsed);
            } catch {
              this.questionarioPerguntas = [];
            }
          }
        },
        error: () => {
          this.questionarioRespondido = false;
        }
      });
  }

  private mapearPerguntas(data: any): { pergunta: string; resposta: string; observacao?: string }[] {
    if (Array.isArray(data)) return data;
    return Object.entries(data).map(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'pergunta' in value && 'resposta' in value) {
        const v = value as { pergunta?: string; resposta?: string; observacao?: string };
        return { pergunta: v.pergunta || key, resposta: v.resposta || '', observacao: v.observacao || '' };
      }
      return { pergunta: key, resposta: typeof value === 'string' ? value : '', observacao: '' };
    });
  }

  formatarDataAssinatura(): string {
    if (!this.questionarioDataAssinatura) return '-';
    try {
      const dt = new Date(this.questionarioDataAssinatura);
      return dt.toLocaleDateString('pt-BR') + ' às ' + dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return this.questionarioDataAssinatura;
    }
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

    // ── Aviso de pendência ──
    if (!this.questionarioRespondido) {
      y = this.pdfAviso(doc, 'Questionário ainda não respondido ou não assinado pelo paciente.', m, y, w);
    }

    // ── Dados do Paciente ──
    y = this.pdfSecao(doc, 'DADOS DO PACIENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomePaciente || '-' },
      { b: 'CPF:', t: this.cpfPaciente || '-' },
    ]], m, y, w);

    // ── Dados da Consulta ──
    y = this.pdfSecao(doc, 'DADOS DA CONSULTA', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Consulta Nº:', t: this.consultaId || '-' },
      { b: 'Data:', t: this.dataConsulta || '-' },
      { b: 'Horário:', t: this.horarioConsulta || '-' },
      { b: 'Status:', t: this.questionarioStatus || 'PENDENTE' },
    ]], m, y, w);

    // ── Médico Atendente ──
    y = this.pdfSecao(doc, 'DENTISTA ATENDENTE', m, y, w);
    y = this.pdfTabela(doc, [[
      { b: 'Nome:', t: this.nomeDentista || '-' },
      { b: 'CRO:', t: this.cro || '-' },
    ]], m, y, w);

    // ── Respostas do Questionário ──
    if (this.questionarioPerguntas.length > 0) {
      y = this.pdfQuebraPagina(doc, y, 12, pw, ph, m);
      y = this.pdfSecao(doc, 'RESPOSTAS DO QUESTIONÁRIO', m, y, w);
      y = this.pdfTabela(doc, [[
        { b: 'PERGUNTA', t: '', span: 52 },
        { b: 'RESPOSTA', t: '', span: 13, centro: true },
        { b: 'OBSERVAÇÃO', t: '', span: 35 },
      ]], m, y, w);

      for (const item of this.questionarioPerguntas) {
        y = this.pdfQuebraPagina(doc, y, 6, pw, ph, m);
        y = this.pdfTabela(doc, [[
          { b: '', t: item.pergunta || '-', span: 52 },
          { b: '', t: item.resposta || '-', span: 13, centro: true },
          { b: '', t: item.observacao || '-', span: 35 },
        ]], m, y, w);
      }
    }

    // ── Assinatura Digital ──
    if (this.questionarioRespondido) {
      y = this.pdfQuebraPagina(doc, y, 40, pw, ph, m);
      y = this.pdfSecao(doc, 'ASSINATURA DIGITAL', m, y, w);
      y = this.pdfTabela(doc, [[
        { b: 'Data/Hora:', t: this.formatarDataAssinatura() },
        { b: 'IP de Origem:', t: this.questionarioIpOrigem || '-' },
      ]], m, y, w);

      y = this.pdfAssinatura(doc, m, y, w);
    }

    // ── Rodapé ──
    this.pdfRodape(doc, pw, ph);

    doc.save(`Questionario_Saude_Odontologico_${this.codigoProntuario || this.consultaId}_${new Date().toISOString().split('T')[0]}.pdf`);
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
    doc.text('QUESTIONÁRIO DE SAÚDE ODONTOLÓGICO', pw / 2, y + 1, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    doc.text(`Nº: ${this.codigoProntuario || this.consultaId}`, pw / 2, y + 5, { align: 'center' });
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
            this.pdfTextoCelula(doc, p.lines[0], p, cell, ty);
          } else {
            doc.setFont('helvetica', 'normal');
            this.pdfTextoCelula(doc, p.lines[li], p, cell, ty);
          }
          ty += 3.2;
        }
      }

      y += maxH;
    }
    return y;
  }

  /**
   * Escreve o texto de uma celula respeitando o alinhamento configurado.
   *
   * @param doc documento em construcao
   * @param texto linha a ser escrita
   * @param p posicao e largura da celula
   * @param cell definicao da celula
   * @param ty posicao vertical do texto
   */
  private pdfTextoCelula(doc: any, texto: string, p: { x: number; cw: number }, cell: any, ty: number): void {
    if (cell.centro) {
      doc.text(texto, p.x + p.cw / 2, ty, { align: 'center' });
      return;
    }
    doc.text(texto, p.x + 1, ty);
  }

  /**
   * Desenha a linha de aviso exibida quando o questionario esta pendente.
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
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(texto.toUpperCase(), m + 2, y + 3.4);
    return y + altura + 1;
  }

  /**
   * Desenha o quadro da assinatura do paciente.
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

    if (this.questionarioAssinatura) {
      const imgData = this.questionarioAssinatura.startsWith('data:')
        ? this.questionarioAssinatura
        : `data:image/png;base64,${this.questionarioAssinatura}`;
      try {
        doc.addImage(imgData, 'PNG', m + (w - 55) / 2, y + 2, 55, 18);
      } catch {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(107, 114, 128);
        doc.text('Assinatura digital registrada', m + w / 2, y + 12, { align: 'center' });
      }
    }

    doc.setDrawColor(107, 114, 128);
    doc.setLineWidth(0.25);
    doc.line(m + (w - 70) / 2, y + 22, m + (w + 70) / 2, y + 22);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text((this.nomePaciente || 'Paciente').toUpperCase(), m + w / 2, y + 26, { align: 'center' });

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
        `Página ${i} de ${total} | Emitido em ${this.getDataAtual()} às ${this.getHoraAtual()} | Confidencial`,
        pw / 2, ph - 7, { align: 'center' }
      );
    }
  }

}